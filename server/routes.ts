import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { AuthService } from "./services/auth";
import { ScraperService } from "./services/scraper";
import { GeminiService } from "./services/gemini";
import { PDFService } from "./services/pdf";
import { loginSchema, insertScrapingJobSchema, insertUserSchema } from "@shared/schema";
import { db } from './db';
import { questions } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';
import { encrypt, decrypt } from "../encryption";

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



// User Gemini API Routes

// GET user profile (API key + Quora creds)
app.get("/api/user/profile", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const user = await storage.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    geminiApiKey: user.geminiApiKey || "",
    quora_email: user.quora_email || "",
    quora_password: user.quora_password || "",
  });
});

// POST user profile (API key + Quora creds)
app.post("/api/user/profile", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { geminiApiKey, quora_email, quora_password } = req.body;

  if (
    (geminiApiKey && typeof geminiApiKey !== "string") ||
    (quora_email && typeof quora_email !== "string") ||
    (quora_password && typeof quora_password !== "string")
  ) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  const encryptedEmail = quora_email ? encrypt(quora_email) : undefined;
  const encryptedPassword = quora_password ? encrypt(quora_password) : undefined;
  console.log("Saving encrypted:", encryptedEmail, encryptedPassword);
  await storage.updateUserProfile(userId,{
    geminiApiKey,
    quora_email: encryptedEmail,
    quora_password: encryptedPassword,
  });

  res.json({ success: true });
});

  // Auth routes
  app.post("/api/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      console.log("📦 Login Data:", loginData);
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
        user: { id: user.id, username: user.username },
      });
    } catch (error) {
      console.error("❌ Zod parsing error:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

app.post("/api/register", async (req, res) => {
  try {
    const parsed = insertUserSchema.parse(req.body); // 💡 Validation happens here
    const user = await AuthService.register(parsed);

    req.session.userId = user.id;
    req.session.user = { id: user.id, username: user.username };

    res.json({ success: true, user: req.session.user });
  } catch (error: any) {
    if (error.message === "User already exists") {
      return res.status(409).json({ error: "Username already taken" });
    }

    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }

    console.error("❌ Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
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

  app.get("/api/me", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not logged in" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  // Scraping routes
  app.post("/api/scrape", async (req, res) => {
    try {
      const jobData = insertScrapingJobSchema.parse(req.body);
      const { geminiApiKey, ...jobPayload } = jobData;

      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: "User not authenticated" });

      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const quora_email = user.quora_email;
      const quora_password = user.quora_password;

      if (!quora_email || !quora_password) {
        return res.status(400).json({ error: "Quora email and password not set in profile" });
      }

      // Create scraping job
      const job = await storage.createScrapingJob({
        ...jobPayload,
        userId,
      });

      // Start scraping in background
        setImmediate(async () => {
          try {
            await storage.updateScrapingJobStatus(job.id, "processing");

            const allowedTimeFilters = ["day", "week", "month", "year", "all-time"] as const;
            const timeFilter = allowedTimeFilters.includes(job.timeFilter as any)
              ? (job.timeFilter as typeof allowedTimeFilters[number])
              : undefined;

            const questions = await ScraperService.scrapeQuestions({
              topic: job.topic,
              keyword: job.keyword,
              timeFilter: timeFilter === "all-time" ? undefined : timeFilter,
              limit: job.questionLimit || 20,
              geminiApiKey: geminiApiKey,
              jobId: job.id,
              quora_email,
              quora_password
            });

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
      console.error("Error in /api/scrape:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.get("/api/jobs/:jobId", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getScrapingJob(jobId);

      const userId = req.session.userId;
      if (!job || job.userId !== userId) {
        return res.status(404).json({ error: "Job not found" });
      }

      const questions = await storage.getQuestionsByJobId(jobId);

      res.json({ job, questions });
    } catch (error) {
      res.status(500).json({ error: "Failed to get job info" });
    }
  });

  app.get("/api/jobs", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const jobs = await storage.getScrapingJobsByUserId(userId);

      const activities = await Promise.all(
        jobs.map(async (job) => {
          const questions = await storage.getQuestionsByJobId(job.id);
          return {
            id: job.id,
            title: `Scraping completed: ${questions.length} questions`,
            subtitle: job.keyword,
            timestamp: job.createdAt,
            type: 'scraping_completed',
          };
        })
      );


      const jobsWithCounts = await Promise.all(
        jobs.map(async (job) => {
          const questions = await storage.getQuestionsByJobId(job.id);
          return {
            ...job,
            actualQuestionCount: questions.length,
          };
        })
      );

      res.json({ jobs: jobsWithCounts });
    } catch (error) {
      console.error("Failed to get jobs:", error);
      res.status(500).json({ error: "Failed to get jobs" });
    }
  });
  
  app.post("/api/questions/:questionId/select", async (req, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const { selected } = req.body;

      await storage.updateQuestionSelection(questionId, selected);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update question selection" });
    }
  });

  app.post("/api/jobs/:jobId/select-questions", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const { selectedQuestionIds } = req.body as { selectedQuestionIds: number[] };

      // Reset all selections to false first
      await db
        .update(questions)
        .set({ selected: false })
        .where(eq(questions.jobId, jobId));

      // Then set selected = true for selectedQuestionIds
      if (selectedQuestionIds.length > 0) {
        await db
          .update(questions)
          .set({ selected: true })
          .where(inArray(questions.id, selectedQuestionIds));
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update question selections:", error);
      res.status(500).json({ error: "Failed to update question selections" });
    }
  });


  // AI answer generation
  app.post("/api/jobs/:jobId/generate-answers", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getScrapingJob(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Validate userId
      if (!job.userId) {
        return res.status(400).json({ error: "Job is not associated with a valid user" });
      }

      // Fetch user and their Gemini API key
      const user = await storage.getUserById(job.userId);
      if (!user || !user.geminiApiKey) {
        return res.status(400).json({ error: "User Gemini API key not found" });
      }

      const geminiService = new GeminiService(user.geminiApiKey);

      const questions = await storage.getQuestionsByJobId(jobId);
      const selectedQuestions = questions.filter((q) => q.selected);

            if (selectedQuestions.length === 0) {
              return res.status(400).json({ error: "No questions selected" });
            }

      // Generate answers in background
      setImmediate(async () => {
        try {
          for (const question of selectedQuestions) {
            try {
              console.log("Generating answer for:", question.question);
              const answer = await geminiService.generateAnswer(question.question);
              console.log("Generated answer:", answer);
              await storage.createOrUpdateAnswer({
                questionId: question.id,
                answer,
              });
            } catch (err) {
              console.error("❌ Failed to generate/store answer for:", question.question);
              if (err instanceof Error) {
                console.error("Reason:", err.message);
                console.error("Stack:", err.stack);
              } else {
                console.error("Unknown error:", err);
              }
            }
          }
        } catch (error) {
          console.error("Answer generation error:", error);
        }
      });

      res.json({ success: true, count: selectedQuestions.length });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Failed to generate answers" });
    }
  });

  app.get("/api/jobs/:jobId/answers", async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const job = await storage.getScrapingJob(jobId);
    if (!job || job.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

          const user = await storage.getUserById(userId);
      if (!user || !user.quora_email || !user.quora_password) {
        return res.status(400).json({ error: "Quora credentials not set" });
      }

      const email = decrypt(user.quora_email);
      const password = decrypt(user.quora_password);
      
    const answers = await storage.getAnswersByJobId(jobId);
    res.json({ answers });
  } catch (err) {
    console.error("❌ Failed to load answers:", err);
    res.status(500).json({ error: "Failed to load answers" });
  }
});

app.get("/api/jobs/:jobId/questions", async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const questions = await storage.getQuestionsByJobId(jobId);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

app.post("/api/jobs/:jobId/questions", async (req, res) => {
  const jobId = parseInt(req.params.jobId);
  const { questions, userId } = req.body;

  try {
    for (const q of questions) {
      await storage.createQuestion({
        question: q.question,
        link: q.link,
        jobId: jobId,
        selected: false,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error saving questions:", err);
    res.status(500).json({ error: "Failed to save questions" });
  }
});


  // PDF export
  app.get("/api/jobs/:jobId/export-pdf", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getScrapingJob(jobId);

      const userId = req.session.userId;
      if (!job || job.userId !== userId) {
        return res.status(404).json({ error: "Job not found" });
      }

      const answers = await storage.getAnswersByJobId(jobId);

      if (answers.length === 0) {
        return res.status(400).json({ error: "No answers to export" });
      }

      const qaData = answers.map((answer) => ({
        question: answer.question.question,
        answer: answer.answer,
        link: answer.question.link,
      }));

      const pdfBuffer = await PDFService.generatePDF(qaData);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="quora-qa-export-${jobId}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF export error:", error);
      res.status(500).json({ error: "Failed to export PDF" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const jobs = await storage.getScrapingJobsByUserId(userId);
      const completedJobs = jobs.filter((job) => job.status === "completed");
      const activeJobs = jobs.filter((job) => job.status === "processing");

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

  app.get("/api/dashboard/recent-activity", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const jobs = await storage.getScrapingJobsByUserId(userId);
      const recentJobs = jobs
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 5);

      const activities = recentJobs.map((job) => ({
        id: job.id,
        type:
          job.status === "completed"
            ? "scraping_completed"
            : "scraping_started",
        title:
          job.status === "completed"
            ? `${
                job.topic.charAt(0).toUpperCase() + job.topic.slice(1)
              } Questions Generated`
            : `${
                job.topic.charAt(0).toUpperCase() + job.topic.slice(1)
              } Scraping Started`,
        subtitle: `Keywords: "${job.keyword}" • ${
          job.questionLimit || 20
        } questions`,
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
