import { createHash, randomUUID } from "node:crypto";
import { db, schema } from "@/lib/db";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  chatInputSchema,
  prepareAnswer,
  completeAnswer,
  streamAnswer,
  type ChatHistory,
} from "@/lib/answers";
import { getAppConfig } from "@/lib/app-config";
import { consumeChatLimits } from "@/lib/limits";
import { readJsonRequest, errorResponse, HttpError } from "@/lib/http";
import {
  PROMPT_VERSION,
  type AnswerProvenance,
  type Citation,
} from "@/lib/citations";
import type { SessionUser } from "@/lib/auth";
import { attachmentContext } from "@/lib/chat-features";

export async function handleChatRequest(
  request: Request,
  actor: { user?: SessionUser; apiToken?: string },
) {
  let participant: typeof schema.chatParticipants.$inferSelect | undefined;
  let question: typeof schema.chatMessages.$inferSelect | undefined;
  let leaseUntil: Date | undefined;
  let persisted = false;
  let regenerating = false;
  const upstreamAbort = new AbortController();
  request.signal.addEventListener("abort", () => upstreamAbort.abort(), {
    once: true,
  });
  let citations: Citation[] = [];
  let provenance: AnswerProvenance = {
    promptVersion: PROMPT_VERSION,
    model: null,
    status: "error",
    responseDepth: "standar",
    guardrailLevel: "standar",
  };
  async function release() {
    if (!leaseUntil || !participant) return;
    try {
      await db
        .update(schema.chatParticipants)
        .set({ processingUntil: null })
        .where(
          and(
            eq(schema.chatParticipants.id, participant.id),
            eq(schema.chatParticipants.processingUntil, leaseUntil),
          ),
        );
    } catch {
      console.error(
        "[Chat] Conversation lease release failed; it will expire automatically.",
      );
    }
    leaseUntil = undefined;
  }
  async function save(
    content: string,
    status: AnswerProvenance["status"],
    promptTokens = 0,
    completionTokens = 0,
  ) {
    if (!participant || !question || persisted) return null;
    const target = participant;
    const source = question;
    const saved = await db.transaction(async (tx) => {
      if (regenerating)
        await tx
          .update(schema.chatMessages)
          .set({ isActive: false })
          .where(
            and(
              eq(schema.chatMessages.participantId, target.id),
              eq(schema.chatMessages.role, "assistant"),
              eq(schema.chatMessages.isActive, true),
              gte(schema.chatMessages.createdAt, source.createdAt),
            ),
          );
      const [answer] = await tx
        .insert(schema.chatMessages)
        .values({
          participantId: target.id,
          role: "assistant",
          content,
          citations,
          provenance: { ...provenance, status },
          citationNotice:
            !citations.length && status === "answered"
              ? "Jawaban ini belum didukung rujukan terkelola."
              : null,
          promptTokens,
          completionTokens,
          createdAt: new Date(
            Math.max(Date.now(), source.createdAt.getTime() + 1),
          ),
        })
        .returning({ id: schema.chatMessages.id });
      await tx
        .update(schema.chatParticipants)
        .set({ updatedAt: new Date() })
        .where(eq(schema.chatParticipants.id, target.id));
      return answer.id;
    });
    persisted = true;
    return saved;
  }
  try {
    const parsed = chatInputSchema.safeParse(
      await readJsonRequest(request, 384_000),
    );
    if (!parsed.success)
      throw new HttpError(400, parsed.error.issues[0].message);
    const input = parsed.data;
    provenance.responseDepth = input.responseDepth;
    regenerating = Boolean(input.regenerateFor);
    if (regenerating && !input.saveHistory)
      throw new HttpError(
        400,
        "Buat ulang hanya tersedia pada percakapan tersimpan.",
      );
    await consumeChatLimits(
      actor.user?.id ||
        createHash("sha256")
          .update(actor.apiToken || "")
          .digest("hex"),
    );
    if (input.saveHistory) {
      const ownerId = actor.user?.id || null;
      if (!regenerating)
        await db
          .insert(schema.chatParticipants)
          .values({
            externalId: input.participantId,
            name: input.userName,
            metadata: { userId: ownerId, title: input.message.slice(0, 70) },
          })
          .onConflictDoNothing({ target: schema.chatParticipants.externalId });
      participant = await db.query.chatParticipants.findFirst({
        where: eq(schema.chatParticipants.externalId, input.participantId),
      });
      if (!participant) throw new HttpError(404, "Percakapan tidak ditemukan.");
      const owner =
        participant.metadata &&
        typeof participant.metadata === "object" &&
        "userId" in participant.metadata
          ? participant.metadata.userId
          : null;
      if (owner !== ownerId)
        throw new HttpError(
          403,
          "Kamu tidak punya akses ke percakapan ini.",
        );
      const until = new Date(Date.now() + 900000);
      const [lease] = await db
        .update(schema.chatParticipants)
        .set({
          processingUntil: until,
          archived: false,
          name: input.userName || participant.name,
        })
        .where(
          and(
            eq(schema.chatParticipants.id, participant.id),
            sql`(${schema.chatParticipants.processingUntil} IS NULL OR ${schema.chatParticipants.processingUntil} < now())`,
          ),
        )
        .returning({ id: schema.chatParticipants.id });
      if (!lease)
        throw new HttpError(
          409,
          "Tunggu jawaban sebelumnya selesai sebelum mengirim pesan lagi.",
        );
      leaseUntil = until;
      if (input.regenerateFor) {
        question = await db.query.chatMessages.findFirst({
          where: and(
            eq(schema.chatMessages.participantId, participant.id),
            eq(schema.chatMessages.role, "user"),
            eq(schema.chatMessages.isActive, true),
          ),
          orderBy: [
            desc(schema.chatMessages.createdAt),
            desc(schema.chatMessages.id),
          ],
        });
        if (
          !question ||
          question.id !== input.regenerateFor ||
          question.content !== input.message
        ) {
          question = undefined;
          throw new HttpError(
            409,
            "Hanya jawaban untuk pertanyaan terakhir yang dapat dibuat ulang.",
          );
        }
      } else {
        const [inserted] = await db
          .insert(schema.chatMessages)
          .values({
            id: input.requestId || randomUUID(),
            participantId: participant.id,
            role: "user",
            content: input.message,
            imageUrl: input.imageUrl,
            attachments: input.attachments,
          })
          .onConflictDoNothing()
          .returning();
        if (!inserted)
          throw new HttpError(
            409,
            "Pesan sudah diterima. Muat ulang percakapan sebelum mencoba kembali.",
          );
        question = inserted;
      }
    }
    const config = await getAppConfig();
    const rows = participant
      ? await db.query.chatMessages.findMany({
          where: and(
            eq(schema.chatMessages.participantId, participant.id),
            eq(schema.chatMessages.isActive, true),
          ),
          orderBy: [
            desc(schema.chatMessages.createdAt),
            desc(schema.chatMessages.id),
          ],
          limit: (config?.memoryLength || 5) * 2 + 2,
        })
      : [];
    const history: ChatHistory = !input.saveHistory
      ? input.history
      : rows
          .reverse()
          .filter(
            (row) =>
              row.id !== question?.id &&
              (!question || row.createdAt < question.createdAt) &&
              (row.role === "user" ||
                (row.role === "assistant" &&
                  !["error", "stopped"].includes(
                    row.provenance?.status || "",
                  ))),
          )
          .slice(-(config?.memoryLength || 5) * 2)
          .map((row) => ({
            role: row.role as "user" | "assistant",
            content: row.content + attachmentContext(row.attachments),
          }));
    const prepared = await prepareAnswer(input, history);
    citations = prepared.citations;
    provenance = prepared.provenance;
    if (request.signal.aborted) {
      await save("Respons dihentikan.", "stopped");
      await release();
      return new Response(null, { status: 499 });
    }
    const streamed =
      prepared.fixedContent === null
        ? await streamAnswer(prepared, upstreamAbort.signal)
        : null;
    const completed = !streamed ? await completeAnswer(prepared) : null;
    provenance = streamed?.provenance || completed!.provenance;
    let cancelled = false;
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        const send = (payload: unknown) => {
          if (!cancelled && !request.signal.aborted)
            controller.enqueue(
              encoder.encode("data: " + JSON.stringify(payload) + "\n\n"),
            );
        };
        let content = completed?.content || "";
        let promptTokens = completed?.promptTokens || 0;
        let completionTokens = completed?.completionTokens || 0;
        try {
          send({ type: "turn", userMessageId: question?.id || null });
          send({
            type: "citations",
            citations,
            notice:
              !citations.length && provenance.status === "answered"
                ? "Jawaban ini belum didukung rujukan terkelola."
                : null,
          });
          if (streamed) {
            for await (const chunk of streamed.stream) {
              if (cancelled || request.signal.aborted) break;
              const delta = chunk.choices[0]?.delta?.content || "";
              content += delta;
              if (chunk.usage) {
                promptTokens = chunk.usage.prompt_tokens;
                completionTokens = chunk.usage.completion_tokens;
              }
              if (delta) send({ content: delta });
            }
          } else send({ content });
          const stopped = cancelled || request.signal.aborted;
          if (!content.trim() && !stopped)
            throw new HttpError(
              503,
              "Model belum menghasilkan jawaban. Silakan buat ulang jawaban.",
            );
          const messageId = await save(
            content || "Respons dihentikan.",
            stopped ? "stopped" : provenance.status,
            promptTokens,
            completionTokens,
          );
          send({
            type: "metadata",
            messageId,
            userMessageId: question?.id || null,
            provenance,
          });
          if (!cancelled && !request.signal.aborted)
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          const stopped = cancelled || request.signal.aborted;
          if (stopped)
            await save(
              content || "Respons dihentikan.",
              "stopped",
              promptTokens,
              completionTokens,
            );
          else {
            if (!regenerating)
              await save(
                content ||
                  "Jawaban belum dapat diselesaikan. Silakan buat ulang jawaban.",
                "error",
                promptTokens,
                completionTokens,
              );
            send({
              type: "error",
              error:
                error instanceof HttpError
                  ? error.message
                  : "Jawaban belum dapat diselesaikan. Silakan buat ulang jawaban.",
            });
          }
        } finally {
          await release();
          if (!cancelled && !request.signal.aborted) controller.close();
        }
      },
      cancel() {
        cancelled = true;
        upstreamAbort.abort();
      },
    });
    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (question && (!regenerating || request.signal.aborted)) {
      try {
        await save(
          request.signal.aborted
            ? "Respons dihentikan."
            : "Layanan belum dapat menjawab. Silakan buat ulang jawaban.",
          request.signal.aborted ? "stopped" : "error",
        );
      } catch {
        console.error("[Chat] Could not persist the interrupted response.");
      }
    }
    await release();
    return errorResponse(error);
  }
}
