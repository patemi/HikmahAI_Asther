"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/* ── Crescent icon ── */
function CrescentIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c1.292 0 2.526-.245 3.66-.69A8 8 0 0 1 8 12a8 8 0 0 1 7.66-9.31A10.052 10.052 0 0 0 12 2z" />
      <circle cx="18" cy="6" r="1.5" />
    </svg>
  );
}

export default function ChatClient({
  botName,
}: {
  botName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [participantId, setParticipantId] = useState("");
  const [userName, setUserName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ── lifecycle ─────────────────────────────────────────── */
  useEffect(() => {
    const storedId = sessionStorage.getItem("asther-participant-id");
    const storedName = sessionStorage.getItem("asther-user-name");

    if (storedId) {
      setParticipantId(storedId);
    } else {
      const newId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      sessionStorage.setItem("asther-participant-id", newId);
      setParticipantId(newId);
    }

    if (storedName) {
      setUserName(storedName);
      setShowNameInput(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── handlers ──────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const activeParticipantId = participantId || `user-${Date.now()}`;
    if (!participantId) {
      setParticipantId(activeParticipantId);
      sessionStorage.setItem("asther-participant-id", activeParticipantId);
    }

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      const response = await fetch("/api/chat/web", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId: activeParticipantId,
          message: userMessage,
          userName: userName || undefined,
          saveHistory: true,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const { content } = JSON.parse(data);
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return updated;
                });
              }
            } catch {
              // skip invalid JSON chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    const newId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    sessionStorage.setItem("asther-participant-id", newId);
    setParticipantId(newId);
  }

  function handleNameChange(name: string) {
    setUserName(name);
    sessionStorage.setItem("asther-user-name", name);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
    setInput(el.value);
  }

  /* ── render ────────────────────────────────────────────── */
  return (
    <div className="h-dvh flex flex-col bg-[#050a08] text-[#e8f0ec] font-[family-name:var(--font-dm-sans)]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 sm:px-6 h-16 border-b border-[#2dd4a8]/[0.08] bg-[#050a08]/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center size-9 rounded-full border border-[#2dd4a8]/[0.12] hover:bg-[#2dd4a8]/[0.06] transition-colors"
            aria-label="Back to home"
          >
            <svg
              className="w-4 h-4 text-[#7a9d8e]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <CrescentIcon className="w-5 h-5 text-[#2dd4a8]" />
            <div>
              <h1 className="font-[family-name:var(--font-playfair)] font-bold text-lg leading-tight">
                {botName}
              </h1>
              <p className="text-xs text-[#4a6b5c]">Asisten AI Keislaman</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showNameInput ? (
            <input
              type="text"
              value={userName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => {
                if (!userName) setShowNameInput(false);
              }}
              placeholder="Nama Anda..."
              autoFocus
              className="w-32 px-3 py-1.5 text-sm bg-[#2dd4a8]/[0.05] border border-[#2dd4a8]/[0.12] rounded-lg text-[#e8f0ec] placeholder-[#4a6b5c] focus:outline-none focus:border-[#2dd4a8]/30 transition-colors"
            />
          ) : (
            <button
              onClick={() => setShowNameInput(true)}
              className="text-xs text-[#4a6b5c] hover:text-[#7a9d8e] transition-colors px-2 py-1"
              title="Set your name"
            >
              {userName || "Atur nama"}
            </button>
          )}
          <button
            onClick={clearChat}
            className="flex items-center justify-center size-9 rounded-full border border-[#2dd4a8]/[0.12] hover:bg-[#2dd4a8]/[0.06] transition-colors"
            title="Percakapan baru"
          >
            <svg
              className="w-4 h-4 text-[#7a9d8e]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto chat-scrollbar">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              {/* Islamic geometric ornament */}
              <div className="size-20 rounded-2xl bg-[#2dd4a8]/[0.08] border border-[#2dd4a8]/[0.1] flex items-center justify-center mb-6">
                <CrescentIcon className="w-10 h-10 text-[#2dd4a8]" />
              </div>

              {/* Greeting with Salam */}
              <p className="text-[#d4a72d]/70 text-lg mb-2 font-[family-name:var(--font-playfair)] italic">
                بِسْمِ اللَّهِ
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold mb-2">
                {userName ? `Assalamu'alaikum, ${userName}!` : "Assalamu'alaikum!"}
              </h2>
              <p className="text-[#4a6b5c] max-w-sm">
                Tanyakan apa saja seputar Islam kepada {botName}. Saya siap membantu Anda mencari ilmu.
              </p>

              {/* Suggested prompts */}
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {[
                  "Apa hukum sholat tahajjud?",
                  "Jelaskan tentang rukun iman",
                  "Bagaimana adab berdoa?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      inputRef.current?.focus();
                    }}
                    className="px-4 py-2 text-sm border border-[#2dd4a8]/[0.1] rounded-full hover:bg-[#2dd4a8]/[0.06] hover:border-[#2dd4a8]/[0.18] transition-all text-[#7a9d8e] hover:text-[#e8f0ec]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] ${
                  message.role === "user"
                    ? "bg-[#2dd4a8] text-[#050a08] rounded-2xl rounded-br-md px-5 py-3"
                    : "bg-[#2dd4a8]/[0.05] border border-[#2dd4a8]/[0.08] rounded-2xl rounded-bl-md px-5 py-3"
                }`}
              >
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-[#2dd4a8]/[0.05] border border-[#2dd4a8]/[0.08] rounded-2xl rounded-bl-md px-5 py-4">
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-2 bg-[#2dd4a8]/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="size-2 bg-[#2dd4a8]/60 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="size-2 bg-[#2dd4a8]/60 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-[#2dd4a8]/[0.08] bg-[#050a08]/80 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-end gap-3 bg-[#2dd4a8]/[0.04] border border-[#2dd4a8]/[0.1] rounded-2xl px-4 py-3 focus-within:border-[#2dd4a8]/25 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={autoResize}
              onKeyDown={handleKeyDown}
              placeholder={`Tanyakan sesuatu kepada ${botName}...`}
              disabled={loading}
              rows={1}
              className="flex-1 bg-transparent text-[#e8f0ec] placeholder-[#4a6b5c] focus:outline-none resize-none text-[15px] leading-relaxed max-h-40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-[#2dd4a8] text-[#050a08] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#3ee0b5] transition-colors active:scale-95"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <p className="text-center text-[11px] text-[#2a3d33] mt-3">
            Powered by HikmahAI &middot; Jawaban mungkin tidak selalu akurat, selalu verifikasi dengan ulama
          </p>
        </form>
      </div>
    </div>
  );
}
