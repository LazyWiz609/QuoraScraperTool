import crypto from "crypto";

const key = Buffer.from(process.env.ENCRYPTION_KEY!, "utf8");
const iv = Buffer.from(process.env.ENCRYPTION_IV!, "utf8");  

export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

export function decrypt(encrypted: string): string {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
