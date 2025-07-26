import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "../encryption";

async function migrate() {
  const allUsers = await db.select().from(users);

  for (const user of allUsers) {
    const encryptedEmail = user.quora_email ? encrypt(user.quora_email) : null;
    const encryptedPassword = user.quora_password ? encrypt(user.quora_password) : null;

    await db
      .update(users)
      .set({ quora_email: encryptedEmail, quora_password: encryptedPassword })
      .where(eq(users.id, user.id));

    console.log(`✅ Re-encrypted credentials for user ${user.id}`);
  }

  console.log("🎉 All user credentials re-encrypted successfully.");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
});
