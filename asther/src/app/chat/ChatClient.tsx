"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationItem {
  participantId: string;
  title: string;
  preview: string;
  updatedAt: string;
  nickname?: string | null;
}

interface ChatClientProps {
  botName: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

function CrescentIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c1.292 0 2.526-.245 3.66-.69A8 8 0 0 1 8 12a8 8 0 0 1 7.66-9.31A10.052 10.052 0 0 0 12 2z" />
      <circle cx="18" cy="6" r="1.5" />
    </svg>
  );
}

function createConversationId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatClient({ botName, user }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [participantId, setParticipantId] = useState("");
  const [userName, setUserName] = useState(user.name || user.email.split("@")[0] || "");
  const [showNameInput, setShowNameInput] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/conversations", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch {
      // noop
    }
  }, []);

  const loadMessages = useCallback(async (targetParticipantId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${targetParticipantId}`, {
        cache: "no-store",
      });

      if (!response.ok) return;
      const data = await response.json();

      setMessages(data.messages || []);
      if (data?.participant?.nickname) {
        setUserName(data.participant.nickname);
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!conversations.length && !participantId) {
      setParticipantId(createConversationId());
      setMessages([]);
      return;
    }

    if (conversations.length && !participantId) {
      const latest = conversations[0];
      setParticipantId(latest.participantId);
      loadMessages(latest.participantId);
    }
  }, [conversations, participantId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || !participantId) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      const response = await fetch("/api/chat/web", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId,
          message: userMessage,
          userName: userName || undefined,
          saveHistory: true,
        }),
      });

      if (response.status === 401) {
        window.location.reload();
        return;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder("utf-8");
      let assistantMessage = "";
      let sseBuffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const events = sseBuffer.split("\n\n");
        sseBuffer = events.pop() || "";

        for (const event of events) {
          const lines = event.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const { content } = JSON.parse(data);
              if (!content) continue;

              assistantMessage += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                };
                return updated;
              });
            } catch {
              // wait until JSON complete
            }
          }
        }
      }

      decoder.decode();
      await loadConversations();
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function clearChat() {
    const newId = createConversationId();
    setParticipantId(newId);
    setMessages([]);
    await loadConversations();
  }

  async function openConversation(targetParticipantId: string) {
    setParticipantId(targetParticipantId);
    await loadMessages(targetParticipantId);
  }

  async function deleteConversation(targetParticipantId: string) {
    await fetch("/api/chat/conversations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: targetParticipantId }),
    });

    if (participantId === targetParticipantId) {
      const newId = createConversationId();
      setParticipantId(newId);
      setMessages([]);
    }
    await loadConversations();
  }

  async function handleLogout() {
    await fetch("/api/chat-auth/logout", { method: "POST" });
    window.location.reload();
  }

  function handleNameChange(name: string) {
    setUserName(name);
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

  function renderAssistantMarkdown(content: string) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-[#d4e8df]">{children}</strong>,
          code: ({ className, children }) => {
            const isInline = !className;
            return isInline ? (
              <code className="px-1 py-0.5 rounded bg-[#2dd4a8]/10 text-[#9de6cf] text-[12px]">{children}</code>
            ) : (
              <code className="block p-3 rounded-xl bg-[#081510] border border-[#2dd4a8]/15 text-[#c7e9dc] text-[12px] overflow-x-auto">
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  return (
    <div className="h-dvh flex bg-[#050a08] text-[#e8f0ec] font-[family-name:var(--font-dm-sans)]">
      <aside
        className={`${sidebarOpen ? "w-[280px]" : "w-0"} transition-all duration-200 overflow-hidden border-r border-white/[0.05] bg-[#06120e]`}
      >
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-white/[0.05]">
            <button
              onClick={clearChat}
              className="w-full rounded-xl bg-[#2dd4a8] text-[#050a08] text-sm font-semibold py-2.5"
            >
              + Chat Baru
            </button>
          </div>

          <div className="flex-1 overflow-y-auto chat-scrollbar p-2 space-y-1">
            {conversations.map((conv) => (
              <div key={conv.participantId} className="group">
                <button
                  onClick={() => openConversation(conv.participantId)}
                  className={`w-full text-left p-2.5 rounded-lg border ${
                    participantId === conv.participantId
                      ? "border-[#2dd4a8]/25 bg-[#2dd4a8]/10"
                      : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.03]"
                  }`}
                >
                  <p className="text-sm text-[#d2e7dc] line-clamp-1">{conv.title || "Percakapan"}</p>
                  <p className="text-[11px] text-[#4a6b5c] line-clamp-1 mt-0.5">{conv.preview || "Belum ada pesan"}</p>
                </button>
                <button
                  onClick={() => deleteConversation(conv.participantId)}
                  className="hidden group-hover:block text-[10px] text-red-300/70 hover:text-red-300 px-2 pt-1"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-white/[0.05]">
            <p className="text-xs text-[#7a9d8e] mb-2 truncate">{user.name || user.email}</p>
            <button
              onClick={handleLogout}
              className="w-full rounded-lg border border-white/[0.08] py-2 text-xs text-[#9ab8a8] hover:bg-white/[0.04]"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 h-dvh flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 sm:px-6 h-16 bg-[#050a08]/80 backdrop-blur-2xl shrink-0 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="flex items-center justify-center size-9 rounded-xl border border-white/[0.07] hover:bg-[#2dd4a8]/[0.06]"
            >
              <svg className="w-4 h-4 text-[#6a8d7e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link
              href="/"
              className="flex items-center justify-center size-9 rounded-xl border border-white/[0.07] hover:bg-[#2dd4a8]/[0.06]"
              aria-label="Back to home"
            >
              <svg className="w-4 h-4 text-[#6a8d7e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-gradient-to-br from-[#2dd4a8]/20 to-[#2dd4a8]/5 border border-[#2dd4a8]/20 flex items-center justify-center">
                <CrescentIcon className="w-5 h-5 text-[#2dd4a8]" />
              </div>
              <div>
                <h1 className="font-[family-name:var(--font-playfair)] font-bold text-base leading-tight">{botName}</h1>
                <p className="text-[10px] text-[#2dd4a8]/60">Memory aktif · History tersimpan</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {showNameInput ? (
              <input
                type="text"
                value={userName}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => setShowNameInput(false)}
                placeholder="Nama panggilan"
                autoFocus
                className="w-36 px-3 py-1.5 text-sm bg-[#2dd4a8]/[0.05] border border-[#2dd4a8]/[0.12] rounded-lg text-[#e8f0ec] placeholder-[#3a5a48] focus:outline-none"
              />
            ) : (
              <button
                onClick={() => setShowNameInput(true)}
                className="text-xs text-[#3a5a48] hover:text-[#7a9d8e] px-2 py-1 rounded-lg hover:bg-white/[0.04]"
              >
                {userName || "Atur panggilan"}
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto chat-scrollbar relative">
          <div
            className="absolute inset-0 opacity-[0.015] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(rgba(45,212,168,0.8) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <p className="text-[#d4a72d]/65 text-xl mb-3 font-[family-name:var(--font-playfair)]">بِسْمِ اللَّهِ</p>
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold mb-2 text-[#d4e8df]">
                  Assalamu'alaikum, {userName || user.name || "Sahabat"}!
                </h2>
                <p className="text-[#4a6b5c] max-w-sm text-sm">
                  Riwayat percakapan Anda tersimpan per akun. Lanjutkan percakapan lama dari sidebar kiri.
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-end gap-2.5 ${message.role === "user" ? "flex-row-reverse" : "flex-row"} animate-fade-in`}
              >
                {message.role === "assistant" ? (
                  <div className="size-8 rounded-xl bg-gradient-to-br from-[#2dd4a8]/15 to-[#2dd4a8]/5 border border-[#2dd4a8]/15 flex items-center justify-center shrink-0 mb-0.5">
                    <CrescentIcon className="w-4 h-4 text-[#2dd4a8]" />
                  </div>
                ) : (
                  <div className="size-8 rounded-xl bg-[#2dd4a8]/80 flex items-center justify-center shrink-0 mb-0.5 text-[#050a08] font-bold text-xs font-[family-name:var(--font-playfair)]">
                    {(userName || user.name || user.email)[0]?.toUpperCase() || "U"}
                  </div>
                )}

                <div
                  className={`max-w-[78%] sm:max-w-[68%] ${
                    message.role === "user"
                      ? "bg-[#2dd4a8] text-[#050a08] rounded-2xl rounded-br-sm px-4 py-3"
                      : "bg-[#0d1f18] border border-[#2dd4a8]/[0.1] rounded-2xl rounded-bl-sm px-4 py-3"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="text-[14.5px] leading-relaxed text-[#c7e9dc] break-words">
                      {renderAssistantMarkdown(message.content)}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed font-medium break-words">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2.5 animate-fade-in">
                <div className="size-8 rounded-xl bg-gradient-to-br from-[#2dd4a8]/15 to-[#2dd4a8]/5 border border-[#2dd4a8]/15 flex items-center justify-center shrink-0">
                  <CrescentIcon className="w-4 h-4 text-[#2dd4a8]" />
                </div>
                <div className="bg-[#0d1f18] border border-[#2dd4a8]/[0.1] rounded-2xl rounded-bl-sm px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="size-1.5 bg-[#2dd4a8]/50 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 bg-[#050a08]/90 backdrop-blur-2xl">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#2dd4a8]/10 to-transparent" />
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 pb-4">
            <div className="flex items-end gap-3 bg-[#0d1f18]/80 border border-[#2dd4a8]/[0.12] rounded-2xl px-4 py-3 focus-within:border-[#2dd4a8]/25 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={autoResize}
                onKeyDown={handleKeyDown}
                placeholder={`Tanyakan kepada ${botName}...`}
                disabled={loading}
                rows={1}
                className="flex-1 bg-transparent text-[#d4e8df] placeholder-[#3a5a48] focus:outline-none resize-none text-[14.5px] leading-relaxed max-h-40 disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex items-center justify-center size-9 shrink-0 rounded-xl bg-[#2dd4a8] text-[#050a08] disabled:opacity-25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-[10px] text-[#1e3328]">History tersimpan per akun Anda</p>
              <p className="text-[10px] text-[#1e3328]">Enter kirim · Shift+Enter baris baru</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
