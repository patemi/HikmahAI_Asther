import { db, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ participantId: string }>;
}

export default async function ParticipantHistoryPage({ params }: Props) {
  const { participantId } = await params;

  const participant = await db.query.chatParticipants.findFirst({
    where: eq(schema.chatParticipants.id, participantId),
  });

  if (!participant) {
    notFound();
  }

  const messages = await db.query.chatMessages.findMany({
    where: eq(schema.chatMessages.participantId, participantId),
    orderBy: [asc(schema.chatMessages.createdAt)],
  });

  return (
    <div className="space-y-8">
      <div>
        <a
          href="/dashboard/history"
          className="text-stone-500 hover:text-stone-700 text-sm mb-2 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to History
        </a>
        <h1 className="text-2xl font-semibold text-stone-900">
          {participant.name || participant.externalId}
        </h1>
        <p className="text-stone-500 text-sm">ID: {participant.externalId}</p>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-lg p-12 text-center">
          <p className="text-stone-500">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.role === "user"
                  ? "bg-stone-100 border border-stone-200 ml-8"
                  : "bg-white border border-stone-200 mr-8"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-xs font-medium ${
                    message.role === "user" ? "text-stone-700" : "text-stone-500"
                  }`}
                >
                  {message.role === "user" ? "User" : "Assistant"}
                </span>
                <span className="text-stone-400 text-xs">
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-stone-800 whitespace-pre-wrap">{message.content}</p>
              {message.imageUrl && (
                <div className="mt-2">
                  <img
                    src={message.imageUrl}
                    alt="User uploaded"
                    className="max-w-xs rounded border border-stone-200"
                  />
                  {message.imageAnalysis && (
                    <p className="text-stone-500 text-sm mt-1 italic">
                      Analysis: {message.imageAnalysis}
                    </p>
                  )}
                </div>
              )}
              {message.role === "assistant" && (message.promptTokens || message.completionTokens) && (
                <p className="text-stone-400 text-xs mt-2">
                  Tokens: {message.promptTokens} prompt, {message.completionTokens} completion
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
