import { 
  users, 
  scrapingJobs, 
  questions, 
  answers,
  type User, 
  type InsertUser,
  type ScrapingJob,
  type InsertScrapingJob,
  type Question,
  type InsertQuestion,
  type Answer,
  type InsertAnswer
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Scraping job methods
  createScrapingJob(job: InsertScrapingJob & { userId: number }): Promise<ScrapingJob>;
  getScrapingJob(id: number): Promise<ScrapingJob | undefined>;
  updateScrapingJobStatus(id: number, status: string): Promise<void>;
  getScrapingJobsByUserId(userId: number): Promise<ScrapingJob[]>;
  
  // Question methods
  createQuestion(question: InsertQuestion & { jobId: number }): Promise<Question>;
  getQuestionsByJobId(jobId: number): Promise<Question[]>;
  updateQuestionSelection(id: number, selected: boolean): Promise<void>;
  
  // Answer methods
  createAnswer(answer: InsertAnswer & { questionId: number }): Promise<Answer>;
  getAnswerByQuestionId(questionId: number): Promise<Answer | undefined>;
  getAnswersByJobId(jobId: number): Promise<Array<Answer & { question: Question }>>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scrapingJobs: Map<number, ScrapingJob>;
  private questions: Map<number, Question>;
  private answers: Map<number, Answer>;
  private currentUserId: number;
  private currentJobId: number;
  private currentQuestionId: number;
  private currentAnswerId: number;

  constructor() {
    this.users = new Map();
    this.scrapingJobs = new Map();
    this.questions = new Map();
    this.answers = new Map();
    this.currentUserId = 1;
    this.currentJobId = 1;
    this.currentQuestionId = 1;
    this.currentAnswerId = 1;
    
    // Create default admin user
    this.users.set(1, {
      id: 1,
      username: "admin",
      password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
      createdAt: new Date(),
    });
    this.currentUserId = 2;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createScrapingJob(job: InsertScrapingJob & { userId: number }): Promise<ScrapingJob> {
    const id = this.currentJobId++;
    const scrapingJob: ScrapingJob = {
      ...job,
      id,
      status: "pending",
      createdAt: new Date(),
      timeFilter: job.timeFilter || null,
      questionLimit: job.questionLimit || 20,
    };
    this.scrapingJobs.set(id, scrapingJob);
    return scrapingJob;
  }

  async getScrapingJob(id: number): Promise<ScrapingJob | undefined> {
    return this.scrapingJobs.get(id);
  }

  async updateScrapingJobStatus(id: number, status: string): Promise<void> {
    const job = this.scrapingJobs.get(id);
    if (job) {
      job.status = status;
      this.scrapingJobs.set(id, job);
    }
  }

  async getScrapingJobsByUserId(userId: number): Promise<ScrapingJob[]> {
    return Array.from(this.scrapingJobs.values()).filter(
      (job) => job.userId === userId,
    );
  }

  async createQuestion(question: InsertQuestion & { jobId: number }): Promise<Question> {
    const id = this.currentQuestionId++;
    const q: Question = {
      ...question,
      id,
      selected: false,
      createdAt: new Date(),
    };
    this.questions.set(id, q);
    return q;
  }

  async getQuestionsByJobId(jobId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      (question) => question.jobId === jobId,
    );
  }

  async updateQuestionSelection(id: number, selected: boolean): Promise<void> {
    const question = this.questions.get(id);
    if (question) {
      question.selected = selected;
      this.questions.set(id, question);
    }
  }

  async createAnswer(answer: InsertAnswer & { questionId: number }): Promise<Answer> {
    const id = this.currentAnswerId++;
    const a: Answer = {
      ...answer,
      id,
      createdAt: new Date(),
    };
    this.answers.set(id, a);
    return a;
  }

  async getAnswerByQuestionId(questionId: number): Promise<Answer | undefined> {
    return Array.from(this.answers.values()).find(
      (answer) => answer.questionId === questionId,
    );
  }

  async getAnswersByJobId(jobId: number): Promise<Array<Answer & { question: Question }>> {
    const jobQuestions = await this.getQuestionsByJobId(jobId);
    const results: Array<Answer & { question: Question }> = [];
    
    for (const question of jobQuestions) {
      const answer = await this.getAnswerByQuestionId(question.id);
      if (answer) {
        results.push({ ...answer, question });
      }
    }
    
    return results;
  }
}

export const storage = new MemStorage();
