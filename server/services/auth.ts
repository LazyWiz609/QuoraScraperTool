import bcrypt from "bcryptjs";
import { storage } from "../storage";
import type { User, LoginData } from "@shared/schema";

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
}
