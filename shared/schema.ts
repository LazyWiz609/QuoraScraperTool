import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

// === Tables ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  geminiApiKey: text("gemini_api_key"),
  quora_email: text("quora_email"),        
  quora_password: text("quora_password"),
});

export const scrapingJobs = pgTable("scraping_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  topic: text("topic").notNull(),
  keyword: text("keyword").notNull(),
  timeFilter: text("time_filter"),
  questionLimit: integer("question_limit").default(20),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => scrapingJobs.id),
  question: text("question").notNull(),
  link: text("link").notNull(),
  selected: boolean("selected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id),
  answer: text("answer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === Zod Schemas (Manual, stable) ===

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  geminiApiKey: z.string().optional(),
  quora_email: z.string().email().optional(),
  quora_password: z.string().optional(),
});

export const insertScrapingJobSchema = z.object({
  topic: z.string().min(1),
  keyword: z.string().min(1),
  timeFilter: z.string().optional().nullable(),
  questionLimit: z.coerce.number().min(1).max(100).optional().nullable(),
  geminiApiKey: z.string().optional(),
  quora_email: z.string().email().optional(),
  quora_password: z.string().optional(),
})
  .extend({
    geminiApiKey: z.string().optional(),
  });

export const insertQuestionSchema = z.object({
  question: z.string().min(1),
  link: z.string().url(),
  selected: z.boolean().optional().nullable(),
});

export const insertAnswerSchema = z.object({
  answer: z.string().min(1),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// === Types ===

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertScrapingJob = z.infer<typeof insertScrapingJobSchema>;
export type ScrapingJob = typeof scrapingJobs.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;

export type LoginData = z.infer<typeof loginSchema>;

