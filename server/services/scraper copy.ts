import fs from "fs/promises";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { ScrapedQuestion, ScrapingParams } from "@/types/api";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ScraperService {
  static async scrapeQuestions(params: ScrapingParams): Promise<ScrapedQuestion[]> {
    const { keyword, limit, timeFilter } = params;

    const scriptPath = path.resolve(__dirname, "../../working_scraper.py");

    const documentsPath = path.join(os.homedir(), "Documents");
    const saveDir = path.join(documentsPath, "QuoraScraperData", "questions");
    const outputFile = path.join(saveDir, `${keyword}_question_urls.txt`);

    let command = `python "${scriptPath}" questions --keyword "${keyword}" --limit ${limit}`;
    if (timeFilter && timeFilter !== "all-time") {
      command += ` --time ${timeFilter}`;
    }

    await new Promise<void>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("Python scraper error:", stderr || error.message);
          return reject(error);
        }
        resolve();
      });
    });

    const data = await fs.readFile(outputFile, "utf-8");
    const lines = data.split("\n").filter(Boolean);

    return lines.slice(0, limit).map((link) => {
      try {
        const cleanPath = link.split("quora.com/")[1] || "";
        const raw = decodeURIComponent(cleanPath.split("/")[0]);
        const question = raw
          .replace(/-/g, " ")
          .replace(/\s+$/, "")
          .replace(/^\s+/, "") + "?";

        return {
          question: question.charAt(0).toUpperCase() + question.slice(1),
          link,
        };
      } catch {
        return {
          question: "Unknown Question",
          link,
        };
      }
    });
  }
}