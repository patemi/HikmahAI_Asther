CREATE TABLE "evaluation_query_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"query" text NOT NULL,
	"category" text,
	"precision" text NOT NULL,
	"recall" text NOT NULL,
	"f1_score" text NOT NULL,
	"relevance_score" text NOT NULL,
	"accuracy" text NOT NULL,
	"retrieved_chunks" integer NOT NULL,
	"relevant_chunks" integer NOT NULL,
	"total_expected_relevant" integer,
	"chunk_details" jsonb,
	"llm_accuracy_rating" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"total_queries" integer NOT NULL,
	"avg_precision" text NOT NULL,
	"avg_recall" text NOT NULL,
	"avg_f1_score" text NOT NULL,
	"avg_relevance_score" text NOT NULL,
	"avg_accuracy" text NOT NULL,
	"config_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation_test_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query" text NOT NULL,
	"expected_document_ids" jsonb DEFAULT '[]'::jsonb,
	"expected_topics" jsonb DEFAULT '[]'::jsonb,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_config" ALTER COLUMN "bot_name" SET DEFAULT 'Asther';--> statement-breakpoint
ALTER TABLE "app_config" ADD COLUMN "base_url" text;--> statement-breakpoint
ALTER TABLE "app_config" ADD COLUMN "guardrail_level" text DEFAULT 'standar' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_config" ADD COLUMN "citation_strict" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "evaluation_query_results" ADD CONSTRAINT "evaluation_query_results_run_id_evaluation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."evaluation_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "eval_query_results_run_idx" ON "evaluation_query_results" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_content_fts_idx" ON "knowledge_chunks" USING gin (to_tsvector('simple', "content"));