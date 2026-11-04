"use client";
import { useState } from "react";
import { reviewFeedback } from "@/app/actions/feedback";
export default function ReviewForm({
  id,
  status,
  resolution,
}: {
  id: string;
  status: string;
  resolution: string | null;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(form: FormData) {
    setBusy(true);
    try {
      const result = await reviewFeedback(form);
      setMessage(result.error || "Tinjauan tersimpan.");
    } catch {
      setMessage("Tinjauan belum tersimpan. Cek akses dan koneksimu.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      action={submit}
      className="mt-4 space-y-3 border-t border-stone-200 pt-4"
    >
      <input type="hidden" name="id" value={id} />
      <label className="block text-sm">
        Status
        <select
          name="status"
          defaultValue={status}
          className="ml-3 rounded-md border border-stone-300 p-2"
        >
          <option value="open">Baru</option>
          <option value="reviewing">Dalam tinjauan</option>
          <option value="resolved">Selesai</option>
        </select>
      </label>
      <label className="block text-sm">
        Catatan pemeriksaan
        <textarea
          name="resolution"
          maxLength={2000}
          defaultValue={resolution || ""}
          rows={3}
          className="mt-1 block w-full rounded-md border border-stone-300 p-2"
        />
      </label>
      <p role="status" className="text-sm">
        {message}
      </p>
      <button
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2 text-sm text-on-primary font-bold disabled:opacity-50"
      >
        {busy ? "Menyimpan..." : "Simpan tinjauan"}
      </button>
    </form>
  );
}
