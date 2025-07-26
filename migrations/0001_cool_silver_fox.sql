ALTER TABLE "users" ADD COLUMN "quora_email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quora_password" text;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_answer_unique" UNIQUE("answer");