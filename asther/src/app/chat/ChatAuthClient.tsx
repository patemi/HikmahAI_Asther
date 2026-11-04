"use client";
import { useState } from "react";
import Link from "next/link";
import { useChatTheme } from "./useChatTheme";
import ChatIcon from "./ChatIcon";
import { BrandSymbol, Wordmark } from "@/components/BrandLogo";
import styles from "./Chat.module.css";
export default function ChatAuthClient({ botName }: { botName: string }) {
  const { dark, toggle } = useChatTheme();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/chat-auth/" + mode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") || "").trim(),
          password: String(form.get("password") || ""),
          ...(mode === "register"
            ? { name: String(form.get("name") || "").trim() || undefined }
            : {}),
        }),
      });
      const data: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Belum dapat masuk. Silakan coba kembali.",
        );
      window.location.assign("/chat");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Cek koneksimu lalu coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.workspace} data-theme={dark ? "dark" : "light"}>
      <main className={styles.auth}>
        <section className={styles.authStory}>
          <Link href="/" className={styles.brand} aria-label={botName}>
            <BrandSymbol tone="malam" size={34} />
            <Wordmark tone="malam" className={styles.brandText} />
          </Link>
          <div className={styles.authStoryContent}>
            <p className={styles.eyebrow}>Teman belajar Islam</p>
            <h1>
              Tanya apa aja
              <br />
              soal Islam.
            </h1>
            <p>
              Jawabannya ada dalilnya. Mulai dari pertanyaan yang ada di
              pikiranmu, lanjutkan dengan pertanyaan susulan, lalu cek
              rujukannya satu per satu.
            </p>
            <div className={styles.authFeatures}>
              <div>
                <ChatIcon name="book" size={17} />
                Setiap jawaban menyebutkan sumbernya
              </div>
              <div>
                <ChatIcon name="history" size={17} />
                Percakapan tersimpan, bisa dilanjutkan kapan saja
              </div>
              <div>
                <ChatIcon name="search" size={17} />
                Fokus pada Hukum, Sejarah, dan Pengetahuan Umum Islam
              </div>
            </div>
          </div>
          <p className={styles.brandNote}>
            Kalem, cerdas, hangat, berdalil.
          </p>
        </section>
        <section className={styles.authFormSide}>
          <div className={styles.authTools}>
            <button
              type="button"
              onClick={toggle}
              className={styles.iconButton}
              aria-label={dark ? "Gunakan tema terang" : "Gunakan tema gelap"}
            >
              <ChatIcon name={dark ? "sun" : "moon"} />
            </button>
          </div>
          <div className={styles.authForm}>
            <h2>
              {mode === "login"
                ? "Selamat datang lagi."
                : "Buat akun dulu, yuk."}
            </h2>
            <p>
              {mode === "login"
                ? "Masuk untuk lanjut belajar."
                : "Akunmu menyimpan percakapan dan rujukannya."}
            </p>
            <form action={submit} key={mode}>
              {mode === "register" && (
                <label className={styles.formLabel} htmlFor="auth-name">
                  Nama panggilan
                  <input
                    id="auth-name"
                    name="name"
                    maxLength={100}
                    autoComplete="nickname"
                    className={styles.formField}
                    placeholder="Nama panggilanmu"
                  />
                </label>
              )}
              <label className={styles.formLabel} htmlFor="auth-email">
                {mode === "register" ? "Email" : "Email atau username"}
                <input
                  id="auth-email"
                  name="email"
                  type={mode === "register" ? "email" : "text"}
                  required
                  maxLength={254}
                  autoComplete="username"
                  className={styles.formField}
                  placeholder="nama@contoh.com"
                />
              </label>
              <label className={styles.formLabel} htmlFor="auth-password">
                Password
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  required
                  minLength={mode === "register" ? 8 : 1}
                  maxLength={72}
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  className={styles.formField}
                  placeholder={
                    mode === "register"
                      ? "Minimal 8 karakter"
                      : "Masukkan password"
                  }
                />
              </label>
              {error && (
                <p role="alert" className={styles.error}>
                  {error}
                </p>
              )}
              <button disabled={busy} className={styles.primaryButton}>
                {busy
                  ? "Memproses..."
                  : mode === "login"
                    ? "Masuk"
                    : "Buat akun"}
              </button>
            </form>
            <div className={styles.authMode}>
              {mode === "login"
                ? "Belum punya akun?"
                : "Sudah punya akun?"}
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                }}
              >
                {mode === "login" ? "Daftar" : "Masuk"}
              </button>
            </div>
            <p className={styles.authPrivacy}>
              Percakapan diproses oleh penyedia AI dan dapat ditinjau pengelola.
              Pelajari <a href="/privacy">privasi percakapan</a> sebelum
              menggunakan Hikmah AI.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
