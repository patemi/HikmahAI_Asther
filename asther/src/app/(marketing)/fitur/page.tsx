import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/site/Icon";
import {
  CtaBand,
  Eyebrow,
  PageHero,
  PrimaryCta,
  SectionHead,
  delay,
} from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "Fitur — Hikmah AI",
  description:
    "Jawaban bersumber, kedalaman jawaban, suara, chat sementara, berbagi, ekspor, dan alat pengelola. Semua yang bisa kamu lakukan bersama Hikmah AI.",
};

// The same question answered at the three depths the chat offers.
const DEPTHS = [
  {
    name: "Ringkas",
    note: "3–6 baris, langsung ke inti",
    body: [
      "Wajib bagi setiap muslim yang baligh, berakal, dan mampu. Dalilnya QS. Al-Baqarah: 183.",
    ],
  },
  {
    name: "Seimbang",
    note: "Jawaban plus konteks secukupnya",
    body: [
      "Puasa Ramadan wajib bagi setiap muslim yang baligh, berakal, dan mampu (QS. Al-Baqarah: 183).",
      "Orang yang sakit atau dalam perjalanan boleh tidak berpuasa, lalu menggantinya di hari lain (QS. Al-Baqarah: 184).",
    ],
  },
  {
    name: "Mendalam",
    note: "Pembahasan rinci dan bernuansa",
    body: [
      "Kewajiban puasa Ramadan ditetapkan dalam QS. Al-Baqarah: 183 dan termasuk rukun Islam.",
      "Syarat wajibnya: muslim, baligh, berakal, dan mampu. Rukunnya: niat dan menahan diri dari hal yang membatalkan sejak terbit fajar hingga terbenam matahari.",
      "Bagi yang berhalangan sementara ada qada, dan bagi yang tidak mampu secara permanen ada fidyah (QS. Al-Baqarah: 184). Rincian kasus tertentu bisa berbeda antarmazhab.",
    ],
  },
];

const GROUPS: Array<{
  title: string;
  lead: string;
  items: Array<[IconName, string, string]>;
}> = [
  {
    title: "Bertanya",
    lead: "Cara-cara mengajukan pertanyaan, senyaman ngobrol.",
    items: [
      ["chat", "Pertanyaan lanjutan", "Percakapan mengingat konteks sebelumnya, jadi kamu bisa bertanya \"kalau begitu…\" tanpa mengulang."],
      ["paperclip", "Lampirkan catatan", "Tambahkan hingga 3 berkas .txt atau .md, misalnya catatan kajian, lalu tanyakan isinya."],
      ["mic", "Dikte suara", "Ucapkan pertanyaanmu. Suara diproses oleh layanan dikte bawaan browser."],
      ["pencil", "Edit dan buat ulang", "Perbaiki pertanyaan terakhir atau minta jawaban baru tanpa membuka chat lain."],
      ["close", "Hentikan kapan saja", "Jawaban terlalu panjang? Hentikan di tengah jalan, lalu arahkan ulang."],
    ],
  },
  {
    title: "Memeriksa",
    lead: "Karena jawaban yang baik harus bisa dicek.",
    items: [
      ["bookmark", "Rujukan bernomor", "Klik nomor sumber untuk melihat judul, penulis, letak rujukan, dan kutipan aslinya."],
      ["shield", "Jujur saat sumber kurang", "Kalau rujukan belum cukup, Hikmah AI bilang terus terang, bukan menebak."],
      ["thumbsUp", "Nilai jawaban", "Beri jempol naik atau turun supaya pengelola tahu jawaban mana yang membantu."],
      ["flag", "Laporkan kekeliruan", "Tandai jawaban yang salah, kutipan yang tidak cocok, atau penjelasan yang membingungkan."],
    ],
  },
  {
    title: "Mengelola",
    lead: "Riwayat belajarmu, rapi dan dalam kendalimu.",
    items: [
      ["history", "Riwayat tersimpan", "Percakapan tersimpan di akunmu dan bisa dilanjutkan kapan saja."],
      ["search", "Cari percakapan", "Temukan chat lama lewat judul atau isinya. Pintasan: Ctrl K."],
      ["pin", "Sematkan dan arsipkan", "Sematkan chat penting, ubah judulnya, atau arsipkan supaya daftar tetap rapi."],
      ["eyeOff", "Chat sementara", "Bertanya tanpa menyimpan percakapan ke riwayat akunmu."],
      ["share", "Bagikan tautan", "Kirim salinan percakapan lewat tautan, dan cabut aksesnya kapan saja."],
      ["download", "Ekspor percakapan", "Unduh percakapan untuk catatan atau bahan kajian."],
      ["volume", "Dengarkan jawaban", "Jawaban bisa dibacakan dengan suara perangkat atau browser."],
      ["moon", "Tema terang dan gelap", "Nyaman dipakai siang maupun malam."],
    ],
  },
];

const ORG: Array<[IconName, string, string]> = [
  ["database", "Kelola rujukan", "Tambah dokumen satu per satu atau impor JSON. Setiap dokumen melewati alur draf, tinjau, lalu terbit, lengkap dengan versi."],
  ["chart", "Ukur mutu jawaban", "Uji kasus pertanyaan dengan jawaban acuan, lalu lihat precision, recall, dan ketepatan jawaban per kategori."],
  ["flag", "Tinjau laporan", "Laporan pengguna masuk ke antrean pengelola lengkap dengan pertanyaan, jawaban, dan rujukannya."],
  ["dashboard", "Atur perilaku bot", "Sesuaikan persona, tingkat kehati-hatian, mode kutipan ketat, dan panjang memori percakapan."],
  ["code", "API untuk integrasi", "Hubungkan Hikmah AI ke aplikasimu lewat REST API dengan token bearer dan respons streaming."],
  ["users", "Pemakaian dan kuota", "Pantau pemakaian model dan batasi permintaan per menit atau per hari."],
];

const SAMPLES = [
  ["Fikih", "Boleh nggak jamak salat pas lagi kuliah lapangan?"],
  ["Sirah", "Kenapa hijrah ke Madinah jadi awal kalender Hijriah?"],
  ["Tafsir", "Apa makna sabar dalam Al-Qur'an?"],
  ["Hadis", "Apa maksud hadis tentang niat, innamal a'malu binniyat?"],
  ["Akhlak", "Bagaimana menjaga adab ketika berbeda pendapat?"],
  ["Muamalah", "Paylater itu riba nggak?"],
] as const;

export default function FiturPage() {
  return (
    <>
      <PageHero
        eyebrow="Fitur"
        title="Semua yang bisa kamu lakukan bersama Hikmah AI."
        lead="Bertanya, memeriksa rujukan, dan merapikan riwayat belajar. Semua dirancang supaya kamu paham jawabannya, bukan cuma membacanya."
      >
        <div className="flex flex-wrap gap-2.5 pt-2">
          <PrimaryCta>Coba sekarang</PrimaryCta>
          <a
            href="#kelompok-fitur"
            className="press inline-flex items-center rounded-full border-2 border-kertas/60 px-6 py-[14px] text-[15px] font-extrabold hover:border-kertas hover:bg-kertas hover:text-hijau-900"
          >
            Lompat ke daftar fitur
          </a>
        </div>
      </PageHero>

      {/* Core feature: cited answers, with a mock of the source panel. */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.05fr]">
        <div data-reveal className="flex flex-col gap-5">
          <Eyebrow>Fitur utama</Eyebrow>
          <h2 className="font-display text-4xl leading-[0.95] sm:text-5xl">
            Setiap jawaban, ada sumbernya.
          </h2>
          <p className="text-[17px] leading-[1.65] text-stone-700">
            Hikmah AI menyusun jawaban dari basis rujukan yang dikelola dan
            ditinjau pengelola. Klaim penting diberi nomor seperti [1] dan [2].
            Klik nomornya untuk membaca kutipan asli, judul, penulis, dan letak
            rujukannya.
          </p>
          <ul className="grid gap-3 text-[15px] font-semibold">
            {[
              "Hanya dokumen berstatus terbit yang dipakai",
              "Kutipan disimpan bersama jawaban, jadi tetap bisa dicek nanti",
              "Kemiripan pencarian tidak dianggap sebagai kepastian kebenaran",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-hijau text-kertas dark:bg-pucuk dark:text-hijau-900">
                  <Icon name="check" size={13} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div data-reveal style={delay(2)} className="relative">
          <div
            aria-hidden
            className="drift-slow absolute -inset-8 rounded-[56px] bg-[radial-gradient(circle_at_70%_30%,rgba(197,236,79,0.4),transparent_60%)]"
          />
          <div className="relative grid gap-3">
            <div className="rounded-[26px] bg-[#fff] p-5 text-[15px] leading-relaxed text-tinta shadow-[0_24px_50px_-28px_rgba(6,42,27,0.5)] ring-1 ring-tinta/10">
              Kewajiban puasa Ramadan ditegaskan dalam Al-Qur&apos;an{" "}
              <span className="rounded-md bg-[#FAF3E3] px-1.5 py-0.5 text-[13px] font-bold text-[#5C4516]">
                [1]
              </span>
              , dan keringanan bagi yang sakit atau bepergian dijelaskan pada
              ayat berikutnya{" "}
              <span className="rounded-md bg-[#FAF3E3] px-1.5 py-0.5 text-[13px] font-bold text-[#5C4516]">
                [2]
              </span>
              .
            </div>
            <div className="ml-6 rotate-[1.5deg] rounded-[26px] bg-kertas p-5 text-tinta shadow-[0_24px_50px_-28px_rgba(6,42,27,0.5)] ring-1 ring-tinta/10 sm:ml-12">
              <span className="label-caps text-hijau">Rujukan [1]</span>
              <p className="font-heading mt-2 text-lg">QS. Al-Baqarah: 183</p>
              <p className="mt-1 text-xs text-[#605D5D]">
                Al-Qur&apos;an · ditinjau pengelola
              </p>
              <p className="mt-3 rounded-2xl border-l-[3px] border-emas bg-[#fff] px-4 py-3 text-sm leading-relaxed">
                &ldquo;Wahai orang-orang yang beriman, diwajibkan atas kamu
                berpuasa sebagaimana diwajibkan atas orang-orang sebelum kamu
                agar kamu bertakwa.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-3">
        <div className="mx-auto max-w-[1400px] rounded-[40px] bg-stone-100 px-6 py-16 sm:px-12 sm:py-20 lg:px-16">
          <SectionHead
            eyebrow="Kedalaman jawaban"
            title="Satu pertanyaan, tiga gaya."
            lead='Pilih gaya jawaban dari menu di atas chat. Contoh di bawah menjawab pertanyaan yang sama: "Apa hukum puasa Ramadan?"'
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {DEPTHS.map((depth, i) => (
              <article
                key={depth.name}
                data-reveal
                style={delay(i + 1)}
                className="surface-card lift flex flex-col gap-4 p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-hijau px-3.5 py-1 text-sm font-extrabold text-kertas dark:bg-pucuk dark:text-hijau-900">
                    {depth.name}
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    {depth.note}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 border-l-[3px] border-emas pl-4 text-[14px] leading-relaxed text-stone-700">
                  {depth.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="kelompok-fitur"
        className="mx-auto flex max-w-6xl scroll-mt-28 flex-col gap-20 px-4 py-16 sm:px-6 sm:py-24"
      >
        {GROUPS.map((group, g) => (
          <div key={group.title} className="grid gap-8 lg:grid-cols-[280px_1fr]">
            <div data-reveal className="flex flex-col gap-3 lg:sticky lg:top-28 lg:self-start">
              <span className="font-display text-6xl text-pucuk [-webkit-text-stroke:2px_var(--hk-hijau)] dark:[-webkit-text-stroke:0]">
                0{g + 1}
              </span>
              <h2 className="font-display text-4xl leading-none">{group.title}</h2>
              <p className="text-[15px] leading-relaxed text-stone-600">
                {group.lead}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.items.map(([icon, title, body], i) => (
                <div
                  key={title}
                  data-reveal
                  style={delay((i % 2) + 1)}
                  className="surface-card lift flex flex-col gap-3 p-6"
                >
                  <span className="wiggle-hover flex size-12 items-center justify-center rounded-2xl bg-hijau/10 text-brand dark:bg-pucuk/15">
                    <Icon name={icon} size={22} />
                  </span>
                  <h3 className="font-heading text-lg">{title}</h3>
                  <p className="text-[14px] leading-relaxed text-stone-600">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="px-3">
        <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-tinta px-6 py-16 text-kertas sm:px-12 sm:py-20 lg:px-16">
          <div
            data-reveal
            className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          >
            <div className="flex flex-col gap-3">
              <Eyebrow tone="dark">Untuk lembaga dan pengembang</Eyebrow>
              <h2 className="font-display max-w-[16ch] text-4xl leading-[0.95] sm:text-5xl">
                Pengelola memegang kendali mutu.
              </h2>
            </div>
            <p className="max-w-md text-[15px] leading-relaxed text-[#BAB6B6]">
              Pesantren, sekolah, atau komunitas kajian bisa mengelola
              rujukannya sendiri dan memantau mutu jawaban dari dashboard
              pengelola.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ORG.map(([icon, title, body], i) => (
              <div
                key={title}
                data-reveal
                style={delay((i % 3) + 1)}
                className="lift flex flex-col gap-3 rounded-[26px] bg-white/[0.06] p-6 ring-1 ring-white/10"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-pucuk text-hijau-900">
                  <Icon name={icon} size={20} />
                </span>
                <h3 className="font-heading text-lg">{title}</h3>
                <p className="text-[14px] leading-relaxed text-[#D7D3D3]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHead
          eyebrow="Coba tanyakan"
          title="Bingung mulai dari mana?"
          lead="Contoh pertanyaan dari tiap topik. Buka chat, lalu tulis dengan kata-katamu sendiri."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLES.map(([topic, question], i) => (
            <Link
              key={question}
              href="/chat"
              data-reveal
              style={delay((i % 3) + 1)}
              className="surface-card lift group flex items-start justify-between gap-4 p-5"
            >
              <span className="flex flex-col gap-2">
                <span className="w-fit rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-700">
                  {topic}
                </span>
                <span className="font-semibold leading-snug">{question}</span>
              </span>
              <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-hijau/10 text-brand transition-transform duration-300 group-hover:translate-x-1 group-hover:-rotate-45 dark:bg-pucuk/15">
                <Icon name="arrow" size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <CtaBand
        title="Pertanyaan pertamamu, apa?"
        body="Buat akun dengan email, lalu mulai bertanya. Riwayatmu tersimpan dan bisa dilanjutkan kapan saja."
      />
    </>
  );
}
