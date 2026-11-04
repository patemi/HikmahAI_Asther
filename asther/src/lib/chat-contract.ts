import { z } from "zod";
import { citationSchema } from "@/lib/citations";
import { attachmentsSchema } from "@/lib/chat-features";
export const provenanceSchema = z.object({
  promptVersion: z.string(),
  model: z.string().nullable(),
  status: z.enum([
    "answered",
    "insufficient_sources",
    "out_of_scope",
    "error",
    "stopped",
  ]),
  responseDepth: z.enum(["ringkas", "standar", "mendalam"]),
  guardrailLevel: z.string(),
});
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  attachments: attachmentsSchema,
  feedback: z.enum(["up", "down"]).nullable().optional(),
  createdAt: z.string().optional(),
  citations: z.array(citationSchema).default([]),
  citationNotice: z.string().nullable().optional(),
  provenance: provenanceSchema.nullable().optional(),
});
export type ChatMessage = z.infer<typeof messageSchema>;
export const conversationSchema = z.object({
  participantId: z.string(),
  title: z.string(),
  pinned: z.boolean(),
  archived: z.boolean().default(false),
  updatedAt: z.string(),
  preview: z.string(),
  nickname: z.string().nullable().optional(),
});
export type ConversationItem = z.infer<typeof conversationSchema>;
export const conversationListSchema = z.object({
  conversations: z.array(conversationSchema),
  hasMore: z.boolean(),
  nextPage: z.number().nullable(),
});
export const historySchema = z.object({
  messages: z.array(messageSchema),
  busy: z.boolean(),
  lastUserId: z.string().nullable(),
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
  participant: z.object({
    participantId: z.string(),
    title: z.string(),
    pinned: z.boolean(),
    nickname: z.string().nullable(),
  }),
});
export const frameSchema = z.object({
  type: z.enum(["turn", "citations", "metadata", "error"]).optional(),
  content: z.string().optional(),
  citations: z.array(citationSchema).optional(),
  notice: z.string().nullable().optional(),
  messageId: z.string().nullable().optional(),
  userMessageId: z.string().nullable().optional(),
  provenance: provenanceSchema.optional(),
  error: z.string().optional(),
});
export type ResponseDepth = "ringkas" | "standar" | "mendalam";
