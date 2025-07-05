import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { AuthService } from "./services/auth";
import { ScraperService } from "./services/scraper";
import { GeminiService } from "./services/gemini";
import { PDFService } from "./services/pdf";
import { loginSchema, insertScrapingJobSchema } from "@shared/schema";

// Extend session data interface
declare module "express-session" {
  interface SessionData {
    userId?: number;
    user?: {
      id: number;
      username: string;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const user = await AuthService.login(loginData);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
      };

      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username } 
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  // Scraping routes
  app.post("/api/scrape", requireAuth, async (req, res) => {
    try {
      const jobData = insertScrapingJobSchema.parse(req.body);
      
      // Create scraping job
      const job = await storage.createScrapingJob({
        ...jobData,
        userId: req.session.userId!,
      });

      // Start scraping in background
      setImmediate(async () => {
        try {
          await storage.updateScrapingJobStatus(job.id, "processing");
          
          const questions = await ScraperService.scrapeQuestions({
            topic: job.topic,
            keyword: job.keyword,
            timeFilter: job.timeFilter || undefined,
            limit: job.questionLimit || 20,
          });

          // Save questions to storage
          for (const questionData of questions) {
            await storage.createQuestion({
              ...questionData,
              jobId: job.id,
            });
          }

          await storage.updateScrapingJobStatus(job.id, "completed");
        } catch (error) {
          console.error("Scraping error:", error);
          await storage.updateScrapingJobStatus(job.id, "failed");
        }
      });

      res.json({ jobId: job.id });
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.get("/api/jobs/:jobId", requireAuth, async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getScrapingJob(jobId);
      
      if (!job || job.userId !== req.session.userId) {
        return res.status(404).json({ error: "Job not found" });
      }

      const questions = await storage.getQuestionsByJobId(jobId);
      
      res.json({ job, questions });
    } catch (error) {
      res.status(500).json({ error: "Failed to get job info" });
    }
  });

  app.get("/api/jobs", requireAuth, async (req, res) => {
    try {
      const jobs = await storage.getScrapingJobsByUserId(req.session.userId!);
      res.json({ jobs });
    } catch (error) {
      res.status(500).json({ error: "Failed to get jobs" });
    }
  });

  app.post("/api/questions/:questionId/select", requireAuth, async (req, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const { selected } = req.body;
      
      await storage.updateQuestionSelection(questionId, selected);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update question selection" });
    }
  });

  // AI answer generation
  app.post("/api/jobs/:jobId/generate-answers", requireAuth, async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getScrapingJob(jobId);
      
      if (!job || job.userId !== req.session.userId) {
        return res.status(404).json({ error: "Job not found" });
      }

      const questions = await storage.getQuestionsByJobId(jobId);
      const selectedQuestions = questions.filter(q => q.selected);

      if (selectedQuestions.length === 0) {
        return res.status(400).json({ error: "No questions selected" });
      }

      const geminiService = new GeminiService();
      
      // Generate answers in background
      setImmediate(async () => {
        try {
          for (const question of selectedQuestions) {
            const answer = await geminiService.generateAnswer(question.question);
            await storage.createAnswer({
              questionId: question.id,
              answer,
            });
          }
        } catch (error) {
          console.error("Answer generation error:", error);
        }
      });

      res.json({ success: true, count: selectedQuestions.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate answers" });
    }
  });

  app.get("/api/jobs/:jobId/answers", requireAuth, async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getScrapingJob(jobId);
      
      if (!job || job.userId !== req.session.userId) {
        return res.status(404).json({ error: "Job not found" });
      }

      const answers = await storage.getAnswersByJobId(jobId);
      res.json({ answers });
    } catch (error) {
      res.status(500).json({ error: "Failed to get answers" });
    }
  });

  // PDF export
  app.get("/api/jobs/:jobId/export-pdf", requireAuth, async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getScrapingJob(jobId);
      
      if (!job || job.userId !== req.session.userId) {
        return res.status(404).json({ error: "Job not found" });
      }

      const answers = await storage.getAnswersByJobId(jobId);
      
      if (answers.length === 0) {
        return res.status(400).json({ error: "No answers to export" });
      }

      const qaData = answers.map(answer => ({
        question: answer.question.question,
        answer: answer.answer,
        link: answer.question.link,
      }));

      const pdfBuffer = await PDFService.generatePDF(qaData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="quora-qa-export-${jobId}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF export error:", error);
      res.status(500).json({ error: "Failed to export PDF" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const jobs = await storage.getScrapingJobsByUserId(req.session.userId!);
      const completedJobs = jobs.filter(job => job.status === "completed");
      const activeJobs = jobs.filter(job => job.status === "processing");
      
      let totalQuestions = 0;
      let totalAnswers = 0;
      let totalPDFs = 0;

      for (const job of completedJobs) {
        const questions = await storage.getQuestionsByJobId(job.id);
        totalQuestions += questions.length;
        
        const answers = await storage.getAnswersByJobId(job.id);
        totalAnswers += answers.length;
        
        if (answers.length > 0) {
          totalPDFs += 1;
        }
      }

      res.json({
        questionsScraped: totalQuestions,
        answersGenerated: totalAnswers,
        pdfsExported: totalPDFs,
        activeJobs: activeJobs.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/dashboard/recent-activity", requireAuth, async (req, res) => {
    try {
      const jobs = await storage.getScrapingJobsByUserId(req.session.userId!);
      const recentJobs = jobs
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5);

      const activities = recentJobs.map(job => ({
        id: job.id,
        type: job.status === "completed" ? "scraping_completed" : "scraping_started",
        title: job.status === "completed" ? 
          `${job.topic} scraping completed` : 
          `${job.topic} scraping started`,
        subtitle: `${job.keyword} keywords`,
        timestamp: job.createdAt,
      }));

      res.json({ activities });
    } catch (error) {
      res.status(500).json({ error: "Failed to get recent activity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
