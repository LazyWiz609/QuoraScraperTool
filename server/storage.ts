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
import { DrizzleStorage } from "./drizzle-storage";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserApiKey(userId: number, apiKey: string): Promise<void>;

  updateUserProfile(userId: number, updates: {
    geminiApiKey?: string;
    quora_email?: string;
    quora_password?: string;
  }): Promise<void>;

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
  createOrUpdateAnswer(answer: InsertAnswer & { questionId: number }): Promise<Answer>;
  getAnswerByQuestionId(questionId: number): Promise<Answer | undefined>;
  getAnswersByJobId(jobId: number): Promise<Array<Answer & { question: Question }>>;
}

export const storage = new DrizzleStorage();
