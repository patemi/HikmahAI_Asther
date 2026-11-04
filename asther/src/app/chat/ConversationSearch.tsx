"use client";
import { useState } from "react";
import ChatDialog from "./ChatDialog";
import ChatIcon from "./ChatIcon";
import { useConversationList } from "./useConversationList";
import styles from "./Chat.module.css";
export default function ConversationSearch({
  onClose,
  onSelect,
  busy,
}: {
  onClose: () => void;
  onSelect: (id: string) => void;
  busy: boolean;
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const list = useConversationList(query, false, 0, setError);
  return (
    <ChatDialog title="Cari percakapan" onClose={onClose}>
      <div className={styles.searchField}>
        <ChatIcon name="search" size={20} />
        <input
          autoFocus
          aria-label="Cari percakapan"
          placeholder="Cari judul atau isi percakapan"
          maxLength={120}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError("");
          }}
        />
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.searchResults} aria-busy={list.loading}>
        {!list.loading && !list.items.length && (
          <p className={styles.emptyNote}>
            {query
              ? "Tidak ada percakapan yang cocok."
              : "Percakapanmu akan muncul di sini."}
          </p>
        )}
        {list.loading && !list.items.length && (
          <p role="status" className={styles.emptyNote}>
            Mencari percakapan…
          </p>
        )}
        {list.items.map((item) => (
          <button
            key={item.participantId}
            className={styles.searchResult}
            type="button"
            disabled={busy}
            onClick={() => {
              onSelect(item.participantId);
              onClose();
            }}
          >
            <ChatIcon name="chat" size={19} />
            <div>
              <strong>{item.title}</strong>
              <p>{item.preview}</p>
            </div>
          </button>
        ))}
        {list.nextPage && (
          <button
            type="button"
            disabled={list.loading}
            className={styles.textButton}
            onClick={() => void list.load(list.nextPage!)}
          >
            Muat lainnya
          </button>
        )}
      </div>
    </ChatDialog>
  );
}
