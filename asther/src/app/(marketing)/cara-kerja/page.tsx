import type { Metadata } from "next";
import Icon, { type IconName } from "@/components/site/Icon";
import {
  CtaBand,
  Eyebrow,
  PageHero,
  SectionHead,
  delay,
} from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "Cara kerja — Hikmah AI",
  description:
    "Bagaimana Hikmah AI memeriksa ruang lingkup, mencari rujukan yang ditinjau, menyusun jawaban bersumber, dan jujur saat sumber belum cukup.",
};

const PIPELINE: Array<{
  icon: IconName;
  title: string;
  body: string;
  detail: string;
}> = [
  {
    icon: "chat",
    title: "Pertanyaanmu masuk",
    body: "Kamu menulis atau mendikte pertanyaan. Untuk pertanyaan lanjutan, beberapa pesan terakhir ikut dibaca supaya konteksnya nyambung.",
    detail: "Sapaan seperti salam dijawab langsung tanpa proses panjang.",
  },
  {
    icon: "filter",
    title: "Ruang lingkup diperiksa",
    body: "Hikmah AI memastikan pertanyaanmu termasuk Hukum Islam, Sejarah Islam, atau Pengetahuan Umum Islam.",
    detail: "Di luar itu, misalnya soal pemrograman atau saham, ditolak dengan sopan.",
  },
  {
    icon: "search",
    title: "Rujukan dicari",
    body: "Pencarian menggabungkan kecocokan makna dan kata kunci, lalu memprioritaskan sumber Al-Qur'an atau hadis bila pertanyaanmu menyinggungnya.",
    detail: "Hanya dokumen yang sudah ditinjau dan diterbitkan pengelola yang ikut dicari.",
  },
  {
    icon: "shield",
    title: "Sumber cukup?",
    body: "Kalau tidak ada rujukan yang cukup relevan, Hikmah AI tidak menebak. Kamu akan diberi tahu terus terang dan diajak memperjelas pertanyaan.",
    detail: "Lebih baik bilang belum tahu daripada mengarang dalil.",
  },
  {
    icon: "bookmark",
    title: "Jawaban disusun",
    body: "Kalimat pertama menjawab inti pertanyaan, lalu penjelasan dengan nomor sumber. Fakta, tafsir, dan perbedaan pendapat dipisahkan.",
    detail: "Ayat dan hadis hanya dikutip bila tersedia di rujukan.",
  },
  {
    icon: "flag",
    title: "Mutu dijaga",
    body: "Pengguna bisa menilai dan melaporkan jawaban. Pengelola meninjau laporan dan menguji mutu jawaban secara berkala.",
    detail: "Kutipan disimpan bersama jawaban agar tetap bisa diperiksa.",
  },
];

const LIMITS: Array<[IconName, string, string]> = [
  ["help", "Bisa keliru", "Hikmah AI adalah alat bantu belajar berbasis AI. Selalu periksa rujukannya."],
  ["users", "Bukan pengganti ulama", "Untuk penetapan hukum pada kasus pribadi, tanyakan ke ustadz yang kamu percaya."],
  ["database", "Sebatas koleksi rujukan", "Cakupan jawaban bergantung pada dokumen yang sudah dimasukkan dan ditinjau pengelola."],
  ["paperclip", "Lampiran bukan rujukan resmi", "Berkas yang kamu lampirkan dipakai sebagai konteks, bukan sumber keagamaan yang telah ditinjau."],
];

export default function CaraKerjaPage() {
  return (
    <>
      <PageHero
        eyebrow="Cara kerja"
        title="Dari pertanyaan ke jawaban yang berdalil."
        lead="Hikmah AI tidak mengarang dalil. Begini perjalanan pertanyaanmu sampai menjadi jawaban yang bisa kamu periksa sendiri."
      />

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHead
          eyebrow="Alur jawaban"
          title="Enam langkah di balik layar."
        />
        <ol className="relative mt-12 grid gap-5">
          <span
            aria-hidden
            className="absolute top-6 bottom-6 left-[27px] w-[3px] rounded-full bg-[linear-gradient(to_bottom,var(--hk-pucuk),var(--hk-hijau),var(--hk-emas))] sm:left-[31px]"
          />
          {PIPELINE.map((step, i) => (
            <li
              key={step.title}
              data-reveal
              style={delay(1)}
              className="relative grid grid-cols-[56px_1fr] gap-4 sm:grid-cols-[64px_1fr] sm:gap-6"
            >
              <span className="relative z-10 flex size-14 items-center justify-center rounded-full bg-hijau text-pucuk shadow-[0_0_0_6px_var(--n-50)] sm:size-16">
                <Icon name={step.icon} size={24} />
              </span>
              <div className="surface-card lift flex flex-col gap-2 p-6">
                <span className="label-caps text-brand">
                  Langkah {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-heading text-2xl">{step.title}</h3>
                <p className="text-[15px] leading-relaxed text-stone-700">
                  {step.body}
                </p>
                <p className="mt-1 w-fit rounded-2xl bg-[#FAF3E3] px-3.5 py-2 text-[13px] font-semibold text-[#5C4516] dark:bg-[#2b2914] dark:text-[#e5c98a]">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="px-3">
        <div className="mx-auto grid max-w-[1400px] gap-10 rounded-[40px] bg-stone-100 px-6 py-16 sm:px-12 sm:py-20 lg:grid-cols-2 lg:px-16">
          <div data-reveal className="flex flex-col gap-5">
            <Eyebrow>Kalau sumbernya belum ada</Eyebrow>
            <h2 className="font-display text-4xl leading-[0.95] sm:text-5xl">
              Kalau ragu, kami bilang ragu.
            </h2>
            <p className="text-[17px] leading-[1.65] text-stone-700">
              Mode kutipan ketat membuat Hikmah AI menolak menjawab bila tidak
              ada rujukan yang memadai. Ini sengaja: dalam urusan agama, jawaban
              yang terdengar meyakinkan tapi tanpa dasar lebih berbahaya
              daripada jawaban &ldquo;belum tahu&rdquo;.
            </p>
          </div>
          <figure
            data-reveal
            style={delay(2)}
            className="flex flex-col gap-3 self-center rounded-[30px] bg-kertas p-5 text-tinta shadow-[0_30px_60px_-30px_rgba(6,42,27,0.5)] ring-1 ring-tinta/10"
          >
            <p className="max-w-[85%] self-end rounded-[20px] rounded-br-md bg-hijau px-4 py-2.5 text-sm text-kertas">
              Apa hukum memakai cincin di jari telunjuk?
            </p>
            <p className="rounded-[20px] rounded-tl-md border-l-[3px] border-emas bg-[#fff] px-4 py-3 text-sm leading-relaxed">
              Saya belum menemukan rujukan yang cukup untuk menjawab pertanyaan
              ini. Coba perjelas pertanyaanmu, atau minta pengelola menambahkan
              sumber yang relevan. Untuk penetapan hukum pada kasus pribadi,
              tanyakan ke ustadz yang kamu percaya.
            </p>
            <figcaption className="px-1 text-xs text-[#605D5D]">
              Contoh tampilan saat basis rujukan belum memuat topik yang
              ditanyakan.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHead
          eyebrow="Batasan"
          title="Yang perlu kamu tahu."
          lead="Kami ingin kamu memakai Hikmah AI dengan ekspektasi yang tepat."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {LIMITS.map(([icon, title, body], i) => (
            <div
              key={title}
              data-reveal
              style={delay((i % 2) + 1)}
              className="surface-card flex gap-4 p-6"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#FAF3E3] text-[#5C4516]">
                <Icon name={icon} size={20} />
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-heading text-lg">{title}</h3>
                <p className="text-[14px] leading-relaxed text-stone-600">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        title="Sudah paham alurnya? Saatnya bertanya."
        body="Mulai dari pertanyaan yang paling sering bikin kamu penasaran."
      />
    </>
  );
}
