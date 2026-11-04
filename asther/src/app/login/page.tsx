"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import BrandLogo, { BrandSymbol, Wordmark } from "@/components/BrandLogo";

const inputClass =
  "w-full rounded-2xl border border-stone-900/15 bg-white px-4 py-3 text-stone-900 placeholder-stone-400 caret-primary transition-shadow focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    try {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    } catch {
      setError("Layanan masuk belum tersedia. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh gap-3 bg-stone-50 p-3 lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden rounded-[36px] bg-hijau-900 p-12 text-kertas lg:flex">
        <div
          aria-hidden
          className="drift-slow pointer-events-none absolute -top-28 -right-28 size-96 rounded-full bg-[radial-gradient(circle,rgba(197,236,79,0.22),transparent_65%)]"
        />
        <span className="relative inline-flex items-center gap-3">
          <BrandSymbol tone="malam" size={36} />
          <Wordmark tone="malam" className="text-3xl" />
        </span>
        <div className="stagger-in relative flex flex-col gap-5">
          <span className="label-caps w-fit rounded-full bg-pucuk px-3 py-1.5 text-hijau-900">
            Ruang pengelola
          </span>
          <p className="font-display max-w-[14ch] text-6xl leading-[0.9]">
            Rujukan yang rapi, jawaban yang jujur.
          </p>
          <p className="max-w-md text-[15px] leading-relaxed text-[#A6CDB5]">
            Tinjau sumber, atur perilaku bot, dan ukur mutu jawaban sebelum
            sampai ke pengguna.
          </p>
        </div>
        <span className="relative text-sm text-[#A6CDB5]">© 2026 Hikmah AI</span>
      </aside>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="stagger-in w-full max-w-sm">
          <Link href="/" className="mb-10 inline-block lg:hidden">
            <BrandLogo size={30} wordmarkClassName="text-2xl" />
          </Link>
          <h1 className="font-display text-4xl leading-none text-stone-900">
            Masuk
          </h1>
          <p className="mt-3 mb-8 text-stone-600">
            Dashboard pengelola Hikmah AI.
          </p>

          <form action={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="rounded-2xl bg-red-50 p-3.5 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-semibold text-stone-700"
              >
                Username
              </label>
              <input
                type="text"
                id="email"
                name="email"
                required
                autoComplete="username"
                suppressHydrationWarning
                className={inputClass}
                placeholder="Username pengelola"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-stone-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autoComplete="current-password"
                suppressHydrationWarning
                className={inputClass}
                placeholder="Password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="press flex w-full items-center justify-between rounded-full bg-primary px-6 py-3.5 font-extrabold text-on-primary hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Memproses…" : "Masuk"}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="square"
                aria-hidden
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
