import { db } from "./db";
import { users, scrapingJobs, questions, answers } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { IStorage } from "./storage";
import { encrypt, decrypt } from "../encryption";
import type {
  User,
  InsertUser,
  ScrapingJob,
  InsertScrapingJob,
  Question,
  InsertQuestion,
  Answer,
  InsertAnswer,
} from "@shared/schema";

export class DrizzleStorage implements IStorage {
  // --- Users ---
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  

  async updateUserApiKey(userId: number, apiKey: string): Promise<void> {
    await db
      .update(users)
      .set({ geminiApiKey: apiKey })
      .where(eq(users.id, userId));
  }
  // --- Scraping Jobs ---
  async createScrapingJob(
    job: InsertScrapingJob & { userId: number }
  ): Promise<ScrapingJob> {
    const result = await db.insert(scrapingJobs).values(job).returning();
    return result[0];
  }

  async getScrapingJob(id: number): Promise<ScrapingJob | undefined> {
    const result = await db
      .select()
      .from(scrapingJobs)
      .where(eq(scrapingJobs.id, id));
    return result[0];
  }

  async updateScrapingJobStatus(id: number, status: string): Promise<void> {
    await db
      .update(scrapingJobs)
      .set({ status })
      .where(eq(scrapingJobs.id, id));
  }

  async getScrapingJobsByUserId(userId: number): Promise<ScrapingJob[]> {
    return db
      .select()
      .from(scrapingJobs)
      .where(eq(scrapingJobs.userId, userId));
  }

  // --- Questions ---
  async createQuestion(
    question: InsertQuestion & { jobId: number }
  ): Promise<Question> {
    const result = await db.insert(questions).values(question).returning();
    return result[0];
  }

  async getQuestionsByJobId(jobId: number): Promise<Question[]> {
    return db.select().from(questions).where(eq(questions.jobId, jobId));
  }

  async updateQuestionSelection(id: number, selected: boolean): Promise<void> {
    await db.update(questions).set({ selected }).where(eq(questions.id, id));
  }

async createOrUpdateAnswer(
  answer: InsertAnswer & { questionId: number }
): Promise<Answer> {
  if (!answer.answer || !answer.questionId) {
    throw new Error("Invalid answer or questionId");
  }

  const { questionId, answer: answerText } = answer;

  // Delete old answer if it exists for that question
  await db.delete(answers).where(eq(answers.questionId, questionId));

  // Insert new answer
  const result = await db
    .insert(answers)
    .values({ questionId, answer: answerText })
    .returning();

  if (!result[0]) {
    throw new Error("Insert failed — no result returned");
  }

  return result[0];
}



  async getAnswerByQuestionId(questionId: number): Promise<Answer | undefined> {
    const result = await db
      .select()
      .from(answers)
      .where(eq(answers.questionId, questionId));
    return result[0];
  }

  async getUserById(userId: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, userId));
    return result[0];
  }

  async getAnswersByJobId(
    jobId: number
  ): Promise<Array<Answer & { question: Question }>> {
    const questionList = await this.getQuestionsByJobId(jobId);
    const results: Array<Answer & { question: Question }> = [];

    for (const question of questionList) {
      const answer = await this.getAnswerByQuestionId(question.id);
      if (answer) results.push({ ...answer, question });
    }

    return results;
  }

  async updateQuoraCredentials(userId: number, email: string, password: string): Promise<void> {
  await db.update(users).set({
    quora_email: encrypt(email),
    quora_password: encrypt(password),
  }).where(eq(users.id, userId));
}
  async updateUserProfile(
    userId: number,
    updates: {
      geminiApiKey?: string;
      quora_email?: string;
      quora_password?: string;
    }
  ): Promise<void> {
    await db
      .update(users)
      .set({
        ...(updates.geminiApiKey !== undefined && {
          geminiApiKey: updates.geminiApiKey,
        }),
        ...(updates.quora_email !== undefined && {
          quora_email: updates.quora_email,
        }),
        ...(updates.quora_password !== undefined && {
          quora_password: updates.quora_password,
        }),
      })
      .where(eq(users.id, userId));
  }
}
