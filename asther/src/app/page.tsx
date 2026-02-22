import Link from "next/link";
import AnimateOnScroll from "@/components/AnimateOnScroll";

/* ── Islamic geometric SVG pattern (inline, reusable) ── */
function IslamicPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 8-pointed star / Rub el Hizb pattern */}
      <g opacity="0.12" stroke="currentColor" strokeWidth="0.5">
        <polygon points="100,10 118,82 190,82 132,126 150,198 100,154 50,198 68,126 10,82 82,82" />
        <polygon points="100,30 114,82 170,82 126,114 140,170 100,142 60,170 74,114 30,82 86,82" />
        <circle cx="100" cy="100" r="60" />
        <circle cx="100" cy="100" r="40" />
        <line x1="100" y1="10" x2="100" y2="190" />
        <line x1="10" y1="100" x2="190" y2="100" />
        <line x1="30" y1="30" x2="170" y2="170" />
        <line x1="170" y1="30" x2="30" y2="170" />
      </g>
    </svg>
  );
}

/* ── Crescent & Star icon ── */
function CrescentIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c1.292 0 2.526-.245 3.66-.69A8 8 0 0 1 8 12a8 8 0 0 1 7.66-9.31A10.052 10.052 0 0 0 12 2z" />
      <circle cx="18" cy="6" r="1.5" />
    </svg>
  );
}

const features = [
  {
    title: "Kajian Islam Cerdas",
    description:
      "AI yang memahami konteks percakapan dengan pengetahuan keislaman yang mendalam, memberikan jawaban berdasarkan sumber-sumber terpercaya.",
    icon: (
      <svg className="w-6 h-6 text-[#2dd4a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: "Basis Pengetahuan",
    description:
      "Didukung teknologi RAG canggih, mengakses koleksi ilmu keislaman yang terkurasi untuk memberikan jawaban akurat dan bersumber.",
    icon: (
      <svg className="w-6 h-6 text-[#2dd4a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: "Respons Real-time",
    description:
      "Rasakan jawaban instan dengan streaming langsung. Saksikan jawaban mengalir secara natural saat AI memprosesnya.",
    icon: (
      <svg className="w-6 h-6 text-[#2dd4a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const steps = [
  {
    num: "١",
    title: "Buka Chat",
    description: "Klik tombol chat untuk memulai — tanpa perlu registrasi atau mendaftar.",
  },
  {
    num: "٢",
    title: "Tanyakan Apa Saja",
    description: "Ketik pertanyaan seputar Islam. AI akan memprosesnya dengan konteks dari basis pengetahuannya.",
  },
  {
    num: "٣",
    title: "Dapatkan Jawaban",
    description: "Terima jawaban cerdas secara real-time dengan referensi dari sumber-sumber terkurasi.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050a08] text-[#e8f0ec] overflow-x-hidden font-[family-name:var(--font-dm-sans)]">
      {/* ── Navbar ───────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#050a08]/70 border-b border-[#2dd4a8]/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CrescentIcon className="w-6 h-6 text-[#2dd4a8]" />
            <span className="font-[family-name:var(--font-playfair)] text-xl font-bold tracking-tight">
              HikmahAI
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/chat" className="text-sm text-[#7a9d8e] hover:text-[#e8f0ec] transition-colors">
              Chat
            </Link>
            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-full border border-[#2dd4a8]/15 hover:bg-[#2dd4a8]/[0.06] transition-all"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background glows — emerald & teal */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[550px] h-[550px] bg-[#2dd4a8]/[0.06] rounded-full blur-[160px] animate-pulse-glow" />
          <div
            className="absolute bottom-1/4 right-1/5 w-[400px] h-[400px] bg-[#d4a72d]/[0.04] rounded-full blur-[130px] animate-pulse-glow"
            style={{ animationDelay: "2s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0a1a14]/60 rounded-full blur-[100px]" />
        </div>

        {/* Islamic geometric pattern background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <IslamicPattern className="w-[700px] h-[700px] text-[#2dd4a8] opacity-30" />
        </div>

        {/* Subtle geometric grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(45,212,168,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,168,.15) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[#2dd4a8]/20 bg-[#2dd4a8]/[0.06] text-[#2dd4a8] text-sm mb-10">
            <CrescentIcon className="w-4 h-4" />
            Asisten AI Keislaman
          </div>

          {/* Bismillah */}
          <p
            className="animate-fade-in text-[#d4a72d]/80 text-2xl md:text-3xl mb-8 font-[family-name:var(--font-playfair)] italic"
            style={{ animationDelay: "0.05s" }}
          >
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>

          {/* Headline */}
          <h1
            className="animate-fade-in-up font-[family-name:var(--font-playfair)] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-8"
            style={{ animationDelay: "0.15s" }}
          >
            Temukan{" "}
            <span className="bg-gradient-to-r from-[#2dd4a8] via-[#7aecd0] to-[#2dd4a8] bg-clip-text text-transparent bg-[length:200%] animate-gradient">
              Hikmah
            </span>
            <br />
            dalam Setiap Jawaban
          </h1>

          {/* Subtitle */}
          <p
            className="animate-fade-in-up text-lg md:text-xl text-[#7a9d8e] max-w-2xl mx-auto mb-14 leading-relaxed"
            style={{ animationDelay: "0.3s" }}
          >
            Asisten AI cerdas yang memahami konteks keislaman, didukung model
            bahasa canggih dan basis pengetahuan ilmu Islam yang terkurasi.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ animationDelay: "0.45s" }}
          >
            <Link
              href="/chat"
              className="group relative px-8 py-4 bg-[#2dd4a8] text-[#050a08] font-semibold text-sm rounded-full overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_rgba(45,212,168,0.25)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">Mulai Bertanya</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#7aecd0] to-[#2dd4a8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 text-sm text-[#7a9d8e] hover:text-[#e8f0ec] border border-[#2dd4a8]/[0.1] hover:border-[#2dd4a8]/[0.2] rounded-full transition-all duration-300 hover:bg-[#2dd4a8]/[0.04]"
            >
              Dashboard Admin &rarr;
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-fade-in"
          style={{ animationDelay: "1s" }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-[#2dd4a8]/15 flex justify-center pt-2">
            <div className="w-1 h-2.5 bg-[#2dd4a8]/25 rounded-full animate-float" />
          </div>
        </div>
      </section>

      {/* ── Quran Quote Section ──────────────────────────────── */}
      <section className="py-20 relative">
        <AnimateOnScroll>
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="relative inline-block">
              <div className="absolute -top-4 -left-4 text-[#d4a72d]/20 text-6xl font-[family-name:var(--font-playfair)]">&ldquo;</div>
              <blockquote className="text-xl md:text-2xl text-[#c0d8cc] leading-relaxed font-[family-name:var(--font-playfair)] italic px-8">
                Dan katakanlah: &ldquo;Ya Tuhanku, tambahkanlah kepadaku ilmu pengetahuan.&rdquo;
              </blockquote>
              <div className="absolute -bottom-4 -right-4 text-[#d4a72d]/20 text-6xl font-[family-name:var(--font-playfair)]">&rdquo;</div>
            </div>
            <p className="text-[#d4a72d]/60 text-sm mt-6 tracking-wide">— QS. Thaha: 114</p>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateOnScroll>
            <div className="text-center mb-20">
              <p className="text-[#2dd4a8] text-sm font-medium tracking-widest uppercase mb-4">
                Kemampuan
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold">
                Dibangun untuk Ilmu
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <AnimateOnScroll key={i} delay={i * 150}>
                <div className="group p-8 rounded-2xl border border-[#2dd4a8]/[0.08] bg-[#2dd4a8]/[0.02] hover:bg-[#2dd4a8]/[0.05] hover:border-[#2dd4a8]/[0.15] transition-all duration-500 h-full">
                  <div className="size-12 rounded-xl bg-[#2dd4a8]/10 flex items-center justify-center mb-6 group-hover:bg-[#2dd4a8]/15 transition-colors duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-[#7a9d8e] leading-relaxed">{feature.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2dd4a8]/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 relative">
          <AnimateOnScroll>
            <div className="text-center mb-20">
              <p className="text-[#2dd4a8] text-sm font-medium tracking-widest uppercase mb-4">
                Cara Kerja
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold">
                Mudah &amp; Berkah
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, i) => (
              <AnimateOnScroll key={i} delay={i * 150}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center size-14 rounded-full border border-[#2dd4a8]/20 text-[#2dd4a8] text-2xl font-bold mb-6">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                  <p className="text-[#7a9d8e] leading-relaxed">{step.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-32 relative">
        <AnimateOnScroll>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <CrescentIcon className="w-12 h-12 text-[#2dd4a8]/30 mx-auto mb-8" />
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-6xl font-bold mb-6">
              Siap Mencari{" "}
              <span className="bg-gradient-to-r from-[#2dd4a8] to-[#7aecd0] bg-clip-text text-transparent">
                Ilmu
              </span>
              ?
            </h2>
            <p className="text-[#7a9d8e] text-lg mb-10 max-w-xl mx-auto">
              Mulai percakapan dengan HikmahAI sekarang. Tanpa perlu mendaftar.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-10 py-5 bg-[#2dd4a8] text-[#050a08] font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_60px_rgba(45,212,168,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Mulai Chat
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-[#2dd4a8]/[0.08] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CrescentIcon className="w-5 h-5 text-[#2dd4a8]/60" />
            <span className="font-[family-name:var(--font-playfair)] font-bold tracking-tight">
              HikmahAI
            </span>
          </div>
          <p className="text-sm text-[#2a3d33]">
            &copy; {new Date().getFullYear()} HikmahAI &middot; Dibuat dengan penuh keberkahan
          </p>
        </div>
      </footer>
    </div>
  );
}
