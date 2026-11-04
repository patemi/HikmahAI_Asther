import { db, schema } from "@/lib/db";
import { and, asc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ownedConversation } from "@/lib/conversations";
import { errorResponse, HttpError } from "@/lib/http";
export async function GET(
  _request: Request,
  context: { params: Promise<{ participantId: string }> },
) {
  try {
    const user = await getSession();
    if (!user) throw new HttpError(401, "Silakan masuk terlebih dahulu.");
    const participant = await ownedConversation(
      user.id,
      (await context.params).participantId,
    );
    const messages = await db.query.chatMessages.findMany({
      where: and(
        eq(schema.chatMessages.participantId, participant.id),
        eq(schema.chatMessages.isActive, true),
      ),
      orderBy: [
        asc(schema.chatMessages.createdAt),
        asc(schema.chatMessages.id),
      ],
      limit: 2001,
    });
    if (messages.length > 2000)
      throw new HttpError(
        413,
        "Ekspor dibatasi hingga 2.000 pesan per percakapan.",
      );
    const title =
      (participant.metadata as { title?: string } | null)?.title ||
      "Percakapan Hikmah AI";
    const content =
      "# " +
      title +
      "\n\n" +
      messages
        .map((m) => {
          const attachments = m.attachments
            .map((a) => "\n\n### Lampiran: " + a.name + "\n\n" + a.content)
            .join("");
          const sources = m.citations
            .map(
              (c, i) =>
                "[" +
                (i + 1) +
                "] " +
                c.title +
                (c.source ? " — " + c.source : ""),
            )
            .join("\n");
          return (
            "## " +
            (m.role === "user" ? "Kamu" : "Hikmah AI") +
            "\n\n" +
            m.content +
            attachments +
            (sources ? "\n\n### Rujukan\n\n" + sources : "")
          );
        })
        .join("\n\n---\n\n");
    return new Response(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="hikmah-percakapan.md"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
