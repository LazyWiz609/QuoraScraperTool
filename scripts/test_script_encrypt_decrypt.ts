import "dotenv/config";
import { encrypt, decrypt } from "../encryption"; // Adjust path if needed

const testString = "lazywiz609@gmail.com";

console.log("🔒 Original:", testString);

const encrypted = encrypt(testString);
console.log("🔐 Encrypted:", encrypted);

const decrypted = decrypt(encrypted);
console.log("🔓 Decrypted:", decrypted);

if (decrypted === testString) {
  console.log("✅ Encryption/Decryption works correctly!");
} else {
  console.error("❌ Mismatch! Decryption failed.");
}
