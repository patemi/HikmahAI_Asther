"use client";
import { useState } from "react";
import type { ResponseDepth } from "@/lib/chat-contract";
import ChatDialog from "./ChatDialog";
import ChatIcon from "./ChatIcon";
import { useConversationList } from "./useConversationList";
import { apiError } from "./useChat";
import styles from "./Chat.module.css";
export default function ChatSettings({
  initialTab,
  dark,
  onTheme,
  depth,
  onDepth,
  onClose,
  user,
  onSelect,
  onRefresh,
  busy,
}: {
  initialTab: "general" | "archive";
  dark: boolean;
  onTheme: () => void;
  depth: ResponseDepth;
  onDepth: (depth: ResponseDepth) => void;
  onClose: () => void;
  user: { name: string | null; email: string };
  onSelect: (id: string) => void;
  onRefresh: () => void;
  busy: boolean;
}) {
  const [tab, setTab] = useState<"general" | "archive" | "data">(initialTab);
  return (
    <ChatDialog title="Pengaturan" onClose={onClose}>
      <div
        className={styles.settingsTabs}
        role="tablist"
        aria-label="Bagian pengaturan"
        onKeyDown={(event) => {
          if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const tabs = ["general", "archive", "data"] as const;
          const index = tabs.indexOf(tab);
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? 2
                : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
          setTab(tabs[next]);
          document.getElementById("settings-tab-" + tabs[next])?.focus();
        }}
      >
        {(
          [
            { id: "general", text: "Umum" },
            { id: "archive", text: "Arsip" },
            { id: "data", text: "Data & privasi" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={"settings-tab-" + item.id}
            aria-controls="settings-panel"
            aria-selected={tab === item.id}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
          >
            {item.text}
          </button>
        ))}
      </div>
      <div
        id="settings-panel"
        role="tabpanel"
        aria-labelledby={"settings-tab-" + tab}
      >
        {tab === "general" && (
          <>
            <div className={styles.settingRow}>
              <label htmlFor="settings-theme">Tampilan</label>
              <select
                id="settings-theme"
                className={styles.compactSelect}
                value={dark ? "dark" : "light"}
                onChange={(event) => {
                  if ((event.target.value === "dark") !== dark) onTheme();
                }}
              >
                <option value="light">Terang</option>
                <option value="dark">Gelap</option>
              </select>
            </div>
            <div className={styles.settingRow}>
              <label htmlFor="settings-depth">Kedalaman jawaban</label>
              <select
                id="settings-depth"
                className={styles.compactSelect}
                value={depth}
                onChange={(event) =>
                  onDepth(event.target.value as ResponseDepth)
                }
              >
                <option value="ringkas">Ringkas</option>
                <option value="standar">Seimbang</option>
                <option value="mendalam">Mendalam</option>
              </select>
            </div>
            <p className={styles.messageNote}>
              Preferensi tampilan dan kedalaman disimpan pada browser ini.
            </p>
            <h3 className={styles.sectionHeading}>Pintasan keyboard</h3>
            <div className={styles.settingRow}>
              <span>Chat baru</span>
              <kbd>Ctrl / ⌘ ⇧ O</kbd>
            </div>
            <div className={styles.settingRow}>
              <span>Cari percakapan</span>
              <kbd>Ctrl / ⌘ K</kbd>
            </div>
            <div className={styles.settingRow}>
              <span>Baris baru</span>
              <kbd>Shift Enter</kbd>
            </div>
          </>
        )}
        {tab === "archive" && (
          <ArchivedChats
            onSelect={(id) => {
              onSelect(id);
              onClose();
            }}
            onRefresh={onRefresh}
            busy={busy}
          />
        )}
        {tab === "data" && (
          <>
            <div className={styles.settingRow}>
              <span>Akun</span>
              <span className={styles.settingsEmail}>{user.email}</span>
            </div>
            <h3 className={styles.sectionHeading}>Kendali percakapanmu</h3>
            <p className={styles.settingsCopy}>
              Gunakan chat sementara untuk percakapan yang tidak disimpan di
              riwayat Hikmah AI. Pesan tetap dikirim ke penyedia AI untuk
              menghasilkan jawaban.
            </p>
            <p className={styles.settingsCopy}>
              Ekspor chat dari menu di kanan atas percakapan. Tautan berbagi
              bersifat publik bagi siapa pun yang memilikinya dan dapat dicabut
              dari dialog Bagikan.
            </p>
            <p className={styles.settingsCopy}>
              Berkas teks menjadi bagian dari pesan tersimpan. Dikte dan
              pembacaan suara menggunakan layanan browser atau perangkatmu.
            </p>
            <a
              className={styles.textButton}
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ChatIcon name="external" size={16} />
              Baca kebijakan privasi
            </a>
          </>
        )}
      </div>
    </ChatDialog>
  );
}
function ArchivedChats({
  onSelect,
  onRefresh,
  busy,
}: {
  onSelect: (id: string) => void;
  onRefresh: () => void;
  busy: boolean;
}) {
  const [error, setError] = useState("");
  const [mutating, setMutating] = useState<string | null>(null);
  const list = useConversationList("", true, 0, setError);
  async function restore(id: string) {
    setMutating(id);
    setError("");
    try {
      const response = await fetch(
        "/api/chat/conversations/" + encodeURIComponent(id),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: false }),
        },
      );
      if (!response.ok) throw new Error(await apiError(response));
      await list.load();
      onRefresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Percakapan belum dapat dipulihkan.",
      );
    } finally {
      setMutating(null);
    }
  }
  return (
    <div className={styles.archiveList}>
      <p className={styles.messageNote}>
        Chat yang diarsipkan tetap tersimpan dan dapat dipulihkan kapan saja.
      </p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {list.loading && !list.items.length && (
        <p role="status" className={styles.emptyNote}>
          Memuat arsip…
        </p>
      )}
      {!list.loading && !list.items.length && (
        <p className={styles.emptyNote}>
          Belum ada percakapan yang diarsipkan.
        </p>
      )}
      {list.items.map((item) => (
        <div key={item.participantId} className={styles.archiveRow}>
          <button
            type="button"
            className={styles.archiveTitle}
            disabled={busy}
            onClick={() => onSelect(item.participantId)}
          >
            {item.title}
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={"Pulihkan " + item.title}
            title="Pulihkan chat"
            disabled={busy || Boolean(mutating)}
            onClick={() => void restore(item.participantId)}
          >
            <ChatIcon
              name={mutating === item.participantId ? "history" : "restore"}
              size={18}
            />
          </button>
        </div>
      ))}
      {list.nextPage && (
        <button
          type="button"
          className={styles.textButton}
          disabled={list.loading}
          onClick={() => void list.load(list.nextPage!)}
        >
          Muat lainnya
        </button>
      )}
    </div>
  );
}
