import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateAnswer(question: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = `Please provide a comprehensive, helpful answer to the following question. 
      The answer should be informative, well-structured, and practical. 
      Format the response with clear paragraphs and bullet points where appropriate.
      
      Question: ${question}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      return text;
    } catch (error) {
      console.error("Error generating answer with Gemini:", error);
      throw new Error(`Failed to generate answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateMultipleAnswers(questions: string[]): Promise<string[]> {
    const answers: string[] = [];
    
    for (const question of questions) {
      try {
        const answer = await this.generateAnswer(question);
        answers.push(answer);
        // Add a small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating answer for question: ${question}`, error);
        answers.push("Sorry, I couldn't generate an answer for this question. Please try again later.");
      }
    }

    return answers;
  }
}
