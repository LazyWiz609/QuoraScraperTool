import bcrypt from "bcryptjs";
import { storage } from "../storage";
import type { User, InsertUser, LoginData } from "@shared/schema";

export class AuthService {
  static async login(loginData: LoginData): Promise<User | null> {
    const user = await storage.getUserByUsername(loginData.username);
    if (!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  static async register(userData: InsertUser): Promise<User> {
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await this.hashPassword(userData.password);

    const userToInsert: InsertUser = {
      username: userData.username,
      password: hashedPassword,
      geminiApiKey: userData.geminiApiKey,
      quora_email: userData.quora_email,
      quora_password: userData.quora_password,
    };

    const newUser = await storage.createUser(userToInsert); // Not `saveUser`
    return newUser;
  }
}
