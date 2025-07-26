// import fs from "fs/promises";
// import path from "path";
// import os from "os";
// import { exec } from "child_process";
// import { ScrapedQuestion, ScrapingParams } from "@/types/api";
// import { fileURLToPath } from "url";
// import { decrypt } from "../../encryption";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export class ScraperService {
//   static async scrapeQuestions(
//     params: ScrapingParams & { jobId: number }
//   ): Promise<ScrapedQuestion[]> {
//     const {
//       keyword,
//       limit,
//       timeFilter,
//       jobId,
//       quora_email,
//       quora_password
//     } = params;

//     const scriptPath = path.resolve(__dirname, "../../working_scraper.py");

//     if (!quora_email || !quora_password) {
//       throw new Error("Quora email and password are required for scraping.");
//     }

//     let command = `python "${scriptPath}" --keyword "${keyword}" --limit ${limit} --job-id ${jobId} --email "${quora_email}" --password "${quora_password}"`;

//     if (timeFilter && timeFilter !== "all-time") {
//       command += ` --time ${timeFilter}`;
//     }

//     await new Promise<void>((resolve, reject) => {
//       exec(command, (error, stdout, stderr) => {
//         if (error) {
//           console.error("Python scraper error:", stderr || error.message);
//           return reject(error);
//         }
//         resolve();
//       });
//     });

//     return []; // You can later return actual scraped results here if integrated
//   }
// }

import fs from "fs/promises";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { ScrapedQuestion, ScrapingParams } from "@/types/api";
import { fileURLToPath } from "url";
import { decrypt } from "../../encryption";
import { storage } from "../storage"; // or wherever your DB access is

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ScraperService {
  static async scrapeQuestions(
    params: ScrapingParams & { jobId: number }
  ): Promise<ScrapedQuestion[]> {
    const { keyword, limit, timeFilter, jobId } = params;

    const scriptPath = path.resolve(__dirname, "../../working_scraper.py");

    const job = await storage.getScrapingJob(jobId);
    if (!job) throw new Error("Invalid scraping job.");
    if (job.userId == null) throw new Error("Scraping job has no associated user.");

    const user = await storage.getUser(job.userId);
    if (!user || !user.quora_email || !user.quora_password) {
      throw new Error("Quora email and password are required for scraping.");
    }

    const decryptedPassword = decrypt(user.quora_password);
    const decryptedEmail = decrypt(user.quora_email);


    let command = `python "${scriptPath}" --keyword "${keyword}" --limit ${limit} --job-id ${jobId} --email "${decryptedEmail}" --password "${decryptedPassword}"`;

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

    return [];
  }
}
