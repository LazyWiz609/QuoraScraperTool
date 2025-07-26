import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("❌ Gemini API key is required.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }


  async generateAnswer(question: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Use a stable model

//       const prompt = `Please provide a helpful, clear answer to the following question. Use paragraphs and instead of bullet points, use - or 1. where appropriate & Format it in a way that is quora friendly. without all the * n all.

// Question: ${question}`;
const prompt = `You are writing an informative answer for Quora.

Please answer the following question in a clear, helpful, and well-structured way. Use natural paragraphs and clean formatting. Do not use asterisks (*), markdown (**bold**), or HTML. 

Instead of bullet points, use dashes (-) or numbered lists (1., 2., 3.). Avoid formatting symbols like *, _, or >. Use line breaks and spacing to make the answer readable on Quora. Keep it friendly, direct, and easy to follow.

Question: ${question}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim() === "") {
        console.warn("⚠️ Gemini API returned empty text.");
        return "Sorry, I couldn't generate an answer for this question.";
      }

      return text;
    } catch (error: any) {
      console.error("❌ Gemini generation error:", error);

      if (error?.response) {
        console.error("🔍 Gemini API error details:", {
          status: error.response.status,
          data: error.response.data
        });
      }

      return "Sorry, there was an error generating this answer.";
    }
  }

  async generateMultipleAnswers(questions: string[]): Promise<string[]> {
    const answers: string[] = [];

    for (const question of questions) {
      try {
        console.log("🧠 Generating answer for:", question);
        const answer = await this.generateAnswer(question);
        answers.push(answer);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Avoid rate limits
      } catch (error) {
        console.error("❌ Error in generateMultipleAnswers:", error);
        answers.push("Sorry, I couldn't generate an answer for this question.");
      }
    }

    return answers;
  }
}
