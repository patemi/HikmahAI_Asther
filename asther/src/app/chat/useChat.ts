"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  frameSchema,
  historySchema,
  type ChatMessage,
  type ResponseDepth,
} from "@/lib/chat-contract";
import { readSseEvents } from "@/lib/sse";
import { attachmentContext, type ChatAttachment } from "@/lib/chat-features";

export async function apiError(response: Response) {
  const data: unknown = await response.json().catch(() => null);
  return data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
    ? data.error
    : "Permintaan belum dapat diproses. Silakan coba kembali.";
}
export function useChat(userName: string) {
  const router = useRouter();
  const search = useSearchParams();
  const selected = search.get("c") || "";
  const [activeId, setActiveId] = useState(selected);
  const [confirmedUserId, setConfirmedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [title, setTitle] = useState("Percakapan baru");
  const [phase, setPhase] = useState<
    "idle" | "thinking" | "streaming" | "stopping"
  >("idle");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [serverBusy, setServerBusy] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [depth, setDepth] = useState<ResponseDepth>("standar");
  const [temporary, setTemporary] = useState(false);
  const active = useRef("");
  const controller = useRef<AbortController | null>(null);
  const confirmedUser = useRef<string | null>(null);
  const cursor = useRef<string | null>(null);
  const alive = useRef(true);
  const busy = phase !== "idle" || serverBusy;

  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        const value = localStorage.getItem("hikmah:response-depth");
        if (value === "ringkas" || value === "standar" || value === "mendalam")
          setDepth(value);
      } catch {
        /* Browser storage may be unavailable. */
      }
    });
  }, []);
  function changeDepth(value: ResponseDepth) {
    setDepth(value);
    try {
      localStorage.setItem("hikmah:response-depth", value);
    } catch {
      /* The preference still applies to the current chat. */
    }
  }

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
      setTemporary(false);
    };
  }, []);
  const load = useCallback(async (id: string, signal?: AbortSignal) => {
    const response = await fetch(
      "/api/chat/conversations/" + encodeURIComponent(id),
      { cache: "no-store", signal },
    );
    if (response.status === 401) {
      window.location.assign("/chat");
      return null;
    }
    if (!response.ok) throw new Error(await apiError(response));
    const data = historySchema.parse(await response.json());
    if (!alive.current || active.current !== id || signal?.aborted) return null;
    setMessages(data.messages);
    setTitle(data.participant.title);
    confirmedUser.current = data.lastUserId;
    setConfirmedUserId(data.lastUserId);
    cursor.current = data.nextCursor;
    setHasOlder(data.hasMore);
    setServerBusy(data.busy);
    return data;
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    void Promise.resolve().then(async () => {
      if (abort.signal.aborted || selected === active.current) return;
      controller.current?.abort();
      setPhase("idle");
      active.current = selected;
      setActiveId(selected);
      confirmedUser.current = null;
      setConfirmedUserId(null);
      cursor.current = null;
      setMessages([]);
      setError("");
      setTitle("Percakapan baru");
      setHasOlder(false);
      setServerBusy(false);
      setLoadingHistory(false);
      if (!selected) return;
      setLoadingHistory(true);
      try {
        await load(selected, abort.signal);
      } catch (error) {
        if (!abort.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Riwayat belum dapat dimuat.",
          );
      } finally {
        if (!abort.signal.aborted) setLoadingHistory(false);
      }
    });
    return () => abort.abort();
  }, [selected, load]);
  useEffect(() => {
    if (!serverBusy || phase !== "idle" || !selected) return;
    const timer = setInterval(() => {
      void load(selected).catch(() =>
        setError("Status jawaban belum dapat diperbarui."),
      );
    }, 1500);
    return () => clearInterval(timer);
  }, [serverBusy, phase, selected, load]);

  function newChat(temporaryMode = false) {
    if (busy) return;
    setTemporary(temporaryMode);
    active.current = "";
    setActiveId("");
    confirmedUser.current = null;
    setConfirmedUserId(null);
    cursor.current = null;
    setMessages([]);
    setTitle("Percakapan baru");
    setError("");
    setLoadingHistory(false);
    setHasOlder(false);
    router.push("/chat");
  }
  function select(id: string) {
    if (!busy && id !== active.current) {
      setLoadingHistory(true);
      router.push("/chat?c=" + encodeURIComponent(id));
    }
  }
  async function loadOlder() {
    if (!active.current || !cursor.current || loadingOlder) return false;
    const id = active.current;
    setLoadingOlder(true);
    try {
      const response = await fetch(
        "/api/chat/conversations/" +
          encodeURIComponent(id) +
          "?before=" +
          encodeURIComponent(cursor.current),
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error(await apiError(response));
      const data = historySchema.parse(await response.json());
      if (id !== active.current) return false;
      setMessages((current) => [
        ...data.messages.filter(
          (item) => !current.some((m) => m.id === item.id),
        ),
        ...current,
      ]);
      cursor.current = data.nextCursor;
      setHasOlder(data.hasMore);
      return true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Pesan sebelumnya belum dapat dimuat.",
      );
      return false;
    } finally {
      setLoadingOlder(false);
    }
  }
  async function reconcile(id: string) {
    for (
      let attempt = 0;
      attempt < 20 && alive.current && active.current === id;
      attempt++
    ) {
      const state = await load(id);
      if (!state?.busy) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  async function send(
    text: string,
    regenerate = false,
    attachments: ChatAttachment[] = [],
  ) {
    if (!text.trim() || busy || loadingHistory) return;
    const id = active.current || "chat-" + crypto.randomUUID();
    const userId =
      regenerate && !temporary ? confirmedUser.current : crypto.randomUUID();
    if (!userId) return;
    active.current = id;
    setActiveId(id);
    if (!selected && !temporary)
      router.replace("/chat?c=" + encodeURIComponent(id), { scroll: false });
    const localId = "pending-" + crypto.randomUUID();
    const now = new Date().toISOString();
    setError("");
    setPhase("thinking");
    if (!regenerate) {
      confirmedUser.current = null;
      setConfirmedUserId(null);
      setTitle((current) =>
        current === "Percakapan baru" ? text.slice(0, 70) : current,
      );
      setMessages((current) => [
        ...current,
        {
          id: userId,
          role: "user",
          content: text,
          attachments,
          citations: [],
          createdAt: now,
        },
        {
          id: localId,
          role: "assistant",
          content: "",
          attachments: [],
          citations: [],
          createdAt: now,
        },
      ]);
    } else
      setMessages((current) => [
        ...(current.at(-1)?.role === "assistant"
          ? current.slice(0, -1)
          : current),
        {
          id: localId,
          role: "assistant",
          content: "",
          attachments: [],
          citations: [],
          createdAt: now,
        },
      ]);
    const abort = new AbortController();
    controller.current = abort;
    let accumulated = "";
    let finished = false;
    try {
      const response = await fetch("/api/chat/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abort.signal,
        body: JSON.stringify({
          participantId: id,
          message: text,
          userName,
          responseDepth: depth,
          includeCitations: true,
          saveHistory: !temporary,
          attachments,
          ...(temporary
            ? { history: temporaryContext(messages, regenerate) }
            : {}),
          ...(regenerate && !temporary
            ? { regenerateFor: userId }
            : { requestId: userId }),
        }),
      });
      if (response.status === 401) {
        window.location.assign("/chat");
        return;
      }
      if (!response.ok) throw new Error(await apiError(response));
      if (!response.body) throw new Error("Respons layanan kosong.");
      let assistantId = localId;
      for await (const raw of readSseEvents(response.body)) {
        if (!alive.current || active.current !== id) break;
        if (raw === "[DONE]") {
          finished = true;
          break;
        }
        const event = frameSchema.parse(JSON.parse(raw));
        if (event.type === "error")
          throw new Error(event.error || "Jawaban belum selesai.");
        if (event.userMessageId) {
          confirmedUser.current = event.userMessageId;
          setConfirmedUserId(event.userMessageId);
        }
        if (event.content) {
          accumulated += event.content;
          setPhase("streaming");
        }
        const replacementId = event.messageId || assistantId;
        const targetId = assistantId;
        const text = accumulated;
        setMessages((current) =>
          current.map((message) =>
            message.id !== targetId
              ? message
              : {
                  ...message,
                  id: replacementId,
                  content: text,
                  ...(event.citations
                    ? {
                        citations: event.citations,
                        citationNotice: event.notice,
                      }
                    : {}),
                  ...(event.provenance ? { provenance: event.provenance } : {}),
                },
          ),
        );
        assistantId = replacementId;
      }
      if (!finished && !abort.signal.aborted)
        throw new Error("Respons terputus. Silakan buat ulang jawaban.");
    } catch (error) {
      if (alive.current && active.current === id) {
        if (abort.signal.aborted) setPhase("stopping");
        else
          setError(
            error instanceof Error
              ? error.message
              : "Jawaban belum dapat dimuat.",
          );
      }
    } finally {
      if (alive.current && active.current === id) {
        try {
          if (!temporary) await reconcile(id);
          else if (abort.signal.aborted || !finished)
            setMessages((current) =>
              current.map((m) =>
                m.id === localId
                  ? {
                      ...m,
                      content:
                        accumulated ||
                        (abort.signal.aborted
                          ? "Respons dihentikan."
                          : "Jawaban belum dapat diselesaikan."),
                      provenance: {
                        promptVersion: "temporary",
                        model: null,
                        status: abort.signal.aborted ? "stopped" : "error",
                        responseDepth: depth,
                        guardrailLevel: "standar",
                      },
                    }
                  : m,
              ),
            );
        } catch {
          if (!finished)
            setError(
              "Percakapan belum dapat disinkronkan. Muat ulang sebelum mengirim ulang pesan.",
            );
        }
        setPhase("idle");
        if (!temporary) setRefreshKey((key) => key + 1);
      }
      if (controller.current === abort) controller.current = null;
    }
  }
  function stop() {
    if (controller.current) {
      setPhase("stopping");
      controller.current.abort();
    }
  }
  function regenerate() {
    const question = [...messages].reverse().find((m) => m.role === "user");
    if (question && (temporary || confirmedUser.current))
      return send(question.content, true, question.attachments);
  }
  async function editQuestion(
    messageId: string,
    text: string,
    attachments: ChatAttachment[],
  ) {
    if (busy || temporary || !active.current) return;
    setPhase("thinking");
    setError("");
    try {
      const response = await fetch(
        "/api/chat/conversations/" +
          encodeURIComponent(active.current) +
          "/fork",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ beforeMessageId: messageId }),
        },
      );
      if (!response.ok) throw new Error(await apiError(response));
      const result: unknown = await response.json();
      if (
        !result ||
        typeof result !== "object" ||
        !("participantId" in result) ||
        typeof result.participantId !== "string"
      )
        throw new Error("Cabang percakapan tidak valid.");
      active.current = result.participantId;
      setActiveId(result.participantId);
      await load(result.participantId);
      router.push("/chat?c=" + encodeURIComponent(result.participantId));
      setPhase("idle");
      await send(text, false, attachments);
    } catch (error) {
      setPhase("idle");
      setError(
        error instanceof Error
          ? error.message
          : "Pertanyaan belum dapat diedit.",
      );
    }
  }
  async function feedback(messageId: string, value: "up" | "down" | null) {
    try {
      const response = await fetch(
        "/api/chat/messages/" + encodeURIComponent(messageId) + "/feedback",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: value }),
        },
      );
      if (!response.ok) throw new Error(await apiError(response));
      setMessages((current) =>
        current.map((m) =>
          m.id === messageId ? { ...m, feedback: value } : m,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Penilaian belum tersimpan.",
      );
    }
  }
  return {
    messages,
    title,
    updateTitle: setTitle,
    selected,
    activeId,
    phase,
    busy,
    loadingHistory,
    serverBusy,
    error,
    setError,
    refreshKey,
    depth,
    setDepth: changeDepth,
    hasOlder,
    loadingOlder,
    loadOlder,
    select,
    newChat,
    send,
    stop,
    regenerate,
    editQuestion,
    feedback,
    temporary,
    refresh: () => setRefreshKey((key) => key + 1),
    canRegenerate:
      Boolean(confirmedUserId) ||
      (temporary && messages.some((m) => m.role === "user")),
  };
}

function temporaryContext(messages: ChatMessage[], regenerate: boolean) {
  const end = regenerate
    ? messages.findLastIndex((m) => m.role === "user")
    : messages.length;
  const history = messages
    .slice(0, end)
    .filter(
      (m) =>
        m.content && !["stopped", "error"].includes(m.provenance?.status || ""),
    )
    .slice(-12)
    .map((m) => ({
      role: m.role,
      content: (m.content + attachmentContext(m.attachments)).slice(0, 28000),
    }));
  while (history.reduce((n, m) => n + m.content.length, 0) > 60000)
    history.shift();
  return history;
}
