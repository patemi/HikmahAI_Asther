"use client";

import { useState } from "react";
import { deleteParticipantChat } from "@/app/actions/chat";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";

interface Participant {
  id: string;
  externalId: string;
  name: string | null;
  updatedAt: Date;
}

interface HistoryClientProps {
  participants: Participant[];
}

export default function HistoryClient({ participants }: HistoryClientProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleDelete(participantId: string) {
    setDeletingId(participantId);
    setShowConfirm(null);

    const result = await deleteParticipantChat(participantId);

    if (result.error) {
      setToast({ type: "error", text: result.error });
    } else {
      setToast({ type: "success", text: "Chat history deleted successfully" });
      router.refresh();
    }

    setDeletingId(null);
  }

  return (
    <div className="space-y-8">
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Chat History</h1>
        <p className="text-sm text-stone-500 mt-1">
          View and manage conversation history from all participants
        </p>
      </div>

      {participants.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-lg p-12 text-center">
          <p className="text-stone-600 mb-2">No chat history yet.</p>
          <p className="text-stone-400 text-sm">
            Conversations will appear here when users start chatting with the bot.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="bg-white border border-stone-200 rounded-lg p-6 hover:border-stone-300 transition-colors"
            >
              <div className="flex justify-between items-center">
                <a
                  href={`/dashboard/history/${participant.id}`}
                  className="flex-1"
                >
                  <h3 className="text-lg font-medium text-stone-900">
                    {participant.name || participant.externalId}
                  </h3>
                  <p className="text-stone-500 text-sm">
                    ID: {participant.externalId}
                  </p>
                </a>
                <div className="flex items-center gap-4">
                  <p className="text-stone-400 text-sm">
                    Last active: {new Date(participant.updatedAt).toLocaleString()}
                  </p>
                  {showConfirm === participant.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-600">Delete?</span>
                      <button
                        onClick={() => handleDelete(participant.id)}
                        disabled={deletingId === participant.id}
                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded"
                      >
                        {deletingId === participant.id ? "..." : "Yes"}
                      </button>
                      <button
                        onClick={() => setShowConfirm(null)}
                        className="px-2 py-1 text-xs bg-stone-200 hover:bg-stone-300 text-stone-700 rounded"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirm(participant.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete chat history"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
