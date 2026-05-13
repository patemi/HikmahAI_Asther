import { db, schema } from "@/lib/db";
import { getAppConfig } from "@/lib/app-config";
import { desc, eq, sql } from "drizzle-orm";
import { generateEmbedding, MODELS } from "@/lib/openai";

type RetrievedChunk = {
  id: string;
  content: string;
  documentId: string;
  chunkIndex: number;
  similarity: number;
  vectorScore: number;
  keywordScore: number;
};

const QURAN_REGEX = /(qur'?an|al[-\s]?qur'?an|alqur'?an|surah|ayat|tafsir|\bqs\b)/i;
const HADITH_REGEX = /(hadits?|hadis|riwayat|bukhari|muslim|tirmidzi|abu\s?dawud|nasai|ibnu\s?majah)/i;

function applyDomainBoost(
  query: string,
  chunk: {
    similarity: number;
    content: string;
    documentTitle: string;
    source?: string | null;
  }
) {
  const queryLower = query.toLowerCase();
  const haystack = `${chunk.documentTitle} ${chunk.source || ""} ${chunk.content}`.toLowerCase();

  const quranIntent = QURAN_REGEX.test(queryLower);
  const hadithIntent = HADITH_REGEX.test(queryLower);

  let boost = 0;

  if (quranIntent && QURAN_REGEX.test(haystack)) {
    boost += 0.12;
  }

  if (hadithIntent && HADITH_REGEX.test(haystack)) {
    boost += 0.12;
  }

  return Math.min(1, chunk.similarity + boost);
}

function buildHaystack(chunk: {
  content: string;
  documentTitle: string;
  source?: string | null;
}) {
  return `${chunk.documentTitle} ${chunk.source || ""} ${chunk.content}`.toLowerCase();
}

async function resolveEmbeddingModel() {
  const config = await getAppConfig();

  return config?.embeddingModel || process.env.EMBEDDING_MODEL || MODELS.EMBEDDING;
}

async function enrichChunksWithDocument(
  chunks: RetrievedChunk[]
) {
  const resultsWithDocs = await Promise.all(
    chunks.map(async (chunk) => {
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

  // Keyword similarity (bounded 0..1)
  const tsQuery = sql`plainto_tsquery('simple', ${query})`;
  const keywordSimilarity = sql<number>`LEAST(1.0, ts_rank(to_tsvector('simple', ${
    schema.knowledgeChunks.content
  }), ${tsQuery}))`;

  let vectorRows: RetrievedChunk[] = [];

  // Vector similarity using pgvector cosine distance
  try {
    const embeddingModel = await resolveEmbeddingModel();
    const queryEmbedding = await generateEmbedding(query, embeddingModel);
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;

    const vectorScore = sql<number>`(1 - (${schema.knowledgeChunks.embedding} <=> ${vectorLiteral}::vector))`;

    vectorRows = await db
      .select({
        id: schema.knowledgeChunks.id,
        content: schema.knowledgeChunks.content,
        documentId: schema.knowledgeChunks.documentId,
        chunkIndex: schema.knowledgeChunks.chunkIndex,
        similarity: vectorScore,
        vectorScore,
        keywordScore: keywordSimilarity,
      })
      .from(schema.knowledgeChunks)
      .where(sql`${schema.knowledgeChunks.embedding} IS NOT NULL`)
      .orderBy(desc(vectorScore))
      .limit(topK * 4);
  } catch (error) {
    console.warn("[RAG] Vector retrieval unavailable, fallback to keyword only:", error);
  }

  const keywordRows = await db
    .select({
      id: schema.knowledgeChunks.id,
      content: schema.knowledgeChunks.content,
      documentId: schema.knowledgeChunks.documentId,
      chunkIndex: schema.knowledgeChunks.chunkIndex,
      similarity: keywordSimilarity,
      vectorScore: sql<number>`0`,
      keywordScore: keywordSimilarity,
    })
    .from(schema.knowledgeChunks)
    .orderBy(desc(keywordSimilarity))
    .limit(topK * 4);

  const merged = new Map<string, RetrievedChunk>();

  for (const row of [...vectorRows, ...keywordRows]) {
    const existing = merged.get(row.id);
    const blended = vectorRows.length
      ? row.vectorScore * 0.75 + row.keywordScore * 0.25
      : row.keywordScore;

    const candidate: RetrievedChunk = {
      ...row,
      similarity: blended,
    };

    if (!existing || candidate.similarity > existing.similarity) {
      merged.set(row.id, candidate);
    }
  }

  const threshold = vectorRows.length ? minScore * 0.6 : minScore;

  const preRanked = Array.from(merged.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK * 3);

  const enriched = await enrichChunksWithDocument(preRanked);

  const ranked = enriched
    .map((chunk) => ({
      ...chunk,
      similarity: applyDomainBoost(query, chunk),
    }))
    .filter((chunk) => chunk.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  if (ranked.length > 0) {
    return ranked;
  }

  const queryLower = query.toLowerCase();
  const quranIntent = QURAN_REGEX.test(queryLower);
  const hadithIntent = HADITH_REGEX.test(queryLower);

  const boosted = enriched
    .map((chunk) => ({
      ...chunk,
      similarity: applyDomainBoost(query, chunk),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  if (quranIntent) {
    const quranCandidates = boosted
      .filter((chunk) => QURAN_REGEX.test(buildHaystack(chunk)))
      .slice(0, topK);
    if (quranCandidates.length > 0) return quranCandidates;
  }

  if (hadithIntent) {
    const hadithCandidates = boosted
      .filter((chunk) => HADITH_REGEX.test(buildHaystack(chunk)))
      .slice(0, topK);
    if (hadithCandidates.length > 0) return hadithCandidates;
  }

  return boosted.slice(0, Math.min(topK, 3));
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

  await rebuildDocumentChunks(doc.id, content);

  return doc;
}

export async function rebuildDocumentChunks(documentId: string, content: string) {
  const chunks = chunkText(content, 500, 50);
  const embeddingModel = await resolveEmbeddingModel();

  for (let i = 0; i < chunks.length; i++) {
    let embedding: number[] | null = null;

    try {
      embedding = await generateEmbedding(chunks[i], embeddingModel);
    } catch (error) {
      console.warn(`[RAG] Failed embedding chunk ${i} of document ${documentId}:`, error);
    }

    await db.insert(schema.knowledgeChunks).values({
      documentId,
      content: chunks[i],
      chunkIndex: i,
      embedding: embedding ?? undefined,
    });
  }
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
