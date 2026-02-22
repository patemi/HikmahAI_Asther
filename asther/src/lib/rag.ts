import { db, schema } from "@/lib/db";
import { desc, eq, gt, sql } from "drizzle-orm";

// Retrieve relevant knowledge chunks using vector similarity
export async function retrieveKnowledge(
  query: string,
  options?: {
    topK?: number;
    minScore?: number;
  }
) {
  const topK = options?.topK ?? 5;
  const minScore = options?.minScore ?? 0.7;

  // Keyword-based similarity using full-text search
  const tsQuery = sql`plainto_tsquery('simple', ${query})`;
  const similarity = sql<number>`ts_rank(to_tsvector('simple', ${
    schema.knowledgeChunks.content
  }), ${tsQuery})`;

  const results = await db
    .select({
      id: schema.knowledgeChunks.id,
      content: schema.knowledgeChunks.content,
      documentId: schema.knowledgeChunks.documentId,
      chunkIndex: schema.knowledgeChunks.chunkIndex,
      similarity,
    })
    .from(schema.knowledgeChunks)
    .where(gt(similarity, minScore))
    .orderBy(desc(similarity))
    .limit(topK);

  // Get document titles for context
  const resultsWithDocs = await Promise.all(
    results.map(async (chunk) => {
      const doc = await db.query.knowledgeDocuments.findFirst({
        where: eq(schema.knowledgeDocuments.id, chunk.documentId),
      });
      return {
        ...chunk,
        documentTitle: doc?.title || "Unknown",
        source: doc?.source,
      };
    })
  );

  return resultsWithDocs;
}

// Build context from retrieved knowledge
export function buildKnowledgeContext(
  chunks: Awaited<ReturnType<typeof retrieveKnowledge>>
) {
  if (chunks.length === 0) {
    return null;
  }

  const context = chunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: ${chunk.documentTitle}]\n${chunk.content}`
    )
    .join("\n\n");

  return `Here is relevant knowledge to help answer the user's question:\n\n${context}`;
}

// Add document and chunk it for RAG
export async function addDocument(
  title: string,
  content: string,
  source?: string,
  metadata?: Record<string, unknown>
) {
  // Insert document
  const [doc] = await db
    .insert(schema.knowledgeDocuments)
    .values({
      title,
      content,
      source,
      metadata,
    })
    .returning();

  // Chunk the content (simple approach: split by paragraphs or fixed size)
  const chunks = chunkText(content, 500, 50);

  // Insert chunks (keyword search does not require embeddings)
  for (let i = 0; i < chunks.length; i++) {
    await db.insert(schema.knowledgeChunks).values({
      documentId: doc.id,
      content: chunks[i],
      chunkIndex: i,
    });
  }

  return doc;
}

// Simple text chunking function
function chunkText(
  text: string,
  maxChunkSize: number,
  overlap: number
): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = "";

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      // Keep some overlap
      const words = currentChunk.split(" ");
      currentChunk = words.slice(-Math.ceil(overlap / 5)).join(" ") + "\n\n";
    }
    currentChunk += para + "\n\n";
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Delete document and its chunks
export async function deleteDocument(documentId: string) {
  await db
    .delete(schema.knowledgeDocuments)
    .where(eq(schema.knowledgeDocuments.id, documentId));
}
