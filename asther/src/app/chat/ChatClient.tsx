"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useChat, apiError } from "./useChat";
import { useChatTheme } from "./useChatTheme";
import { useChatSpeech } from "./useChatSpeech";
import ChatSidebar from "./ChatSidebar";
import ChatComposer from "./ChatComposer";
import ChatMessageRow from "./ChatMessageRow";
import ConversationSearch from "./ConversationSearch";
import ChatSettings from "./ChatSettings";
import ShareDialog from "./ShareDialog";
import ChatIcon from "./ChatIcon";
import SourceDialog from "./SourceDialog";
import ReportAnswer from "@/components/ReportAnswer";
import type { Citation } from "@/lib/citations";
import { Wordmark } from "@/components/BrandLogo";
import styles from "./Chat.module.css";

const modes = [
  {
    id: "ringkas",
    name: "Ringkas",
    description: "Jawaban singkat dan langsung",
  },
  {
    id: "standar",
    name: "Seimbang",
    description: "Penjelasan dengan konteks secukupnya",
  },
  {
    id: "mendalam",
    name: "Mendalam",
    description: "Pembahasan lebih rinci dan bernuansa",
  },
] as const;
// Topic chips from the brand guideline; each pre-fills a sample question.
const starters = [
  { label: "Fikih", question: "Boleh nggak jamak salat pas lagi kuliah lapangan?" },
  { label: "Sirah", question: "Kenapa hijrah ke Madinah jadi awal kalender Hijriah?" },
  { label: "Tafsir", question: "Apa makna sabar dalam Al-Qur'an?" },
  { label: "Hadis", question: "Apa maksud hadis tentang niat, innamal a'malu binniyat?" },
  { label: "Akhlak", question: "Bagaimana menjaga adab ketika berbeda pendapat?" },
  { label: "Muamalah", question: "Paylater itu riba nggak?" },
] as const;
function subscribeDesktop(callback: () => void) {
  const media = window.matchMedia("(min-width: 768px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export default function ChatClient({
  botName,
  user,
}: {
  botName: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: "admin" | "user";
  };
}) {
  const chat = useChat(user.name || user.email.split("@")[0]);
  const { busy, newChat } = chat;
  const { dark, toggle } = useChatTheme();
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia("(min-width: 768px)").matches,
    () => true,
  );
  const [sidebarMode, setSidebarMode] = useState<"auto" | "open" | "closed">(
    "auto",
  );
  const sidebarOpen = sidebarMode === "auto" ? desktop : sidebarMode === "open";
  const closeSidebar = useCallback(() => setSidebarMode("closed"), []);
  const [input, setInput] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "archive" | null>(
    null,
  );
  const [sharing, setSharing] = useState(false);
  const [sources, setSources] = useState<Citation[] | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [exporting, setExporting] = useState(false);
  const composer = useRef<HTMLTextAreaElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const scrollConversation = useRef("");
  const olderAnchor = useRef<{ height: number; top: number } | null>(null);
  const speech = useChatSpeech(
    (text) =>
      setInput((value) =>
        (value + (value.trim() ? " " : "") + text).slice(0, 8000),
      ),
    chat.setError,
  );
  const lastAssistant = chat.messages.findLast((m) => m.role === "assistant");
  const pending = chat.phase !== "idle";
  const empty = !chat.messages.length && !chat.loadingHistory;
  const openSearch = useCallback(() => {
    setSearchOpen(true);
    if (!desktop) setSidebarMode("closed");
  }, [desktop]);
  useLayoutEffect(() => {
    const element = scroll.current;
    if (!element) return;
    if (scrollConversation.current !== chat.activeId) {
      stick.current = true;
      olderAnchor.current = null;
      scrollConversation.current = chat.activeId;
    }
    if (olderAnchor.current) {
      const anchor = olderAnchor.current;
      element.scrollTop = anchor.top + element.scrollHeight - anchor.height;
      olderAnchor.current = null;
    } else if (stick.current) element.scrollTop = element.scrollHeight;
  }, [chat.messages, chat.activeId]);
  useEffect(() => {
    document.title =
      (chat.messages.length ? chat.title + " — " : "") + "Hikmah AI";
  }, [chat.title, chat.messages.length]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) return;
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "o"
      ) {
        event.preventDefault();
        if (!busy) {
          newChat();
          setInput("");
          composer.current?.focus();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
      if (event.key === "Escape")
        document
          .querySelectorAll<HTMLDetailsElement>("details[open]")
          .forEach((details) => {
            details.open = false;
            details.querySelector<HTMLElement>("summary")?.focus();
          });
    };
    const dismiss = (event: MouseEvent) =>
      document
        .querySelectorAll<HTMLDetailsElement>("details[open]")
        .forEach((details) => {
          if (event.target instanceof Node && !details.contains(event.target))
            details.open = false;
        });
    window.addEventListener("keydown", key);
    document.addEventListener("click", dismiss);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("click", dismiss);
    };
  }, [busy, newChat, openSearch]);
  function startNew(temporary = false) {
    speech.stopDictation();
    speech.stopReading();
    chat.newChat(temporary);
    setInput("");
    stick.current = true;
    if (!desktop) closeSidebar();
    composer.current?.focus();
  }
  function select(id: string) {
    speech.stopDictation();
    speech.stopReading();
    chat.select(id);
    setInput("");
    stick.current = true;
    if (!desktop) closeSidebar();
  }
  function prefill(text: string) {
    setInput(text);
    composer.current?.focus();
  }
  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
    } catch {
      chat.setError(
        "Teks belum dapat disalin otomatis. Pilih teks untuk menyalinnya.",
      );
    }
  }
  async function exportChat() {
    if (!chat.activeId || chat.temporary) return;
    setExporting(true);
    try {
      const response = await fetch(
        "/api/chat/conversations/" +
          encodeURIComponent(chat.activeId) +
          "/export",
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error(await apiError(response));
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "hikmah-percakapan.md";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      chat.setError(
        error instanceof Error
          ? error.message
          : "Percakapan belum dapat diekspor.",
      );
    } finally {
      setExporting(false);
    }
  }
  const composerElement = (
    <ChatComposer
      key={(chat.activeId || "new") + chat.temporary}
      value={input}
      onChange={setInput}
      textareaRef={composer}
      onSend={async (text, files) => {
        speech.stopReading();
        stick.current = true;
        await chat.send(text, false, files);
      }}
      busy={pending}
      stopping={chat.phase === "stopping"}
      loading={chat.loadingHistory || chat.serverBusy}
      onStop={chat.stop}
      listening={speech.listening}
      canDictate={speech.canDictate}
      onDictate={speech.dictate}
      onError={chat.setError}
      temporary={chat.temporary}
    />
  );
  const errorElement = chat.error && (
    <div role="alert" className={styles.errorBanner}>
      <div>
        {chat.error}
        {chat.canRegenerate && !chat.busy && (
          <button
            type="button"
            className={styles.textButton}
            onClick={() => void chat.regenerate()}
          >
            Coba buat ulang
          </button>
        )}
      </div>
      <button
        type="button"
        className={styles.iconButton}
        aria-label="Tutup pemberitahuan"
        onClick={() => chat.setError("")}
      >
        <ChatIcon name="close" size={16} />
      </button>
    </div>
  );
  return (
    <div className={styles.workspace} data-theme={dark ? "dark" : "light"}>
      <ChatSidebar
        open={sidebarOpen}
        mobile={!desktop}
        activeId={chat.temporary ? "" : chat.activeId}
        busy={chat.busy}
        refreshKey={chat.refreshKey}
        user={user}
        onClose={closeSidebar}
        onNew={() => startNew()}
        onSelect={select}
        onDeleted={(id) => {
          if (id === chat.activeId) startNew();
        }}
        onRenamed={(id, title) => {
          if (id === chat.activeId) chat.updateTitle(title);
        }}
        onError={chat.setError}
        onSearch={openSearch}
        onSettings={(tab) => {
          setSettingsTab(tab || "general");
          if (!desktop) closeSidebar();
        }}
      />
      {sidebarOpen && !desktop && (
        <button
          type="button"
          className={styles.mobileBackdrop}
          aria-label="Tutup daftar percakapan"
          onClick={closeSidebar}
        />
      )}
      <main className={styles.main} inert={sidebarOpen && !desktop}>
        <header className={styles.header}>
          <div className={styles.headerStart}>
            {!sidebarOpen && (
              <>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label="Buka sidebar"
                  aria-expanded={sidebarOpen}
                  aria-controls="conversation-sidebar"
                  onClick={() => setSidebarMode("open")}
                >
                  <ChatIcon name="panel" size={21} />
                </button>
                <button
                  type="button"
                  className={styles.iconButton + " " + styles.headerNew}
                  aria-label="Chat baru"
                  title="Chat baru"
                  disabled={busy}
                  onClick={() => startNew()}
                >
                  <ChatIcon name="edit" size={21} />
                </button>
              </>
            )}
            <details className={styles.modelMenu}>
              <summary className={styles.headerBrand}>
                {/^hikmah\s?ai$/i.test(botName) ? <Wordmark /> : botName}
                <ChatIcon name="down" size={15} />
              </summary>
              <div className={styles.rowMenu}>
                <p className={styles.menuLabel}>Gaya jawaban</p>
                {modes.map((mode) => (
                  <button
                    type="button"
                    key={mode.id}
                    disabled={chat.busy}
                    aria-pressed={chat.depth === mode.id}
                    onClick={(event) => {
                      chat.setDepth(mode.id);
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");
                    }}
                  >
                    <div>
                      <strong>{mode.name}</strong>
                      <span>{mode.description}</span>
                    </div>
                    {chat.depth === mode.id && (
                      <ChatIcon name="check" size={17} />
                    )}
                  </button>
                ))}
                <p className={styles.menuNote}>
                  Asisten khusus keislaman dengan rujukan.
                </p>
              </div>
            </details>
            {chat.depth !== "standar" && (
              <span className={styles.modeLabel}>
                {modes.find((m) => m.id === chat.depth)?.name}
              </span>
            )}
          </div>
          <div className={styles.headerEnd}>
            {(empty || chat.temporary) && (
              <button
                type="button"
                className={styles.temporaryButton}
                aria-pressed={chat.temporary}
                disabled={chat.busy}
                title="Chat sementara tidak disimpan di riwayat"
                onClick={() => startNew(!chat.temporary)}
              >
                <ChatIcon name="temporary" size={20} />
                <span>Sementara</span>
              </button>
            )}
            {!empty && !chat.temporary && (
              <>
                <button
                  type="button"
                  className={styles.shareButton}
                  disabled={chat.busy || chat.loadingHistory}
                  onClick={() => setSharing(true)}
                >
                  <ChatIcon name="share" size={18} />
                  <span>Bagikan</span>
                </button>
                <details className={styles.headerMore}>
                  <summary aria-label="Menu percakapan">
                    <ChatIcon name="more" size={21} />
                  </summary>
                  <div className={styles.rowMenu}>
                    <button
                      type="button"
                      disabled={exporting}
                      onClick={(event) => {
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                        void exportChat();
                      }}
                    >
                      <ChatIcon name="download" size={18} />
                      {exporting ? "Menyiapkan ekspor…" : "Ekspor percakapan"}
                    </button>
                    <button
                      type="button"
                      disabled={chat.busy}
                      onClick={(event) => {
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                        startNew(true);
                      }}
                    >
                      <ChatIcon name="temporary" size={18} />
                      Chat sementara baru
                    </button>
                  </div>
                </details>
              </>
            )}
          </div>
        </header>
        <div
          className={
            styles.contentRegion + (empty ? " " + styles.emptyRegion : "")
          }
        >
          {empty ? (
            <div className={styles.welcome}>
              {!chat.temporary && (
                <p className={styles.greeting}>
                  Assalamu&apos;alaikum
                  {user.name ? ", " + user.name.split(" ")[0] : ""}.
                </p>
              )}
              <h1>
                {chat.temporary ? "Chat sementara" : "Mau tanya apa hari ini?"}
              </h1>
              {chat.temporary && (
                <p className={styles.temporaryCopy}>
                  Percakapan ini tidak disimpan di riwayat Hikmah AI.
                  <br />
                  Pesan tetap diproses oleh penyedia AI.
                </p>
              )}
              {errorElement}
              {composerElement}
              {!chat.temporary && (
                <div className={styles.suggestions}>
                  {starters.map((starter) => (
                    <button
                      key={starter.label}
                      type="button"
                      onClick={() => prefill(starter.question)}
                    >
                      {starter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div
                ref={scroll}
                className={styles.scroll}
                onScroll={(event) => {
                  const el = event.currentTarget;
                  const distance =
                    el.scrollHeight - el.scrollTop - el.clientHeight;
                  stick.current = distance < 100;
                  setShowScrollDown(distance > 260);
                }}
              >
                <section
                  className={styles.messages}
                  aria-label="Riwayat percakapan"
                >
                  {chat.loadingHistory && (
                    <p role="status" className={styles.emptyNote}>
                      Memuat percakapan…
                    </p>
                  )}
                  {chat.hasOlder && (
                    <button
                      type="button"
                      className={styles.loadOlder}
                      disabled={chat.loadingOlder || chat.busy}
                      onClick={() => {
                        const el = scroll.current;
                        if (el) {
                          olderAnchor.current = {
                            top: el.scrollTop,
                            height: el.scrollHeight,
                          };
                          stick.current = false;
                        }
                        void chat.loadOlder().then((success) => {
                          if (!success) olderAnchor.current = null;
                        });
                      }}
                    >
                      <ChatIcon name="history" size={16} />
                      {chat.loadingOlder ? "Memuat…" : "Muat pesan sebelumnya"}
                    </button>
                  )}
                  {chat.messages.map((message) => (
                    <ChatMessageRow
                      key={message.id}
                      message={message}
                      pending={pending && message.id === lastAssistant?.id}
                      busy={chat.busy}
                      temporary={chat.temporary}
                      canRegenerate={chat.canRegenerate}
                      last={message.id === lastAssistant?.id}
                      copied={copied === message.id}
                      onCopy={() => void copy(message.id, message.content)}
                      onSources={() => setSources(message.citations)}
                      onReport={() => setReportId(message.id)}
                      onRegenerate={() => void chat.regenerate()}
                      reading={speech.reading === message.id}
                      onRead={() => speech.read(message.id, message.content)}
                      onFeedback={(value) =>
                        void chat.feedback(message.id, value)
                      }
                      onEdit={async (text, attachments) => {
                        stick.current = true;
                        await chat.editQuestion(message.id, text, attachments);
                      }}
                    />
                  ))}
                </section>
              </div>
              <div className={styles.composerWrap}>
                {showScrollDown && (
                  <button
                    type="button"
                    className={styles.scrollDown}
                    aria-label="Ke pesan terbaru"
                    onClick={() => {
                      stick.current = true;
                      scroll.current?.scrollTo({
                        top: scroll.current.scrollHeight,
                        behavior: "smooth",
                      });
                    }}
                  >
                    <ChatIcon name="down" size={19} />
                  </button>
                )}
                <div className={styles.composerArea}>
                  {errorElement}
                  {chat.serverBusy && !pending && (
                    <p role="status" className={styles.messageNote}>
                      Jawaban sedang diproses. Percakapan diperbarui otomatis.
                    </p>
                  )}
                  {composerElement}
                </div>
              </div>
            </>
          )}
        </div>
        <p className={styles.disclaimer}>
          Hikmah AI dapat keliru. Periksa rujukan untuk penetapan hukum.{" "}
          <a href="/privacy">Privasi</a>
        </p>
      </main>
      {searchOpen && (
        <ConversationSearch
          onClose={() => setSearchOpen(false)}
          onSelect={select}
          busy={chat.busy}
        />
      )}
      {settingsTab && (
        <ChatSettings
          initialTab={settingsTab}
          dark={dark}
          onTheme={toggle}
          depth={chat.depth}
          onDepth={chat.setDepth}
          onClose={() => setSettingsTab(null)}
          user={user}
          onSelect={select}
          onRefresh={chat.refresh}
          busy={chat.busy}
        />
      )}
      {sharing && (
        <ShareDialog
          participantId={chat.activeId}
          onClose={() => setSharing(false)}
        />
      )}
      {sources && (
        <SourceDialog sources={sources} onClose={() => setSources(null)} />
      )}
      {reportId && (
        <ReportAnswer messageId={reportId} onClose={() => setReportId(null)} />
      )}
      <span role="status" aria-live="polite" className={styles.srOnly}>
        {chat.phase === "thinking"
          ? "Hikmah AI sedang menyiapkan jawaban."
          : chat.phase === "streaming"
            ? "Hikmah AI sedang menjawab."
            : chat.phase === "stopping"
              ? "Respons sedang dihentikan."
              : ""}
      </span>
    </div>
  );
}
