import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "@/components/site/Icon";
import { CtaBand, PageHero, delay } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "FAQ — Hikmah AI",
  description:
    "Pertanyaan yang sering diajukan tentang Hikmah AI: topik, sumber jawaban, akun, privasi, suara, lampiran, dan integrasi.",
};

const SECTIONS: Array<{ title: string; items: Array<[string, ReactNode]> }> = [
  {
    title: "Umum",
    items: [
      [
        "Apa itu Hikmah AI?",
        "Hikmah AI adalah teman belajar berbasis AI untuk Hukum Islam, Sejarah Islam, dan Pengetahuan Umum Islam. Kamu bertanya seperti chat biasa, dan jawabannya disertai rujukan yang bisa kamu periksa.",
      ],
      [
        "Topik apa saja yang bisa ditanyakan?",
        "Fikih ibadah dan muamalah, sirah dan sejarah peradaban Islam, akidah, akhlak, tafsir, dan hadis. Pertanyaan di luar itu, misalnya soal pemrograman atau saham, akan ditolak dengan sopan.",
      ],
      [
        "Apakah saya perlu membuat akun?",
        "Ya. Daftar cukup dengan nama panggilan, email, dan password minimal 8 karakter. Akun dipakai untuk menyimpan riwayat percakapanmu.",
      ],
      [
        "Apakah ada batas penggunaan?",
        "Ada. Pengelola menetapkan batas jumlah pertanyaan per menit dan per hari supaya layanan tetap stabil untuk semua orang.",
      ],
    ],
  },
  {
    title: "Jawaban dan sumber",
    items: [
      [
        "Dari mana sumber jawabannya?",
        "Dari basis rujukan yang dikelola pengelola: ayat, hadis, dan kitab ulama. Hanya dokumen yang sudah ditinjau dan diterbitkan yang dipakai. Klik nomor sumber di jawaban untuk membaca kutipannya.",
      ],
      [
        "Apakah jawaban Hikmah AI bisa dijadikan fatwa?",
        "Tidak. Hikmah AI membantu kamu belajar dan memahami. Untuk penetapan hukum pada kasus pribadi, tanyakan ke ustadz yang kamu percaya.",
      ],
      [
        "Bagaimana kalau Hikmah AI tidak menemukan sumber?",
        "Hikmah AI akan bilang terus terang bahwa rujukannya belum cukup, lalu mengajakmu memperjelas pertanyaan. Ia tidak akan menebak atau mengarang dalil.",
      ],
      [
        "Bisa minta jawaban yang lebih pendek atau lebih rinci?",
        "Bisa. Pilih gaya jawaban Ringkas, Seimbang, atau Mendalam dari menu di bagian atas chat.",
      ],
      [
        "Bagaimana kalau jawabannya keliru?",
        "Beri jempol turun atau laporkan jawabannya. Laporan masuk ke pengelola lengkap dengan pertanyaan, jawaban, dan rujukannya untuk ditinjau.",
      ],
    ],
  },
  {
    title: "Privasi",
    items: [
      [
        "Apakah percakapan saya disimpan?",
        <>
          Ya, percakapan biasa tersimpan di akunmu dan bisa kamu hapus kapan
          saja. Kalau tidak ingin tersimpan, pakai chat sementara. Detailnya ada
          di halaman{" "}
          <Link href="/privacy" className="font-bold text-brand underline underline-offset-4">
            privasi percakapan
          </Link>
          .
        </>,
      ],
      [
        "Siapa yang bisa membaca percakapan saya?",
        "Pengelola dengan hak admin dapat membaca riwayat untuk mengelola layanan dan memeriksa kesalahan. Pengguna lain tidak bisa membuka percakapanmu. Pertanyaan juga dikirim ke penyedia AI untuk dijawab, jadi hindari menulis data pribadi yang tidak perlu.",
      ],
      [
        "Apa yang terjadi saat saya membagikan percakapan?",
        "Tautan berisi salinan percakapan saat itu. Pesan baru tidak ikut ditambahkan, dan kamu bisa mencabut tautannya kapan saja.",
      ],
    ],
  },
  {
    title: "Fitur",
    items: [
      [
        "Bisakah saya bertanya dengan suara?",
        "Bisa, lewat tombol mikrofon di kolom tanya. Fitur ini memakai layanan dikte bawaan browser, jadi ketersediaannya bergantung pada browser yang kamu pakai. Jawaban juga bisa dibacakan.",
      ],
      [
        "Bisakah saya melampirkan dokumen?",
        "Bisa, hingga 3 berkas teks berformat .txt atau .md. Lampiran dipakai sebagai konteks pertanyaan, bukan sebagai rujukan keagamaan yang sudah ditinjau.",
      ],
      [
        "Bisakah Hikmah AI dipasang di aplikasi lain?",
        "Bisa. Pengelola dapat menghubungkan Hikmah AI ke aplikasi lain melalui REST API dengan token bearer. Dokumentasinya tersedia di dashboard pengelola.",
      ],
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Pertanyaan yang sering ditanyakan."
        lead="Belum menemukan jawabannya di sini? Tanyakan saja langsung ke Hikmah AI."
      />

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[240px_1fr]">
        <nav
          aria-label="Kategori FAQ"
          className="flex flex-wrap gap-2 lg:sticky lg:top-28 lg:flex-col lg:self-start"
        >
          {SECTIONS.map((section) => (
            <a
              key={section.title}
              href={"#" + section.title.toLowerCase().replace(/\s+/g, "-")}
              className="rounded-full px-4 py-2 text-sm font-bold text-stone-700 transition-colors hover:bg-hijau/10 hover:text-brand lg:w-fit"
            >
              {section.title}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-14">
          {SECTIONS.map((section) => (
            <div
              key={section.title}
              id={section.title.toLowerCase().replace(/\s+/g, "-")}
              className="flex scroll-mt-28 flex-col gap-4"
            >
              <h2 data-reveal className="font-display text-3xl leading-none">
                {section.title}
              </h2>
              {section.items.map(([question, answer], i) => (
                <details
                  key={question}
                  data-reveal
                  style={delay(i + 1)}
                  className="faq-item surface-card group p-0"
                  name={section.title}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                    <span className="font-heading text-lg leading-snug">
                      {question}
                    </span>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-hijau/10 text-brand transition-transform duration-300 group-open:rotate-45 group-open:bg-primary group-open:text-on-primary dark:bg-pucuk/15">
                      <Icon name="close" size={16} className="rotate-45" />
                    </span>
                  </summary>
                  <div className="faq-body px-6 pb-6 text-[15px] leading-relaxed text-stone-700">
                    {answer}
                  </div>
                </details>
              ))}
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        title="Masih ada yang bikin penasaran?"
        body="Tanyakan langsung. Hikmah AI menjawab dengan sumber yang bisa kamu periksa."
      />
    </>
  );
}
