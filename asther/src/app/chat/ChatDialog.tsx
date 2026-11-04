"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import ChatIcon from "./ChatIcon";
import styles from "./Chat.module.css";
export default function ChatDialog({
  title,
  description,
  drawer = false,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  drawer?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.modal + (drawer ? " " + styles.drawer : "")}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          ref.current?.close();
      }}
    >
      <header className={styles.modalHeader}>
        <div>
          <h2 id={titleId} className={styles.modalTitle}>
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className={styles.modalDescription}>
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Tutup dialog"
          onClick={() => ref.current?.close()}
        >
          <ChatIcon name="close" />
        </button>
      </header>
      <div className={styles.modalBody}>{children}</div>
    </dialog>
  );
}
