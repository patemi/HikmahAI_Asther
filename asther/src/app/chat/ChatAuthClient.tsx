"use client";

import { useState } from "react";

export default function ChatAuthClient({ botName }: { botName: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    const payload = {
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
      name: String(formData.get("name") || "").trim() || undefined,
    };

    const endpoint = mode === "login" ? "/api/chat-auth/login" : "/api/chat-auth/register";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Gagal autentikasi.");
        return;
      }

      window.location.reload();
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#050a08] text-[#e8f0ec] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 sm:p-7">
        <p className="text-[#d4a72d]/75 text-lg text-center font-[family-name:var(--font-playfair)] mb-1">
          بِسْمِ اللَّهِ
        </p>
        <h1 className="text-center text-2xl font-[family-name:var(--font-playfair)] font-bold mb-1">
          {botName}
        </h1>
        <p className="text-center text-sm text-[#6a8d7e] mb-6">
          Masuk atau daftar untuk menyimpan history dan memory percakapan Anda
        </p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-2 rounded-lg text-sm transition-colors ${
              mode === "login"
                ? "bg-[#2dd4a8] text-[#050a08] font-semibold"
                : "bg-white/[0.04] text-[#7a9d8e]"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`py-2 rounded-lg text-sm transition-colors ${
              mode === "register"
                ? "bg-[#2dd4a8] text-[#050a08] font-semibold"
                : "bg-white/[0.04] text-[#7a9d8e]"
            }`}
          >
            Register
          </button>
        </div>

        <form action={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <input
              name="name"
              placeholder="Nama panggilan"
              className="w-full rounded-xl bg-[#0d1f18] border border-[#2dd4a8]/15 px-3 py-2.5 text-sm placeholder-[#3a5a48] focus:outline-none focus:border-[#2dd4a8]/30"
            />
          )}

          <input
            name="email"
            type="text"
            required
            placeholder="Username / email"
            className="w-full rounded-xl bg-[#0d1f18] border border-[#2dd4a8]/15 px-3 py-2.5 text-sm placeholder-[#3a5a48] focus:outline-none focus:border-[#2dd4a8]/30"
          />

          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-xl bg-[#0d1f18] border border-[#2dd4a8]/15 px-3 py-2.5 text-sm placeholder-[#3a5a48] focus:outline-none focus:border-[#2dd4a8]/30"
          />

          {error && (
            <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 rounded-xl bg-[#2dd4a8] text-[#050a08] py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>
      </div>
    </div>
  );
}
