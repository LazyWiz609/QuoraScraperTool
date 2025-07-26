import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

(async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return console.error("❌ No GEMINI_API_KEY found!");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent("What is the capital of Japan?");
    const text = result.response.text();
    console.log("✅ Gemini Output:\n", text);
  } catch (err) {
    console.error("❌ Gemini API failed:\n", err);
  }
})();
