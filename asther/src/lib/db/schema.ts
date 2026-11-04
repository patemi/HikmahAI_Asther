import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  vector,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Voyage supports 256/512/1024/2048 and pgvector's HNSW index caps `vector` at
// 2000, so 1024 is the largest size every provider here can produce and index.
export const EMBEDDING_DIMENSIONS = 1024;
import { sql } from "drizzle-orm";

// Users table for admin dashboard access
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: text("role", { enum: ["user", "admin"] })
    .default("user")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// App configuration (singleton)
export const appConfig = pgTable("app_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Chatbot identity
  botName: text("bot_name").default("HikmahAI").notNull(),
  botPersonality: text("bot_personality").default("friendly and helpful"),
  systemPrompt: text("system_prompt").default("You are a helpful assistant."),
  // API settings
  apiKeyHash: text("api_key_hash"), // Hashed bearer token for API access
  openaiApiKey: text("openai_api_key"),
  geminiApiKey: text("gemini_api_key"),
  baseUrl: text("base_url"),
  // Model settings
  textModel: text("text_model").default("gemini-3.8-flash").notNull(),
  imageModel: text("image_model").default("gpt-4.1").notNull(),
  embeddingModel: text("embedding_model")
    .default("gemini-embedding-2")
    .notNull(),
  // RAG settings
  ragEnabled: boolean("rag_enabled").default(false).notNull(),
  ragTopK: integer("rag_top_k").default(5).notNull(),
  ragMinScore: integer("rag_min_score").default(70).notNull(), // Percentage
  memoryLength: integer("memory_length").default(5).notNull(), // Number of message pairs to include as context
  guardrailLevel: text("guardrail_level").default("standar").notNull(), // standar | ketat
  citationStrict: boolean("citation_strict").default(true).notNull(),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat participants (external users chatting with the bot)
export const chatParticipants = pgTable("chat_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id").notNull().unique(), // ID from the client app
  name: text("name"),
  processingUntil: timestamp("processing_until"),
  pinned: boolean("pinned").default(false).notNull(),
  archived: boolean("archived").default(false).notNull(),
  metadata: jsonb("metadata"), // Any additional data from the client
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat messages
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    participantId: uuid("participant_id")
      .references(() => chatParticipants.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").notNull(), // 'user' | 'assistant'
    isActive: boolean("is_active").default(true).notNull(),
    content: text("content").notNull(),
    attachments: jsonb("attachments")
      .$type<import("@/lib/chat-features").ChatAttachment[]>()
      .default([])
      .notNull(),
    feedback: text("feedback", { enum: ["up", "down"] }),
    // For image messages
    imageUrl: text("image_url"),
    imageAnalysis: text("image_analysis"),
    // Token usage
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    citations: jsonb("citations")
      .$type<import("@/lib/citations").Citation[]>()
      .default([])
      .notNull(),
    citationNotice: text("citation_notice"),
    provenance:
      jsonb("provenance").$type<import("@/lib/citations").AnswerProvenance>(),
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chat_messages_participant_idx").on(table.participantId),
    index("chat_messages_created_at_idx").on(table.createdAt),
  ],
);

// Knowledge base documents
export const conversationShares = pgTable("conversation_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantId: uuid("participant_id")
    .references(() => chatParticipants.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  snapshot: jsonb("snapshot")
    .$type<import("@/lib/chat-features").SharedSnapshot>()
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"), // URL or file name
  metadata: jsonb("metadata"),
  author: text("author"),
  locator: text("locator"),
  status: text("status", { enum: ["draft", "review", "published"] })
    .default("draft")
    .notNull(),
  version: integer("version").default(1).notNull(),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Dashboard list: newest first, optionally filtered by status.
  index("knowledge_documents_created_at_idx").on(table.createdAt, table.id),
  index("knowledge_documents_status_created_at_idx").on(
    table.status,
    table.createdAt,
  ),
]);

// Knowledge chunks with embeddings for RAG
export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    embeddingModel: text("embedding_model"),
    chunkIndex: integer("chunk_index").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_chunks_document_idx").on(table.documentId),
    index("knowledge_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    index("knowledge_chunks_content_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.content})`,
    ),
  ],
);

// Evaluation test cases for RAG metrics
export const evaluationTestCases = pgTable("evaluation_test_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  query: text("query").notNull(),
  expectedDocumentIds: jsonb("expected_document_ids")
    .$type<string[]>()
    .default([]),
  expectedTopics: jsonb("expected_topics").$type<string[]>().default([]),
  category: text("category"), // e.g. "quran", "hadith", "fiqh", "history"
  referenceAnswer: text("reference_answer"),
  expectedBehavior: text("expected_behavior", {
    enum: ["answer", "abstain", "out_of_scope"],
  })
    .default("answer")
    .notNull(),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Evaluation run results
export const evaluationRuns = pgTable("evaluation_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  totalQueries: integer("total_queries").notNull(),
  // Aggregate metrics (0-1 scale)
  avgPrecision: text("avg_precision").notNull(), // stored as string to avoid float issues
  avgRecall: text("avg_recall").notNull(),
  avgF1Score: text("avg_f1_score").notNull(),
  avgRelevanceScore: text("avg_relevance_score").notNull(),
  avgAccuracy: text("avg_accuracy").notNull(),
  answerMetrics: jsonb("answer_metrics").$type<Record<string, number | null>>(),
  // Config snapshot
  configSnapshot: jsonb("config_snapshot"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Individual query results within an evaluation run
export const evaluationQueryResults = pgTable(
  "evaluation_query_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .references(() => evaluationRuns.id, { onDelete: "cascade" })
      .notNull(),
    query: text("query").notNull(),
    category: text("category"),
    // Per-query metrics
    precision: text("precision").notNull(),
    recall: text("recall").notNull(),
    f1Score: text("f1_score").notNull(),
    relevanceScore: text("relevance_score").notNull(),
    accuracy: text("accuracy").notNull(),
    // Details
    retrievedChunks: integer("retrieved_chunks").notNull(),
    relevantChunks: integer("relevant_chunks").notNull(),
    totalExpectedRelevant: integer("total_expected_relevant"),
    chunkDetails: jsonb("chunk_details").$type<
      Array<{
        chunkId: string;
        documentTitle: string;
        similarity: number;
        llmRelevanceRating: number | null; // null when the judge is unavailable
        isRelevant: boolean;
      }>
    >(),
    llmAccuracyRating: text("llm_accuracy_rating"), // LLM judge explanation
    answerEvaluation: jsonb("answer_evaluation").$type<{
      response: string;
      referenceAnswer: string | null;
      groundedness: number | null;
      correctness: number | null;
      completeness: number | null;
      citationAccuracy: number | null;
      behaviorPassed: boolean;
      recallMeasured: boolean;
      judgeFailed: boolean;
      explanation: string;
      provenance: import("@/lib/citations").AnswerProvenance;
      citations: import("@/lib/citations").Citation[];
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("eval_query_results_run_idx").on(table.runId)],
);

// Sessions for dashboard authentication
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    key: text("key").primaryKey(),
    hits: integer("hits").default(1).notNull(),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("rate_limit_reset_idx").on(table.resetAt)],
);

export const modelUsage = pgTable(
  "model_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    model: text("model").notNull(),
    purpose: text("purpose").notNull(),
    promptTokens: integer("prompt_tokens").default(0).notNull(),
    completionTokens: integer("completion_tokens").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("model_usage_created_idx").on(table.createdAt)],
);

export const answerFeedback = pgTable(
  "answer_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .references(() => chatMessages.id, { onDelete: "cascade" })
      .notNull(),
    reporterId: uuid("reporter_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    reason: text("reason", {
      enum: ["incorrect", "citation", "unclear", "other"],
    }).notNull(),
    details: text("details"),
    snapshot: jsonb("snapshot")
      .$type<{
        question: string;
        answer: string;
        citations: import("@/lib/citations").Citation[];
        provenance: import("@/lib/citations").AnswerProvenance | null;
      }>()
      .notNull(),
    status: text("status", { enum: ["open", "reviewing", "resolved"] })
      .default("open")
      .notNull(),
    resolution: text("resolution"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("feedback_status_idx").on(table.status, table.createdAt),
    uniqueIndex("feedback_reporter_message_unique").on(
      table.reporterId,
      table.messageId,
    ),
  ],
);

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AppConfig = typeof appConfig.$inferSelect;
export type NewAppConfig = typeof appConfig.$inferInsert;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type NewChatParticipant = typeof chatParticipants.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type NewKnowledgeDocument = typeof knowledgeDocuments.$inferInsert;
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type NewKnowledgeChunk = typeof knowledgeChunks.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type EvaluationTestCase = typeof evaluationTestCases.$inferSelect;
export type NewEvaluationTestCase = typeof evaluationTestCases.$inferInsert;
export type EvaluationRun = typeof evaluationRuns.$inferSelect;
export type NewEvaluationRun = typeof evaluationRuns.$inferInsert;
export type EvaluationQueryResult = typeof evaluationQueryResults.$inferSelect;
export type NewEvaluationQueryResult =
  typeof evaluationQueryResults.$inferInsert;
