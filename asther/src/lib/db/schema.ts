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
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Users table for admin dashboard access
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// App configuration (singleton)
export const appConfig = pgTable("app_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Chatbot identity
  botName: text("bot_name").default("Asther").notNull(),
  botPersonality: text("bot_personality").default("friendly and helpful"),
  systemPrompt: text("system_prompt").default(
    "You are a helpful assistant."
  ),
  // API settings
  apiKeyHash: text("api_key_hash"), // Hashed bearer token for API access
  openaiApiKey: text("openai_api_key"),
  baseUrl: text("base_url"),
  // Model settings
  textModel: text("text_model").default("gpt-4.1-nano").notNull(),
  imageModel: text("image_model").default("gpt-4.1").notNull(),
  embeddingModel: text("embedding_model")
    .default("text-embedding-3-small")
    .notNull(),
  // RAG settings
  ragEnabled: boolean("rag_enabled").default(false).notNull(),
  ragTopK: integer("rag_top_k").default(5).notNull(),
  ragMinScore: integer("rag_min_score").default(70).notNull(), // Percentage
  memoryLength: integer("memory_length").default(5).notNull(), // Number of message pairs to include as context
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat participants (external users chatting with the bot)
export const chatParticipants = pgTable("chat_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id").notNull().unique(), // ID from the client app
  name: text("name"),
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
    content: text("content").notNull(),
    // For image messages
    imageUrl: text("image_url"),
    imageAnalysis: text("image_analysis"),
    // Token usage
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chat_messages_participant_idx").on(table.participantId),
    index("chat_messages_created_at_idx").on(table.createdAt),
  ]
);

// Knowledge base documents
export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"), // URL or file name
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Knowledge chunks with embeddings for RAG
export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }), // text-embedding-3-small
    chunkIndex: integer("chunk_index").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_chunks_document_idx").on(table.documentId),
    index("knowledge_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
    index("knowledge_chunks_content_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.content})`
    ),
  ]
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
