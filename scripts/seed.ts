import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  const existing = await db.select().from(users).where(eq(users.username, "admin"));
  if (existing.length === 0) {
    const hashedPassword = await bcrypt.hash("password", 10);
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
    });
    console.log("✅ Admin user created");
  } else {
    console.log("✅ Admin already exists");
  }
}

seed().then(() => process.exit());
