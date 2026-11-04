"use client";
import { useState } from "react";
import { updateConfig } from "@/app/actions/config";
import type { AppConfig } from "@/lib/db/schema";
const field =
  "mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900";
export default function ConfigForm({
  config,
  credentials,
}: {
  config: Omit<AppConfig, "apiKeyHash" | "openaiApiKey" | "geminiApiKey">;
  credentials: { bearer: boolean; openai: boolean; gemini: boolean };
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(form: FormData) {
    setBusy(true);
    setMessage("");
    try {
      const result = await updateConfig(form);
      setMessage(result.error || result.message || "Tersimpan.");
    } catch {
      setMessage("Perubahan belum tersimpan. Periksa koneksi dan hak akses.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form action={save} className="space-y-6">
      {message && (
        <p
          role="status"
          className="border border-stone-200 bg-white p-3 text-sm"
        >
          {message}
        </p>
      )}
      <fieldset className="space-y-4 border border-stone-200 bg-white p-5">
        <legend className="px-2 font-semibold">Identitas dan instruksi</legend>
        <label className="block text-sm">
          Nama asisten
          <input
            name="botName"
            required
            maxLength={100}
            defaultValue={config.botName}
            className={field}
          />
        </label>
        <label className="block text-sm">
          Karakter asisten
          <input
            name="botPersonality"
            maxLength={2000}
            defaultValue={config.botPersonality || ""}
            className={field}
          />
        </label>
        <label className="block text-sm">
          Instruksi sistem
          <textarea
            name="systemPrompt"
            maxLength={16000}
            rows={5}
            defaultValue={config.systemPrompt || ""}
            className={field}
          />
        </label>
      </fieldset>
      <fieldset className="space-y-4 border border-stone-200 bg-white p-5">
        <legend className="px-2 font-semibold">Model dan penyedia</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Model teks
            <input
              name="textModel"
              required
              maxLength={200}
              defaultValue={config.textModel}
              className={field}
            />
          </label>
          <label className="text-sm">
            Model gambar
            <input
              name="imageModel"
              required
              maxLength={200}
              defaultValue={config.imageModel}
              className={field}
            />
          </label>
        </div>
        <label className="block text-sm">
          Model embedding
          <input
            name="embeddingModel"
            required
            maxLength={200}
            defaultValue={config.embeddingModel}
            className={field}
          />
          <span className="text-xs text-stone-500">
            Setelah mengganti model, indeks ulang dokumen. Vektor dari model
            berbeda tidak dicampur.
          </span>
        </label>
        <label className="block text-sm">
          Endpoint penyedia yang kompatibel dengan OpenAI
          <input
            name="baseUrl"
            maxLength={2048}
            defaultValue={config.baseUrl || ""}
            className={field}
            placeholder="https://provider.example/v1"
          />
          <span className="text-xs text-stone-500">
            Kosongkan untuk endpoint bawaan. Pengaturan endpoint deployment
            dapat memiliki prioritas lebih tinggi.
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Kunci OpenAI / penyedia kompatibel
            <span className="ml-2 text-xs text-stone-500">
              {credentials.openai ? "Terkonfigurasi" : "Belum diatur"}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              name="openaiApiKey"
              maxLength={1000}
              className={field}
              placeholder="Isi untuk mengganti; kosong untuk mempertahankan"
            />
          </label>
          <label className="text-sm">
            Kunci Gemini
            <span className="ml-2 text-xs text-stone-500">
              {credentials.gemini ? "Terkonfigurasi" : "Belum diatur"}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              name="geminiApiKey"
              maxLength={1000}
              className={field}
              placeholder="Isi untuk mengganti; kosong untuk mempertahankan"
            />
          </label>
        </div>
        <p className="text-xs text-stone-600">
          Kunci yang tersimpan tidak dikirim kembali ke browser. Variabel
          lingkungan pada deployment tetap berlaku sesuai prioritas penyedia.
        </p>
      </fieldset>
      <fieldset className="space-y-4 border border-stone-200 bg-white p-5">
        <legend className="px-2 font-semibold">
          Sumber dan kualitas jawaban
        </legend>
        <label className="block text-sm">
          <input
            type="checkbox"
            name="ragEnabled"
            value="true"
            defaultChecked={config.ragEnabled}
            className="mr-2"
          />
          Aktifkan pencarian pada dokumen terbit
        </label>
        <label className="block text-sm">
          <input
            type="checkbox"
            name="citationStrict"
            value="true"
            defaultChecked={config.citationStrict}
            className="mr-2"
          />
          Wajibkan rujukan sebelum menjawab
        </label>
        <p className="text-xs leading-relaxed text-stone-600">
          Jika rujukan diwajibkan dan tidak ada sumber yang memenuhi ambang
          pencarian, asisten menyatakan sumber belum memadai. Menyembunyikan
          tampilan referensi di chat tidak mengubah aturan ini.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            Jumlah potongan sumber
            <input
              type="number"
              name="ragTopK"
              min={1}
              max={12}
              required
              defaultValue={config.ragTopK}
              className={field}
            />
          </label>
          <label className="text-sm">
            Ambang kemiripan (%)
            <input
              type="number"
              name="ragMinScore"
              min={10}
              max={100}
              required
              defaultValue={config.ragMinScore}
              className={field}
            />
          </label>
          <label className="text-sm">
            Konteks percakapan (pasang)
            <input
              type="number"
              name="memoryLength"
              min={1}
              max={20}
              required
              defaultValue={config.memoryLength}
              className={field}
            />
          </label>
        </div>
        <label className="block text-sm">
          Kehati-hatian jawaban
          <select
            name="guardrailLevel"
            defaultValue={config.guardrailLevel}
            className={field}
          >
            <option value="standar">Standar</option>
            <option value="ketat">Ketat</option>
          </select>
        </label>
      </fieldset>
      <fieldset className="space-y-3 border border-stone-200 bg-white p-5">
        <legend className="px-2 font-semibold">Akses integrasi API</legend>
        <p className="text-sm text-stone-600">
          {credentials.bearer
            ? "Token API sudah dikonfigurasi."
            : "Token API belum dikonfigurasi."}{" "}
          Token tersimpan sebagai hash dan tidak dapat ditampilkan ulang.
        </p>
        <label className="block text-sm">
          Token pengganti
          <input
            type="password"
            autoComplete="new-password"
            name="newApiKey"
            minLength={32}
            maxLength={72}
            className={field}
            placeholder="Minimal 32 karakter; kosong untuk mempertahankan"
          />
        </label>
        <p className="text-xs text-stone-600">
          Simpan token baru di tempat aman sebelum menyimpan. Integrasi harus
          memakai token pengganti; chat web menggunakan sesi akun.
        </p>
      </fieldset>
      <button
        disabled={busy}
        className="rounded-md bg-primary px-5 py-2 text-sm text-on-primary font-bold disabled:opacity-50"
      >
        {busy ? "Menyimpan..." : "Simpan konfigurasi"}
      </button>
    </form>
  );
}
