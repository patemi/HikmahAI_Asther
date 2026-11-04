"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ConversationItem } from "@/lib/chat-contract";
import { apiError } from "./useChat";
import { useConversationList } from "./useConversationList";
import ChatIcon from "./ChatIcon";
import ChatDialog from "./ChatDialog";
import { BrandSymbol } from "@/components/BrandLogo";
import styles from "./Chat.module.css";
function group(item: ConversationItem) {
  if (item.pinned) return "Disematkan";
  const day = (date: Date) =>
    Date.parse(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date) + "T00:00:00Z",
    );
  const age = (day(new Date()) - day(new Date(item.updatedAt))) / 86400000;
  return age === 0
    ? "Hari ini"
    : age === 1
      ? "Kemarin"
      : age < 7
        ? "7 hari terakhir"
        : "Sebelumnya";
}
type Props = {
  open: boolean;
  mobile: boolean;
  activeId: string;
  busy: boolean;
  refreshKey: number;
  user: { name: string | null; email: string; role: "admin" | "user" };
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDeleted: (id: string) => void;
  onRenamed: (id: string, title: string) => void;
  onError: (error: string) => void;
  onSearch: () => void;
  onSettings: (tab?: "general" | "archive") => void;
};
export default function ChatSidebar(props: Props) {
  const [editing, setEditing] = useState<ConversationItem | null>(null);
  const [deleting, setDeleting] = useState<ConversationItem | null>(null);
  const [mutating, setMutating] = useState(false);
  const [formError, setFormError] = useState("");
  const aside = useRef<HTMLElement>(null);
  const { onClose, onError } = props;
  const list = useConversationList("", false, props.refreshKey, onError);
  const mobileOpen = props.open && props.mobile;
  useEffect(() => {
    if (!mobileOpen) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    aside.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const handle = (event: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(
        aside.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, a, summary",
        ) || [],
      ).filter(
        (el) =>
          el.getClientRects().length &&
          el.tabIndex >= 0 &&
          !el.closest("details:not([open]) .rowMenu"),
      );
      const first = elements[0],
        last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", handle);
    return () => {
      window.removeEventListener("keydown", handle);
      requestAnimationFrame(() => previous?.focus());
    };
  }, [mobileOpen, onClose]);
  async function patch(
    item: ConversationItem,
    value: { title?: string; pinned?: boolean; archived?: boolean },
  ) {
    const response = await fetch(
      "/api/chat/conversations/" + encodeURIComponent(item.participantId),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      },
    );
    if (!response.ok) throw new Error(await apiError(response));
    if (value.title) props.onRenamed(item.participantId, value.title);
    if (value.archived) props.onDeleted(item.participantId);
    await list.load();
  }
  async function mutate(
    item: ConversationItem,
    value: { pinned?: boolean; archived?: boolean },
  ) {
    setMutating(true);
    try {
      await patch(item, value);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Percakapan belum dapat diperbarui.",
      );
    } finally {
      setMutating(false);
    }
  }
  async function rename(form: FormData) {
    if (!editing) return;
    setMutating(true);
    setFormError("");
    try {
      await patch(editing, { title: String(form.get("title") || "").trim() });
      setEditing(null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Judul belum dapat diubah.",
      );
    } finally {
      setMutating(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setMutating(true);
    setFormError("");
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: deleting.participantId }),
      });
      if (!response.ok) throw new Error(await apiError(response));
      props.onDeleted(deleting.participantId);
      setDeleting(null);
      await list.load();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Percakapan belum dapat dihapus.",
      );
    } finally {
      setMutating(false);
    }
  }
  const closeMenu = (target: HTMLElement) =>
    target.closest("details")?.removeAttribute("open");
  let previous = "";
  return (
    <aside
      ref={aside}
      id="conversation-sidebar"
      role={mobileOpen ? "dialog" : undefined}
      aria-modal={mobileOpen || undefined}
      aria-label="Percakapan"
      className={
        styles.sidebar + (!props.open ? " " + styles.sidebarClosed : "")
      }
      inert={!props.open}
    >
      <div className={styles.sidebarTop}>
        <div className={styles.sidebarBrand}>
          <button
            type="button"
            className={styles.brandIcon}
            aria-label="Chat baru Hikmah AI"
            onClick={props.onNew}
            disabled={props.busy}
          >
            <BrandSymbol size={28} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Tutup sidebar"
            title="Tutup sidebar"
            onClick={onClose}
          >
            <ChatIcon name="panel" size={21} />
          </button>
        </div>
        <button
          type="button"
          className={styles.navButton}
          disabled={props.busy}
          onClick={props.onNew}
        >
          <ChatIcon name="edit" size={20} />
          Chat baru<span className={styles.shortcut}>Ctrl ⇧ O</span>
        </button>
        <button
          type="button"
          className={styles.navButton}
          onClick={props.onSearch}
        >
          <ChatIcon name="search" size={20} />
          Cari chat<span className={styles.shortcut}>Ctrl K</span>
        </button>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => props.onSettings("archive")}
        >
          <ChatIcon name="archive" size={20} />
          Arsip percakapan
        </button>
      </div>
      <div className={styles.sidebarScroll} aria-busy={list.loading}>
        {list.loading && !list.items.length && (
          <p role="status" className={styles.sidebarEmpty}>
            Memuat percakapan…
          </p>
        )}
        {!list.loading && !list.items.length && (
          <p className={styles.sidebarEmpty}>
            Percakapanmu akan tersimpan di sini.
          </p>
        )}
        {list.items.map((item) => {
          const label = group(item),
            show = previous !== label;
          previous = label;
          return (
            <div key={item.participantId}>
              {show && <h2 className={styles.groupLabel}>{label}</h2>}
              <div
                className={
                  styles.conversation +
                  (item.participantId === props.activeId
                    ? " " + styles.conversationActive
                    : "")
                }
                data-conversation-id={item.participantId}
              >
                <button
                  type="button"
                  className={styles.conversationLink}
                  title={item.title}
                  disabled={props.busy}
                  aria-current={
                    item.participantId === props.activeId ? "page" : undefined
                  }
                  onClick={() => props.onSelect(item.participantId)}
                >
                  {item.title}
                </button>
                <details className={styles.rowActions}>
                  <summary aria-label={"Tindakan percakapan " + item.title}>
                    <ChatIcon name="more" size={18} />
                  </summary>
                  <div className={styles.rowMenu}>
                    <button
                      type="button"
                      disabled={props.busy}
                      onClick={(e) => {
                        closeMenu(e.currentTarget);
                        setFormError("");
                        setEditing(item);
                      }}
                    >
                      <ChatIcon name="edit" size={16} />
                      Ubah judul
                    </button>
                    <button
                      type="button"
                      disabled={props.busy || mutating}
                      onClick={(e) => {
                        closeMenu(e.currentTarget);
                        void mutate(item, { pinned: !item.pinned });
                      }}
                    >
                      <ChatIcon name="pin" size={16} />
                      {item.pinned ? "Lepas sematan" : "Sematkan"}
                    </button>
                    <button
                      type="button"
                      disabled={props.busy || mutating}
                      onClick={(e) => {
                        closeMenu(e.currentTarget);
                        void mutate(item, { archived: true });
                      }}
                    >
                      <ChatIcon name="archive" size={16} />
                      Arsipkan
                    </button>
                    <button
                      type="button"
                      disabled={props.busy}
                      className={styles.danger}
                      onClick={(e) => {
                        closeMenu(e.currentTarget);
                        setFormError("");
                        setDeleting(item);
                      }}
                    >
                      <ChatIcon name="trash" size={16} />
                      Hapus
                    </button>
                  </div>
                </details>
              </div>
            </div>
          );
        })}
        {list.nextPage && (
          <button
            type="button"
            className={styles.textButton}
            disabled={list.loading}
            onClick={() => void list.load(list.nextPage!)}
          >
            {list.loading ? "Memuat…" : "Muat lainnya"}
          </button>
        )}
      </div>
      <footer className={styles.sidebarFooter}>
        <details className={styles.accountMenu}>
          <summary className={styles.account} aria-label="Menu akun">
            <span className={styles.avatar}>
              {(props.user.name || props.user.email).slice(0, 1).toUpperCase()}
            </span>
            <div className={styles.accountInfo}>
              <p className={styles.accountName}>
                {props.user.name || props.user.email}
              </p>
              <p className={styles.accountNote}>Hikmah AI · Personal</p>
            </div>
            <ChatIcon name="more" size={18} />
          </summary>
          <div className={styles.rowMenu}>
            <p className={styles.menuEmail}>{props.user.email}</p>
            <button
              type="button"
              onClick={(e) => {
                closeMenu(e.currentTarget);
                props.onSettings("general");
              }}
            >
              <ChatIcon name="settings" size={18} />
              Pengaturan
            </button>
            <Link href="/privacy">
              <ChatIcon name="book" size={18} />
              Privasi percakapan
            </Link>
            {props.user.role === "admin" && (
              <Link href="/dashboard">
                <ChatIcon name="external" size={18} />
                Dashboard pengelola
              </Link>
            )}
            <button
              type="button"
              disabled={props.busy}
              onClick={async () => {
                try {
                  const response = await fetch("/api/chat-auth/logout", {
                    method: "POST",
                  });
                  if (!response.ok) throw new Error(await apiError(response));
                  window.location.assign("/chat");
                } catch (error) {
                  onError(
                    error instanceof Error
                      ? error.message
                      : "Belum dapat keluar.",
                  );
                }
              }}
            >
              <ChatIcon name="logout" size={18} />
              Keluar
            </button>
          </div>
        </details>
      </footer>
      {editing && (
        <ChatDialog title="Ubah judul" onClose={() => setEditing(null)}>
          <form action={rename}>
            <label className={styles.formLabel}>
              Judul percakapan
              <input
                name="title"
                className={styles.formField}
                defaultValue={editing.title}
                required
                maxLength={120}
              />
            </label>
            {formError && (
              <p role="alert" className={styles.error}>
                {formError}
              </p>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setEditing(null)}
              >
                Batal
              </button>
              <button className={styles.primaryButton} disabled={mutating}>
                {mutating ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </form>
        </ChatDialog>
      )}
      {deleting && (
        <ChatDialog
          title="Hapus chat?"
          description={
            '"' +
            deleting.title +
            '" akan dihapus beserta laporan dan tautan berbaginya. Tindakan ini tidak dapat dibatalkan.'
          }
          onClose={() => setDeleting(null)}
        >
          {formError && (
            <p role="alert" className={styles.error}>
              {formError}
            </p>
          )}
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setDeleting(null)}
            >
              Batal
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              disabled={mutating}
              onClick={() => void remove()}
            >
              {mutating ? "Menghapus…" : "Hapus chat"}
            </button>
          </div>
        </ChatDialog>
      )}
    </aside>
  );
}
