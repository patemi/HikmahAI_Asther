"use server";

import { db, schema } from "@/lib/db";
import { getAppConfig } from "@/lib/app-config";
import { retrieveKnowledge } from "@/lib/rag";
import { chatCompletion, MODELS } from "@/lib/openai";
import { eq } from "drizzle-orm";

// ─── Types ───────────────────────────────────────────────────

type ChunkDetail = {
  chunkId: string;
  documentTitle: string;
  similarity: number;
  llmRelevanceRating: number;
  isRelevant: boolean;
  judgeFailed: boolean;
};

type QueryMetrics = {
  precision: number;
  recall: number;
  f1Score: number;
  relevanceScore: number;
  accuracy: number;
  retrievedChunks: number;
  relevantChunks: number;
  totalExpectedRelevant: number | null;
  chunkDetails: ChunkDetail[];
  llmAccuracyRating: string;
};

type AggregateMetrics = {
  avgPrecision: number;
  avgRecall: number;
  avgF1Score: number;
  avgRelevanceScore: number;
  avgAccuracy: number;
  perCategory: Record<string, {
    avgPrecision: number;
    avgRecall: number;
    avgF1Score: number;
    avgRelevanceScore: number;
    avgAccuracy: number;
    count: number;
  }>;
};

// ─── Model Fallback ──────────────────────────────────────────

function getJudgeModelCandidates(preferredModel?: string): string[] {
  return [
    preferredModel,
    "gpt-4.1-nano",
    "gpt-4.1-mini",
    "gpt-4o-mini",
    "gpt-4-mini",
  ].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);
}

/**
 * Try chatCompletion across multiple model candidates.
 * Returns the first successful response content, or null.
 */
async function judgeWithFallback(
  messages: Array<{ role: "system" | "user"; content: string }>,
  modelCandidates: string[]
): Promise<string | null> {
  for (const model of modelCandidates) {
    try {
      const completion = await chatCompletion(messages, {
        model,
        temperature: 0,
        maxTokens: 250,
      });

      const content = completion.choices?.[0]?.message?.content?.trim();
      if (content) {
        return content;
      }
      console.warn(`[Eval] Model ${model} returned empty content`);
    } catch (error) {
      console.warn(`[Eval] Model ${model} failed:`, error instanceof Error ? error.message : error);
    }
  }
  return null;
}

function parseJsonResponse<T>(raw: string): T | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

// ─── LLM Judge ───────────────────────────────────────────────

const RELEVANCE_THRESHOLD = 0.5;

/**
 * Uses LLM to judge whether a retrieved chunk is relevant to the query.
 * Falls back to similarity score if LLM judge fails entirely.
 */
async function judgeChunkRelevance(
  query: string,
  chunkContent: string,
  documentTitle: string,
  similarityScore: number,
  modelCandidates: string[]
): Promise<{ score: number; reasoning: string; judgeFailed: boolean }> {
  const messages: Array<{ role: "system" | "user"; content: string }> = [
    {
      role: "system",
      content: `You are a relevance judge for a RAG system focused on Islamic knowledge.

Given a user query and a retrieved text chunk, rate how relevant the chunk is for answering the query.

You MUST respond with ONLY a JSON object, nothing else:
{"score": 0.8, "reasoning": "The chunk directly discusses..."}

Score from 0.0 (irrelevant) to 1.0 (perfectly relevant).`,
    },
    {
      role: "user",
      content: `Query: "${query}"
Document: "${documentTitle}"
Chunk: "${chunkContent.slice(0, 600)}"`,
    },
  ];

  const content = await judgeWithFallback(messages, modelCandidates);

  if (content) {
    const parsed = parseJsonResponse<{ score?: number; reasoning?: string }>(content);
    if (parsed && typeof parsed.score === "number") {
      return {
        score: Math.max(0, Math.min(1, parsed.score)),
        reasoning: parsed.reasoning ?? "",
        judgeFailed: false,
      };
    }
    console.warn("[Eval] Could not parse judge response:", content.slice(0, 200));
  }

  // Fallback: use the RAG similarity score directly
  console.warn("[Eval] LLM judge failed for chunk, falling back to similarity score:", similarityScore);
  return {
    score: similarityScore,
    reasoning: `LLM judge unavailable — using RAG similarity score (${(similarityScore * 100).toFixed(1)}%) as fallback.`,
    judgeFailed: true,
  };
}

/**
 * Uses LLM to judge if retrieved context can produce an accurate answer.
 * Falls back to average relevance score if LLM fails.
 */
async function judgeAnswerAccuracy(
  query: string,
  retrievedContext: string,
  avgRelevance: number,
  modelCandidates: string[]
): Promise<{ score: number; explanation: string }> {
  const messages: Array<{ role: "system" | "user"; content: string }> = [
    {
      role: "system",
      content: `You are an accuracy evaluator for an Islamic knowledge RAG system.

Given a user query and retrieved knowledge context, judge whether the context provides enough accurate information to correctly answer the query.

You MUST respond with ONLY a JSON object:
{"score": 0.8, "explanation": "The context covers..."}

Score from 0.0 (completely insufficient) to 1.0 (fully sufficient and accurate).`,
    },
    {
      role: "user",
      content: `Query: "${query}"

Retrieved context:
"""
${retrievedContext.slice(0, 1500)}
"""`,
    },
  ];

  const content = await judgeWithFallback(messages, modelCandidates);

  if (content) {
    const parsed = parseJsonResponse<{ score?: number; explanation?: string }>(content);
    if (parsed && typeof parsed.score === "number") {
      return {
        score: Math.max(0, Math.min(1, parsed.score)),
        explanation: parsed.explanation ?? "",
      };
    }
    console.warn("[Eval] Could not parse accuracy response:", content.slice(0, 200));
  }

  // Fallback: use average chunk relevance as proxy for accuracy
  return {
    score: avgRelevance,
    explanation: `LLM judge unavailable — estimated from average chunk relevance (${(avgRelevance * 100).toFixed(1)}%).`,
  };
}

// ─── Metrics Computation ─────────────────────────────────────

function computeF1(precision: number, recall: number): number {
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

// ─── Main Evaluation Engine ──────────────────────────────────

/**
 * Evaluate a single query against the RAG system.
 */
export async function evaluateQuery(
  query: string,
  options: {
    expectedDocumentIds?: string[];
    category?: string;
    topK?: number;
    minScore?: number;
    judgeModel?: string;
  } = {}
): Promise<QueryMetrics> {
  const config = await getAppConfig();
  const topK = options.topK ?? config?.ragTopK ?? 5;
  const minScore = options.minScore ?? (config?.ragMinScore ?? 70) / 100;
  const preferredModel = options.judgeModel ?? config?.textModel ?? MODELS.TEXT;
  const modelCandidates = getJudgeModelCandidates(preferredModel);

  console.log(`[Eval] Evaluating query: "${query.slice(0, 60)}..." with models: ${modelCandidates.join(", ")}`);

  // Step 1: Retrieve chunks
  const chunks = await retrieveKnowledge(query, { topK, minScore });

  console.log(`[Eval] Retrieved ${chunks.length} chunks`);

  if (chunks.length === 0) {
    return {
      precision: 0,
      recall: 0,
      f1Score: 0,
      relevanceScore: 0,
      accuracy: 0,
      retrievedChunks: 0,
      relevantChunks: 0,
      totalExpectedRelevant: options.expectedDocumentIds?.length ?? null,
      chunkDetails: [],
      llmAccuracyRating: "No chunks retrieved — cannot evaluate accuracy.",
    };
  }

  // Step 2: Judge each chunk's relevance
  const chunkDetails: ChunkDetail[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[Eval] Judging chunk ${i + 1}/${chunks.length}: "${chunk.documentTitle}" (sim: ${(chunk.similarity * 100).toFixed(1)}%)`);

    const judgment = await judgeChunkRelevance(
      query,
      chunk.content,
      chunk.documentTitle,
      chunk.similarity,
      modelCandidates
    );

    chunkDetails.push({
      chunkId: chunk.id,
      documentTitle: chunk.documentTitle,
      similarity: chunk.similarity,
      llmRelevanceRating: judgment.score,
      isRelevant: judgment.score >= RELEVANCE_THRESHOLD,
      judgeFailed: judgment.judgeFailed,
    });

    console.log(`[Eval] Chunk ${i + 1} rated: ${(judgment.score * 100).toFixed(1)}% (${judgment.judgeFailed ? "fallback" : "LLM"})`);
  }

  const relevantChunks = chunkDetails.filter((c) => c.isRelevant).length;
  const retrievedCount = chunkDetails.length;

  // Step 3: Precision@K = relevant retrieved / total retrieved
  const precision = retrievedCount > 0 ? relevantChunks / retrievedCount : 0;

  // Step 4: Recall
  let totalExpectedRelevant: number | null = null;
  let recall: number;

  if (options.expectedDocumentIds && options.expectedDocumentIds.length > 0) {
    const retrievedDocIds = new Set(chunks.map((c) => c.documentId));
    const hits = options.expectedDocumentIds.filter((id) => retrievedDocIds.has(id)).length;
    totalExpectedRelevant = options.expectedDocumentIds.length;
    recall = totalExpectedRelevant > 0 ? hits / totalExpectedRelevant : 0;
  } else {
    // Without ground truth, estimate: if relevant chunks found, assume proportional coverage
    recall = relevantChunks > 0 ? Math.min(1, relevantChunks / topK) : 0;
  }

  // Step 5: F1 Score
  const f1Score = computeF1(precision, recall);

  // Step 6: Average Relevance Score
  const relevanceScore =
    chunkDetails.length > 0
      ? chunkDetails.reduce((sum, c) => sum + c.llmRelevanceRating, 0) / chunkDetails.length
      : 0;

  // Step 7: Accuracy
  const context = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.documentTitle}]\n${c.content}`)
    .join("\n\n");

  console.log("[Eval] Judging answer accuracy...");
  const accuracyJudgment = await judgeAnswerAccuracy(query, context, relevanceScore, modelCandidates);
  console.log(`[Eval] Accuracy: ${(accuracyJudgment.score * 100).toFixed(1)}%`);

  return {
    precision: round4(precision),
    recall: round4(recall),
    f1Score: round4(f1Score),
    relevanceScore: round4(relevanceScore),
    accuracy: round4(accuracyJudgment.score),
    retrievedChunks: retrievedCount,
    relevantChunks,
    totalExpectedRelevant,
    chunkDetails,
    llmAccuracyRating: accuracyJudgment.explanation,
  };
}

/**
 * Run a full evaluation across all test cases and persist results.
 */
export async function runEvaluation(
  runName?: string
): Promise<{ runId: string; metrics: AggregateMetrics }> {
  const config = await getAppConfig();

  const testCases = await db.query.evaluationTestCases.findMany();

  if (testCases.length === 0) {
    throw new Error("No test cases found. Add test cases before running evaluation.");
  }

  const queryResults: Array<{
    query: string;
    category: string | null;
    metrics: QueryMetrics;
  }> = [];

  for (const testCase of testCases) {
    console.log(`\n[Eval] ═══ Evaluating: "${testCase.query.slice(0, 50)}..." ═══`);

    const metrics = await evaluateQuery(testCase.query, {
      expectedDocumentIds: testCase.expectedDocumentIds ?? undefined,
      category: testCase.category ?? undefined,
    });

    queryResults.push({
      query: testCase.query,
      category: testCase.category,
      metrics,
    });

    console.log(`[Eval] Results — P:${pctLog(metrics.precision)} R:${pctLog(metrics.recall)} F1:${pctLog(metrics.f1Score)} Rel:${pctLog(metrics.relevanceScore)} Acc:${pctLog(metrics.accuracy)}`);
  }

  const aggregate = computeAggregateMetrics(queryResults);

  // Persist the run
  const [run] = await db
    .insert(schema.evaluationRuns)
    .values({
      name: runName || `Evaluation ${new Date().toISOString().slice(0, 16)}`,
      totalQueries: testCases.length,
      avgPrecision: aggregate.avgPrecision.toFixed(4),
      avgRecall: aggregate.avgRecall.toFixed(4),
      avgF1Score: aggregate.avgF1Score.toFixed(4),
      avgRelevanceScore: aggregate.avgRelevanceScore.toFixed(4),
      avgAccuracy: aggregate.avgAccuracy.toFixed(4),
      configSnapshot: {
        ragEnabled: config?.ragEnabled,
        ragTopK: config?.ragTopK,
        ragMinScore: config?.ragMinScore,
        textModel: config?.textModel,
        embeddingModel: config?.embeddingModel,
        guardrailLevel: config?.guardrailLevel,
        citationStrict: config?.citationStrict,
      },
    })
    .returning();

  for (const result of queryResults) {
    await db.insert(schema.evaluationQueryResults).values({
      runId: run.id,
      query: result.query,
      category: result.category,
      precision: result.metrics.precision.toFixed(4),
      recall: result.metrics.recall.toFixed(4),
      f1Score: result.metrics.f1Score.toFixed(4),
      relevanceScore: result.metrics.relevanceScore.toFixed(4),
      accuracy: result.metrics.accuracy.toFixed(4),
      retrievedChunks: result.metrics.retrievedChunks,
      relevantChunks: result.metrics.relevantChunks,
      totalExpectedRelevant: result.metrics.totalExpectedRelevant,
      chunkDetails: result.metrics.chunkDetails,
      llmAccuracyRating: result.metrics.llmAccuracyRating,
    });
  }

  return { runId: run.id, metrics: aggregate };
}

// ─── Aggregate ───────────────────────────────────────────────

function computeAggregateMetrics(
  results: Array<{
    query: string;
    category: string | null;
    metrics: QueryMetrics;
  }>
): AggregateMetrics {
  const n = results.length;
  if (n === 0) {
    return {
      avgPrecision: 0,
      avgRecall: 0,
      avgF1Score: 0,
      avgRelevanceScore: 0,
      avgAccuracy: 0,
      perCategory: {},
    };
  }

  const sum = results.reduce(
    (acc, r) => ({
      precision: acc.precision + r.metrics.precision,
      recall: acc.recall + r.metrics.recall,
      f1Score: acc.f1Score + r.metrics.f1Score,
      relevanceScore: acc.relevanceScore + r.metrics.relevanceScore,
      accuracy: acc.accuracy + r.metrics.accuracy,
    }),
    { precision: 0, recall: 0, f1Score: 0, relevanceScore: 0, accuracy: 0 }
  );

  const categories = new Map<string, Array<QueryMetrics>>();
  for (const r of results) {
    const cat = r.category || "uncategorized";
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(r.metrics);
  }

  const perCategory: AggregateMetrics["perCategory"] = {};
  for (const [cat, catMetrics] of categories) {
    const cn = catMetrics.length;
    perCategory[cat] = {
      avgPrecision: round4(catMetrics.reduce((s, m) => s + m.precision, 0) / cn),
      avgRecall: round4(catMetrics.reduce((s, m) => s + m.recall, 0) / cn),
      avgF1Score: round4(catMetrics.reduce((s, m) => s + m.f1Score, 0) / cn),
      avgRelevanceScore: round4(catMetrics.reduce((s, m) => s + m.relevanceScore, 0) / cn),
      avgAccuracy: round4(catMetrics.reduce((s, m) => s + m.accuracy, 0) / cn),
      count: cn,
    };
  }

  return {
    avgPrecision: round4(sum.precision / n),
    avgRecall: round4(sum.recall / n),
    avgF1Score: round4(sum.f1Score / n),
    avgRelevanceScore: round4(sum.relevanceScore / n),
    avgAccuracy: round4(sum.accuracy / n),
    perCategory,
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function pctLog(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

// ─── Query helpers ───────────────────────────────────────────

export async function getEvaluationRun(runId: string) {
  const run = await db.query.evaluationRuns.findFirst({
    where: eq(schema.evaluationRuns.id, runId),
  });
  if (!run) return null;

  const queryResults = await db.query.evaluationQueryResults.findMany({
    where: eq(schema.evaluationQueryResults.runId, runId),
  });

  return { run, queryResults };
}

export async function getEvaluationRuns() {
  return db.query.evaluationRuns.findMany({
    orderBy: (runs, { desc }) => [desc(runs.createdAt)],
  });
}

export async function deleteEvaluationRun(runId: string) {
  await db
    .delete(schema.evaluationRuns)
    .where(eq(schema.evaluationRuns.id, runId));
}
