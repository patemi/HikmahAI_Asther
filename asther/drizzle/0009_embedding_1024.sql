DROP INDEX IF EXISTS "knowledge_chunks_embedding_idx";--> statement-breakpoint
UPDATE "knowledge_chunks" SET "embedding" = NULL, "embedding_model" = NULL WHERE "embedding" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ALTER COLUMN "embedding" SET DATA TYPE vector(1024);--> statement-breakpoint
CREATE INDEX "knowledge_chunks_embedding_idx" ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops);
