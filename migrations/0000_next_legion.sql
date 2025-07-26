CREATE TABLE "answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer,
	"answer" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer,
	"question" text NOT NULL,
	"link" text NOT NULL,
	"selected" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scraping_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"topic" text NOT NULL,
	"keyword" text NOT NULL,
	"time_filter" text,
	"question_limit" integer DEFAULT 20,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"gemini_api_key" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_job_id_scraping_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."scraping_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scraping_jobs" ADD CONSTRAINT "scraping_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;