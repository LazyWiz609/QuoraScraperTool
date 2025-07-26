export interface JobResponse {
  job: {
    id: number;
    topic: string;
    keyword: string;
    status: 'processing' | 'completed' | 'failed';
    createdAt: string;
  };
  questions: {
    id: number;
    question: string;
    link: string;
    selected: boolean;
  }[];
}

export interface ScrapedQuestion {
  question: string;
  link: string;
}

export interface ScrapingParams {
  keyword: string;
  limit: number;
  topic?: string;
  timeFilter?: 'day' | 'week' | 'month' | 'year' | 'all-time';
  geminiApiKey?: string; 
  quora_email?: string;
  quora_password?: string;
}
