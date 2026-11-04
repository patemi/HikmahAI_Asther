CREATE TABLE "answer_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"snapshot" jsonb NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model" text NOT NULL,
	"purpose" text NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"key" text PRIMARY KEY NOT NULL,
	"hits" integer DEFAULT 1 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_config" ALTER COLUMN "bot_name" SET DEFAULT 'HikmahAI';--> statement-breakpoint
ALTER TABLE "app_config" ALTER COLUMN "text_model" SET DEFAULT 'gemini-3.8-flash';--> statement-breakpoint
ALTER TABLE "app_config" ALTER COLUMN "embedding_model" SET DEFAULT 'gemini-embedding-2';--> statement-breakpoint
ALTER TABLE "app_config" ALTER COLUMN "citation_strict" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "app_config" ADD COLUMN "gemini_api_key" text;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "citations" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "citation_notice" text;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "provenance" jsonb;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD COLUMN "processing_until" timestamp;--> statement-breakpoint
ALTER TABLE "evaluation_query_results" ADD COLUMN "answer_evaluation" jsonb;--> statement-breakpoint
ALTER TABLE "evaluation_runs" ADD COLUMN "answer_metrics" jsonb;--> statement-breakpoint
ALTER TABLE "evaluation_test_cases" ADD COLUMN "reference_answer" text;--> statement-breakpoint
ALTER TABLE "evaluation_test_cases" ADD COLUMN "expected_behavior" text DEFAULT 'answer' NOT NULL;--> statement-breakpoint
ALTER TABLE "evaluation_test_cases" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "evaluation_test_cases" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN "embedding_model" text;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "author" text;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "locator" text;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "answer_feedback" ADD CONSTRAINT "answer_feedback_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_feedback" ADD CONSTRAINT "answer_feedback_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_status_idx" ON "answer_feedback" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "model_usage_created_idx" ON "model_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "rate_limit_reset_idx" ON "rate_limit_buckets" USING btree ("reset_at");
--> statement-breakpoint
UPDATE app_config SET bot_name = 'HikmahAI' WHERE lower(bot_name) IN ('asther', 'ekabot');
--> statement-breakpoint
UPDATE app_config SET citation_strict = true;
