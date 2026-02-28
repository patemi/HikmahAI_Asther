import Link from "next/link";
import AnimateOnScroll from "@/components/AnimateOnScroll";

/* ─────────────────────────────────────────────────────────────
   SVG helpers
───────────────────────────────────────────────────────────── */

/** 8-pointed star / Rub el Hizb geometric ornament */
function IslamicStar({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" strokeWidth="0.6" fill="none">
        <polygon points="100,10 118,82 190,82 132,126 150,198 100,154 50,198 68,126 10,82 82,82" />
        <polygon points="100,30 114,82 170,82 126,114 140,170 100,142 60,170 74,114 30,82 86,82" />
        <circle cx="100" cy="100" r="62" />
        <circle cx="100" cy="100" r="42" />
        <circle cx="100" cy="100" r="22" />
        <line x1="100" y1="10" x2="100" y2="190" />
        <line x1="10" y1="100" x2="190" y2="100" />
        <line x1="29" y1="29" x2="171" y2="171" />
        <line x1="171" y1="29" x2="29" y2="171" />
      </g>
    </svg>
  );
}

/** Small corner arabesque diamond */
function DiamondOrn({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" strokeWidth="0.8">
        <polygon points="20,2 38,20 20,38 2,20" />
        <polygon points="20,8 32,20 20,32 8,20" />
        <circle cx="20" cy="20" r="5" />
        <line x1="20" y1="2" x2="20" y2="38" />
        <line x1="2" y1="20" x2="38" y2="20" />
      </g>
    </svg>
  );
}

/** Crescent & star logo icon */
function CrescentIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c1.292 0 2.526-.245 3.66-.69A8 8 0 0 1 8 12a8 8 0 0 1 7.66-9.31A10.052 10.052 0 0 0 12 2z" />
      <circle cx="18" cy="6" r="1.5" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────────── */

const features = [
  {
    num: "01",
    title: "Kajian Islam Cerdas",
    description:
      "AI yang memahami konteks percakapan dengan pengetahuan keislaman mendalam, memberikan jawaban berdasarkan sumber terpercaya.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Basis Pengetahuan",
    description:
      "Didukung teknologi RAG canggih, mengakses koleksi ilmu keislaman terkurasi untuk jawaban akurat dan bersumber.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Respons Real-time",
    description:
      "Rasakan jawaban instan dengan streaming langsung. Jawaban mengalir secara natural saat AI memprosesnya.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const steps = [
  {
    num: "١",
    title: "Buka Chat",
    description: "Klik tombol chat untuk memulai — tanpa perlu registrasi.",
  },
  {
    num: "٢",
    title: "Tanyakan Apa Saja",
    description: "Ketik pertanyaan seputar Islam. AI memproses dengan konteks dari basis pengetahuannya.",
  },
  {
    num: "٣",
    title: "Dapatkan Jawaban",
    description: "Terima jawaban cerdas real-time dengan referensi terkurasi.",
  },
];

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050a08] text-[#e8f0ec] overflow-x-hidden font-[family-name:var(--font-dm-sans)]">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-2xl bg-[#050a08]/60 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-[#2dd4a8]/10 border border-[#2dd4a8]/15 flex items-center justify-center">
              <CrescentIcon className="w-4 h-4 text-[#2dd4a8]" />
            </div>
            <span className="font-[family-name:var(--font-playfair)] text-lg font-bold tracking-tight">
              HikmahAI
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/chat" className="text-sm text-[#6a8d7e] hover:text-[#e8f0ec] transition-colors px-4 py-2">
              Chat
            </Link>
            <Link
              href="/login"
              className="text-sm px-5 py-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-all text-[#9ab8a8]"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#2dd4a8]/[0.05] rounded-full blur-[180px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/5 w-[420px] h-[420px] bg-[#d4a72d]/[0.035] rounded-full blur-[140px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
        </div>

        {/* rotating star ornament */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <IslamicStar className="w-[680px] h-[680px] text-[#2dd4a8] opacity-[0.07] animate-spin-slow" />
        </div>

        {/* corner diamond ornaments */}
        <DiamondOrn className="absolute top-24 left-8 w-8 h-8 text-[#2dd4a8]/[0.08] hidden lg:block" />
        <DiamondOrn className="absolute top-24 right-8 w-8 h-8 text-[#2dd4a8]/[0.08] hidden lg:block" />
        <DiamondOrn className="absolute bottom-24 left-8 w-8 h-8 text-[#d4a72d]/[0.08] hidden lg:block" />
        <DiamondOrn className="absolute bottom-24 right-8 w-8 h-8 text-[#d4a72d]/[0.08] hidden lg:block" />

        {/* dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(45,212,168,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          {/* badge */}
          <div className="animate-fade-in inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-[#2dd4a8]/15 bg-[#2dd4a8]/[0.04] text-[#2dd4a8] text-sm mb-10">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2dd4a8] opacity-60" />
              <span className="relative inline-flex rounded-full size-2 bg-[#2dd4a8]" />
            </span>
            Asisten AI Keislaman
          </div>

          {/* bismillah */}
          <p className="animate-fade-in text-[#d4a72d]/70 text-2xl md:text-3xl mb-8 font-[family-name:var(--font-playfair)]" style={{ animationDelay: "0.05s" }}>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>

          {/* headline */}
          <h1 className="animate-fade-in-up font-[family-name:var(--font-playfair)] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.93] tracking-tight mb-8" style={{ animationDelay: "0.15s" }}>
            Temukan{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-[#2dd4a8] via-[#7aecd0] to-[#2dd4a8] bg-clip-text text-transparent bg-[length:200%] animate-gradient">
                Hikmah
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#2dd4a8]/40 to-transparent rounded-full" />
            </span>
            <br />
            dalam Setiap Jawaban
          </h1>

          {/* subtitle */}
          <p className="animate-fade-in-up text-lg md:text-xl text-[#6a8d7e] max-w-2xl mx-auto mb-10 leading-relaxed" style={{ animationDelay: "0.3s" }}>
            Asisten AI cerdas yang memahami konteks keislaman, didukung model
            bahasa canggih dan basis pengetahuan ilmu Islam terkurasi.
          </p>

          {/* stats row */}
          <div className="animate-fade-in-up flex items-center justify-center gap-8 mb-12 text-xs text-[#4a6b5c]" style={{ animationDelay: "0.38s" }}>
            {[
              { label: "Model", value: "Llama 3.3" },
              { label: "Parameter", value: "70B" },
              { label: "Knowledge", value: "RAG" },
              { label: "Biaya", value: "Gratis" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-0.5">
                <span className="text-[#c0d8cc] font-semibold text-sm">{s.value}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          {/* gold divider with diamond */}
          <div className="animate-fade-in-up flex items-center justify-center gap-4 mb-12" style={{ animationDelay: "0.42s" }}>
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d4a72d]/25" />
            <DiamondOrn className="w-5 h-5 text-[#d4a72d]/30" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d4a72d]/25" />
          </div>

          {/* CTAs */}
          <div className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animationDelay: "0.5s" }}>
            <Link
              href="/chat"
              className="group relative px-8 py-4 bg-[#2dd4a8] text-[#050a08] font-semibold text-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_rgba(45,212,168,0.25)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="relative z-10">Mulai Bertanya</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#7aecd0] to-[#2dd4a8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 text-sm text-[#7a9d8e] hover:text-[#e8f0ec] border border-white/[0.07] hover:border-[#2dd4a8]/20 rounded-2xl transition-all duration-300 hover:bg-[#2dd4a8]/[0.04] flex items-center gap-2"
            >
              Dashboard Admin
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-fade-in" style={{ animationDelay: "1.2s" }}>
          <div className="w-6 h-10 rounded-full border-2 border-[#2dd4a8]/10 flex justify-center pt-2">
            <div className="w-1 h-2.5 bg-[#2dd4a8]/20 rounded-full animate-float" />
          </div>
        </div>
      </section>

      {/* ── Quran Quote ────────────────────────────────────── */}
      <section className="py-24 relative">
        <AnimateOnScroll>
          <div className="max-w-3xl mx-auto px-6 text-center">
            {/* top ornament */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-[#d4a72d]/20" />
              <DiamondOrn className="w-5 h-5 text-[#d4a72d]/25" />
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-[#d4a72d]/20" />
            </div>

            {/* arabic ayah */}
            <p className="text-[#d4a72d]/50 text-2xl md:text-3xl mb-6 leading-relaxed" dir="rtl" lang="ar">
              رَبِّ زِدْنِي عِلْمًا
            </p>

            {/* translation */}
            <blockquote className="text-xl md:text-2xl text-[#b0c8bc] leading-relaxed font-[family-name:var(--font-playfair)] italic px-8">
              &ldquo;Ya Tuhanku, tambahkanlah kepadaku ilmu pengetahuan.&rdquo;
            </blockquote>

            <p className="text-[#3a5a48] text-sm mt-6 tracking-wide">QS. Thaha : 114</p>

            {/* bottom ornament */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-[#d4a72d]/20" />
              <DiamondOrn className="w-5 h-5 text-[#d4a72d]/25" />
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-[#d4a72d]/20" />
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateOnScroll>
            <div className="text-center mb-20">
              <p className="text-[#2dd4a8] text-xs font-medium tracking-[0.2em] uppercase mb-4">
                Kemampuan
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold">
                Dibangun untuk Ilmu
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <AnimateOnScroll key={i} delay={i * 150}>
                <div className="group relative p-8 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:bg-[#2dd4a8]/[0.04] hover:border-[#2dd4a8]/[0.12] transition-all duration-500 h-full gradient-border">
                  {/* top accent line */}
                  <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#2dd4a8]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* number badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="size-11 rounded-xl bg-[#2dd4a8]/[0.08] flex items-center justify-center text-[#2dd4a8] group-hover:bg-[#2dd4a8]/[0.12] transition-colors duration-500">
                      {f.icon}
                    </div>
                    <span className="text-[10px] font-mono text-[#2a3d33] tracking-widest">{f.num}</span>
                  </div>

                  <h3 className="text-lg font-semibold mb-3 text-[#d4e8df]">{f.title}</h3>
                  <p className="text-[#5a7d6e] leading-relaxed text-sm">{f.description}</p>

                  {/* hover arrow */}
                  <div className="mt-6 flex items-center gap-1.5 text-[#2dd4a8]/0 group-hover:text-[#2dd4a8]/60 transition-all duration-500 text-xs">
                    Pelajari
                    <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2dd4a8]/[0.015] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 relative">
          <AnimateOnScroll>
            <div className="text-center mb-20">
              <p className="text-[#2dd4a8] text-xs font-medium tracking-[0.2em] uppercase mb-4">
                Cara Kerja
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold">
                Mudah &amp; Berkah
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="relative grid md:grid-cols-3 gap-12">
            {/* connecting line (desktop) */}
            <div className="absolute top-7 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-[#2dd4a8]/10 via-[#2dd4a8]/20 to-[#2dd4a8]/10 hidden md:block" />

            {steps.map((step, i) => (
              <AnimateOnScroll key={i} delay={i * 150}>
                <div className="text-center relative">
                  {/* outer glow ring */}
                  <div className="inline-flex items-center justify-center size-16 rounded-full border border-[#2dd4a8]/15 text-[#2dd4a8] text-2xl font-bold mb-6 relative bg-[#050a08]">
                    <div className="absolute inset-0 rounded-full bg-[#2dd4a8]/[0.04] blur-sm" />
                    <span className="relative">{step.num}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-[#d4e8df]">{step.title}</h3>
                  <p className="text-[#5a7d6e] leading-relaxed text-sm">{step.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-32 relative">
        <AnimateOnScroll>
          <div className="max-w-3xl mx-auto px-6">
            <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-12 md:p-16 text-center overflow-hidden gradient-border">
              {/* ornaments inside card */}
              <IslamicStar className="absolute -top-16 -right-16 w-48 h-48 text-[#2dd4a8]/[0.04]" />
              <IslamicStar className="absolute -bottom-16 -left-16 w-48 h-48 text-[#d4a72d]/[0.04]" />

              <CrescentIcon className="w-10 h-10 text-[#2dd4a8]/25 mx-auto mb-8" />
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-5xl font-bold mb-5 relative">
                Siap Mencari{" "}
                <span className="bg-gradient-to-r from-[#2dd4a8] to-[#7aecd0] bg-clip-text text-transparent">
                  Ilmu
                </span>
                ?
              </h2>
              <p className="text-[#5a7d6e] text-base mb-10 max-w-md mx-auto leading-relaxed">
                Mulai percakapan dengan HikmahAI sekarang. Tanpa perlu mendaftar, langsung bertanya.
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2.5 px-10 py-4 bg-[#2dd4a8] text-[#050a08] font-semibold rounded-2xl transition-all duration-300 hover:shadow-[0_0_60px_rgba(45,212,168,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Mulai Chat
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <p className="text-[10px] text-[#2a3d33] mt-6">
                Jawaban AI mungkin tidak selalu akurat &middot; Selalu verifikasi dengan ulama
              </p>
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="relative py-10">
        <div className="h-px absolute top-0 left-0 right-0 bg-gradient-to-r from-transparent via-[#2dd4a8]/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* brand */}
            <Link href="/" className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-[#2dd4a8]/10 border border-[#2dd4a8]/15 flex items-center justify-center">
                <CrescentIcon className="w-3.5 h-3.5 text-[#2dd4a8]" />
              </div>
              <span className="font-[family-name:var(--font-playfair)] font-bold text-[#c0d8cc]">HikmahAI</span>
            </Link>

            {/* links */}
            <div className="flex items-center gap-6 text-xs text-[#3a5a48]">
              <Link href="/chat" className="hover:text-[#7a9d8e] transition-colors">Chat</Link>
              <Link href="/dashboard" className="hover:text-[#7a9d8e] transition-colors">Dashboard</Link>
              <Link href="/login" className="hover:text-[#7a9d8e] transition-colors">Admin</Link>
            </div>

            {/* copy */}
            <p className="text-xs text-[#2a3d33]">
              &copy; {new Date().getFullYear()} HikmahAI &middot; بارك الله فيكم
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
