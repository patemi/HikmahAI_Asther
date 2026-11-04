"use client";
import { useEffect, useRef, useState } from "react";
import {
  embedPendingBatch,
  getEmbeddingProgress,
} from "@/app/actions/knowledge";

const button =
  "rounded-md border border-stone-300 px-3 py-2 text-sm disabled:opacity-50";
// Waits longer than this mean the daily budget is spent, not a short rate limit.
const MAX_AUTO_WAIT_SECONDS = 120;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Embeds pending chunks in small batches so no single request runs long. */
export default function EmbeddingPanel() {
  const [model, setModel] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [done, setDone] = useState(0);
  const [running, setRunning] = useState(false);
  const [waiting, setWaiting] = useState(0);
  const [message, setMessage] = useState("");
  const runningRef = useRef(false);

  useEffect(() => {
    getEmbeddingProgress()
      .then((progress) => {
        setModel(progress.model);
        setRemaining(progress.remaining);
      })
      .catch(() => setMessage("Status embedding belum dapat dimuat."));
  }, []);

  async function start() {
    runningRef.current = true;
    setRunning(true);
    setMessage("");
    // Voyage embeds a whole batch per request; other providers go one text at a time.
    let size = model.startsWith("voyage-") ? 128 : 16;
    try {
      while (runningRef.current) {
        const result = await embedPendingBatch(size);
        if ("error" in result) {
          const wait = "retryAfter" in result ? (result.retryAfter ?? 0) : 0;
          if (!wait || wait > MAX_AUTO_WAIT_SECONDS) {
            setMessage(result.error ?? "Batch embedding gagal.");
            break;
          }
          size = Math.max(8, Math.floor(size / 2));
          for (let s = wait; s > 0 && runningRef.current; s--) {
            setWaiting(s);
            await sleep(1000);
          }
          setWaiting(0);
          continue;
        }
        setModel(result.model);
        setRemaining((n) => Math.max(0, (n ?? 0) - result.processed));
        setDone((n) => n + result.processed);
        if (!result.hasMore) {
          // Recount: imports may have added chunks while this ran.
          const progress = await getEmbeddingProgress();
          setRemaining(progress.remaining);
          if (progress.remaining && result.processed) continue;
          setMessage(
            progress.remaining
              ? "Tidak ada chunk yang bisa diproses saat ini."
              : "Semua chunk sudah punya embedding.",
          );
          break;
        }
      }
    } catch {
      setMessage("Koneksi terputus. Tekan Lanjutkan untuk meneruskan.");
    } finally {
      runningRef.current = false;
      setRunning(false);
      setWaiting(0);
    }
  }

  if (remaining === null && !message) return null;
  return (
    <section
      aria-label="Embedding"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
    >
      <div className="space-y-0.5">
        <p className="font-medium">
          {remaining === null
            ? "Embedding"
            : remaining
              ? `${remaining.toLocaleString("id-ID")} chunk belum punya embedding`
              : "Semua chunk sudah punya embedding"}
        </p>
        <p className="text-xs text-stone-500">
          Model {model || "-"}
          {done > 0 && ` · ${done.toLocaleString("id-ID")} diproses sesi ini`}
          {waiting > 0 && ` · dibatasi penyedia, lanjut dalam ${waiting} dtk`}
        </p>
        {message && (
          <p role="status" className="text-xs text-stone-700">
            {message}
          </p>
        )}
      </div>
      {running ? (
        <button
          className={button}
          onClick={() => {
            runningRef.current = false;
          }}
        >
          Jeda
        </button>
      ) : (
        <button
          className={button}
          disabled={!remaining}
          onClick={() => void start()}
        >
          {done ? "Lanjutkan" : "Mulai embedding"}
        </button>
      )}
    </section>
  );
}
