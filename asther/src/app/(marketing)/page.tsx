import Link from "next/link";
import Icon, { type IconName } from "@/components/site/Icon";
import {
  CtaBand,
  Eyebrow,
  SectionHead,
  delay,
} from "@/components/site/Blocks";

const SCOPES: Array<{
  title: string;
  body: string;
  tags: string[];
  icon: IconName;
}> = [
  {
    title: "Hukum Islam",
    body: "Fikih ibadah dan muamalah, lengkap dengan dalil dan pandangan mazhab bila ulama berbeda pendapat.",
    tags: ["Fikih", "Ibadah", "Muamalah"],
    icon: "scale",
  },
  {
    title: "Sejarah Islam",
    body: "Sirah Nabi, para sahabat, dan peradaban Islam, dituturkan runtut dari peristiwa ke peristiwa.",
    tags: ["Sirah", "Khulafaur Rasyidin", "Peradaban"],
    icon: "hourglass",
  },
  {
    title: "Pengetahuan Umum Islam",
    body: "Akidah, akhlak, tafsir, dan hadis, untuk pertanyaan sehari-hari yang ingin dipahami dengan benar.",
    tags: ["Tafsir", "Hadis", "Akhlak"],
    icon: "book",
  },
];

const HIGHLIGHTS: Array<[IconName, string, string]> = [
  ["bookmark", "Jawaban bersumber", "Setiap klaim diberi nomor rujukan yang bisa kamu buka dan baca kutipannya."],
  ["layers", "Atur kedalaman", "Pilih Ringkas, Seimbang, atau Mendalam sesuai waktu dan kebutuhanmu."],
  ["chat", "Pertanyaan lanjutan", "Tanya susulan tetap nyambung dengan konteks percakapan sebelumnya."],
  ["mic", "Suara", "Dikte pertanyaan dan dengarkan jawaban dibacakan, langsung dari browser."],
  ["eyeOff", "Chat sementara", "Bertanya tanpa menyimpan percakapan ke riwayat akunmu."],
  ["share", "Bagikan & ekspor", "Kirim salinan percakapan lewat tautan, atau unduh untuk catatanmu."],
];

const STEPS = [
  ["01", "Kamu bertanya", "Tulis pertanyaan seperti chat biasa, atau pakai suara."],
  ["02", "Rujukan dicari", "Hanya dari dokumen yang sudah ditinjau pengelola."],
  ["03", "Jawaban plus sumber", "Langsung ke inti, lalu penjelasan bernomor sumber."],
] as const;

const FAQ_TEASER = [
  ["Dari mana sumber jawabannya?", "Dari basis rujukan yang dikelola dan ditinjau pengelola: ayat, hadis, dan kitab ulama. Hikmah AI tidak mengarang dalil."],
  ["Apakah jawabannya bisa dijadikan fatwa?", "Tidak. Hikmah AI membantu kamu belajar. Untuk penetapan hukum pada kasus pribadi, tanyakan ke ustadz yang kamu percaya."],
  ["Bagaimana kalau sumbernya tidak ada?", "Hikmah AI akan bilang terus terang bahwa rujukannya belum cukup, bukan menebak jawaban."],
] as const;

const MARQUEE = [
  "Fikih",
  "Sirah",
  "Tafsir",
  "Hadis",
  "Akhlak",
  "Muamalah",
  "Sejarah Islam",
  "Tanya apa aja",
];

export default function HomePage() {
  return (
    <>
      {/* Cover: Malam beside Pucuk as two soft panels. */}
      <section className="px-3 pt-4 sm:pt-6">
        <div className="mx-auto grid max-w-[1400px] gap-3 lg:grid-cols-[1.15fr_1fr]">
          <div className="relative flex min-h-[560px] flex-col justify-between gap-12 overflow-hidden rounded-[36px] bg-hijau-900 px-6 py-10 text-kertas sm:px-10 sm:py-14 lg:px-14">
            <div
              aria-hidden
              className="drift-slow pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-[radial-gradient(circle,rgba(197,236,79,0.22),transparent_65%)]"
            />
            <div className="stagger-in relative flex flex-wrap gap-2">
              <span className="label-caps rounded-full bg-pucuk px-3 py-1.5 text-hijau-900">
                Teman belajar Islam
              </span>
              <span className="label-caps rounded-full border border-[#6FAE89]/60 px-3 py-[5px] font-semibold text-[#CFE4D7]">
                Bahasa Indonesia · Berdalil
              </span>
            </div>
            <div className="stagger-in relative flex flex-col gap-7">
              <h1 className="font-display text-[clamp(44px,8vw,104px)] leading-[0.88]">
                Tanya apa aja soal Islam.
              </h1>
              <p className="max-w-[24ch] text-[clamp(22px,2.6vw,34px)] leading-[1.15] font-semibold tracking-[-0.02em]">
                Jawabannya{" "}
                <span className="rounded-xl bg-pucuk px-2 whitespace-nowrap text-hijau-900">
                  ada dalilnya.
                </span>
              </p>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href="/chat"
                  className="press inline-flex items-center justify-between gap-8 rounded-full bg-pucuk px-6 py-4 text-[15px] font-extrabold text-hijau-900 hover:bg-[#D4F27A]"
                >
                  Mulai bertanya
                  <Icon name="arrowUpRight" size={18} />
                </Link>
                <Link
                  href="/fitur"
                  className="press inline-flex items-center justify-center rounded-full border-2 border-kertas/70 px-6 py-[14px] text-[15px] font-extrabold hover:border-kertas hover:bg-kertas hover:text-hijau-900"
                >
                  Lihat semua fitur
                </Link>
              </div>
            </div>
            <p className="relative max-w-[46ch] text-sm leading-relaxed text-[#A6CDB5]">
              Untuk Gen Z yang penasaran, pelajar dan santri, pengajar, sampai
              keluarga milenial. Santai di permukaan, serius di isi.
            </p>
          </div>

          <div className="relative flex min-h-[440px] items-center justify-center overflow-hidden rounded-[36px] bg-pucuk p-10">
            <div
              dir="rtl"
              lang="ar"
              aria-hidden
              className="font-kufi drift-slow pointer-events-none absolute -right-[4%] -bottom-[8%] text-[clamp(150px,20vw,320px)] leading-none font-black text-[#B2DA3A] select-none"
            >
              حكمة
            </div>
            <div
              aria-hidden
              className="float-slow relative aspect-square w-[min(58%,290px)]"
            >
              <span className="brand-symbol block size-full bg-hijau-900" />
            </div>
            {/* Playful stickers that pop in around the symbol. */}
            <span
              aria-hidden
              className="pop-in absolute top-[16%] left-[8%] -rotate-6 rounded-full bg-hijau-900 px-4 py-2 text-sm font-extrabold text-kertas shadow-lg"
              style={delay(4)}
            >
              Fikih
            </span>
            <span
              aria-hidden
              className="pop-in absolute top-[22%] right-[7%] rotate-[5deg] rounded-2xl bg-[#FAF3E3] px-3.5 py-2 text-[13px] font-bold text-[#5C4516] shadow-lg"
              style={delay(6)}
            >
              QS. Al-Baqarah: 185
            </span>
            <span
              aria-hidden
              className="pop-in absolute bottom-[18%] left-[12%] rotate-[4deg] rounded-2xl bg-[#fff] px-3.5 py-2 text-[13px] font-bold text-hijau-900 shadow-lg"
              style={delay(8)}
            >
              HR. Muslim
            </span>
            <span
              aria-hidden
              className="pop-in absolute right-[14%] bottom-[30%] -rotate-3 rounded-full bg-[#E8F2EC] px-3.5 py-1.5 text-[12px] font-bold text-[#083D26] shadow-lg"
              style={delay(10)}
            >
              Khilafiyah
            </span>
            <span className="label-caps absolute top-6 left-7 text-hijau-900/80">
              حكمة · Kebijaksanaan
            </span>
          </div>
        </div>
      </section>

      <div className="relative z-10 -my-2 overflow-hidden py-10" aria-hidden>
        <div className="-rotate-[1.5deg] scale-x-[1.03] bg-tinta text-kertas shadow-[0_18px_40px_-20px_rgba(32,30,29,0.6)]">
          <div className="hk-marquee flex w-max py-4">
            {[0, 1].map((row) => (
              <div key={row} className="flex flex-none">
                {MARQUEE.map((word, i) => (
                  <span
                    key={word}
                    className={
                      "font-display flex items-center gap-7 pr-7 text-[28px] whitespace-nowrap " +
                      (i % 2 ? "text-pucuk" : "text-kertas")
                    }
                  >
                    {word}
                    <span className="block size-3 rounded-full bg-emas" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHead
          eyebrow="Ruang lingkup"
          title="Satu teman, tiga bidang."
          lead="Cepat seperti chat, teliti seperti kitab. Hikmah AI fokus pada tiga bidang dan menolak pertanyaan di luar itu dengan sopan."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {SCOPES.map((scope, i) => (
            <article
              key={scope.title}
              data-reveal
              style={delay(i + 1)}
              className="surface-card lift flex flex-col gap-5 p-7"
            >
              <span className="wiggle-hover flex size-14 items-center justify-center rounded-2xl bg-hijau/10 text-brand dark:bg-pucuk/15">
                <Icon name={scope.icon} size={26} />
              </span>
              <h3 className="font-heading text-2xl">{scope.title}</h3>
              <p className="flex-1 text-[15px] leading-relaxed text-stone-600">
                {scope.body}
              </p>
              <div className="flex flex-wrap gap-2">
                {scope.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-stone-100 px-3 py-1 text-[13px] font-bold text-stone-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
        <SectionHead
          eyebrow="Fitur sorotan"
          title="Lebih dari sekadar tanya jawab."
          lead="Alat kecil yang bikin belajar lebih nyaman, dari memilih kedalaman jawaban sampai membagikan percakapan."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map(([icon, title, body], i) => (
            <div
              key={title}
              data-reveal
              style={delay((i % 3) + 1)}
              className="surface-card lift flex gap-4 p-6"
            >
              <span className="wiggle-hover flex size-12 shrink-0 items-center justify-center rounded-2xl bg-pucuk text-hijau-900">
                <Icon name={icon} size={22} />
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
        <Link
          data-reveal
          href="/fitur"
          className="press mt-8 inline-flex items-center gap-3 rounded-full border border-stone-900/15 px-6 py-3 text-sm font-extrabold hover:border-stone-900 hover:bg-stone-900 hover:text-stone-50"
        >
          Lihat semua fitur
          <Icon name="arrow" size={16} />
        </Link>
      </section>

      <section className="px-3">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 rounded-[40px] bg-stone-100 px-6 py-14 sm:px-12 sm:py-20 lg:grid-cols-2 lg:px-16">
          <div data-reveal className="flex flex-col gap-6">
            <Eyebrow>Contoh jawaban</Eyebrow>
            <h2 className="font-display text-4xl leading-[0.95] sm:text-6xl">
              Jawaban dulu. Dalil menyusul.
            </h2>
            <p className="max-w-lg text-[17px] leading-[1.6] text-stone-700">
              Kalimat pertama langsung menjawab. Setelahnya, penjelasan yang
              runtut dengan nomor sumber yang bisa kamu buka satu per satu.
              Kalau ulama berbeda pendapat, kami sebutkan pandangannya.
            </p>
            <ul className="grid gap-3 text-[15px] font-semibold">
              {[
                "Sumber selalu ditampilkan: ayat, perawi hadis, atau kitab",
                "Beda pendapat ditandai Khilafiyah",
                "Kasus pribadi diarahkan ke ustadz tepercaya",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 block size-3 shrink-0 rounded-full bg-emas" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <figure
            aria-label="Contoh percakapan Hikmah AI"
            className="relative mx-auto w-full max-w-md"
          >
            <div
              aria-hidden
              className="drift-slow absolute -inset-6 rounded-[48px] bg-[radial-gradient(circle_at_30%_20%,rgba(197,236,79,0.45),transparent_60%)]"
            />
            <div className="relative overflow-hidden rounded-[30px] bg-kertas text-tinta shadow-[0_30px_60px_-30px_rgba(6,42,27,0.55)] ring-1 ring-tinta/10">
              <div className="flex items-center gap-2 border-b border-tinta/10 px-5 py-4">
                <span className="font-heading text-[15px]">
                  Paylater itu riba?
                </span>
                <span className="ml-auto rounded-full bg-tinta px-2.5 py-1 text-[10px] font-extrabold tracking-[0.06em] text-kertas">
                  MUAMALAH
                </span>
              </div>
              <div className="flex flex-col gap-4 p-5">
                <p
                  data-reveal
                  style={delay(1)}
                  className="max-w-[85%] self-end rounded-[20px] rounded-br-md bg-hijau px-4 py-2.5 text-sm text-kertas"
                >
                  Paylater itu riba nggak sih?
                </p>
                <div
                  data-reveal
                  style={delay(4)}
                  className="flex flex-col gap-2.5 rounded-[20px] rounded-tl-md bg-[#fff] p-4 text-sm leading-[1.55] shadow-sm"
                >
                  <p>
                    <strong>Tergantung akadnya.</strong> Kalau ada tambahan
                    bayaran karena keterlambatan atau bunga atas pinjaman,
                    mayoritas ulama menggolongkannya riba.
                  </p>
                  <p>
                    Kalau harga cicilan sudah disepakati di awal dan tidak
                    bertambah, sebagian ulama membolehkannya sebagai jual beli
                    kredit.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[#FAF3E3] px-2.5 py-1 text-[11px] font-bold text-[#5C4516]">
                      QS. Al-Baqarah: 275
                    </span>
                    <span className="rounded-full bg-[#FAF3E3] px-2.5 py-1 text-[11px] font-bold text-[#5C4516]">
                      Fatwa DSN-MUI
                    </span>
                    <span className="rounded-full bg-[#E8F2EC] px-2.5 py-1 text-[11px] font-bold text-[#083D26]">
                      Khilafiyah
                    </span>
                  </div>
                </div>
              </div>
              <div className="m-3 mt-0 flex items-center gap-2 rounded-full bg-[#fff] p-1.5 pl-4 ring-1 ring-tinta/10">
                <span className="flex-1 text-sm text-[#7D7979]">
                  Tanya lanjutan…
                </span>
                <span className="flex size-10 items-center justify-center rounded-full bg-hijau text-pucuk">
                  <Icon name="send" size={18} />
                </span>
              </div>
            </div>
          </figure>
        </div>
      </section>

      <section className="px-3 pt-3">
        <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-tinta px-6 py-16 text-kertas sm:px-12 sm:py-20 lg:px-16">
          <div
            data-reveal
            className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          >
            <div className="flex flex-col gap-3">
              <Eyebrow tone="dark">Cara kerja</Eyebrow>
              <h2 className="font-display text-4xl leading-[0.95] sm:text-5xl">
                Tiga langkah, satu janji.
              </h2>
            </div>
            <p className="max-w-md text-[15px] leading-relaxed text-[#BAB6B6]">
              Hikmah AI tidak mengarang dalil. Jawaban disusun dari rujukan
              terkelola yang sudah melewati peninjauan.
            </p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map(([no, title, body], i) => (
              <li
                key={no}
                data-reveal
                style={delay(i + 1)}
                className="lift flex flex-col gap-4 rounded-[28px] bg-white/[0.06] p-7 ring-1 ring-white/10"
              >
                <span className="font-display text-6xl text-pucuk">{no}</span>
                <h3 className="font-heading text-2xl">{title}</h3>
                <p className="text-[15px] leading-relaxed text-[#D7D3D3]">
                  {body}
                </p>
              </li>
            ))}
          </ol>
          <Link
            data-reveal
            href="/cara-kerja"
            className="press mt-8 inline-flex items-center gap-3 rounded-full bg-kertas px-6 py-3 text-sm font-extrabold text-tinta hover:bg-pucuk hover:text-hijau-900"
          >
            Pelajari cara kerjanya
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHead
          eyebrow="Sering ditanyakan"
          title="Biar nggak ragu."
          lead="Jawaban singkat untuk pertanyaan yang paling sering muncul. Selengkapnya ada di halaman FAQ."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FAQ_TEASER.map(([q, a], i) => (
            <div
              key={q}
              data-reveal
              style={delay(i + 1)}
              className="surface-card flex flex-col gap-3 p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-[#FAF3E3] text-[#5C4516]">
                <Icon name="help" size={20} />
              </span>
              <h3 className="font-heading text-lg">{q}</h3>
              <p className="text-[14px] leading-relaxed text-stone-600">{a}</p>
            </div>
          ))}
        </div>
        <Link
          data-reveal
          href="/faq"
          className="press mt-8 inline-flex items-center gap-3 rounded-full border border-stone-900/15 px-6 py-3 text-sm font-extrabold hover:border-stone-900 hover:bg-stone-900 hover:text-stone-50"
        >
          Baca semua FAQ
          <Icon name="arrow" size={16} />
        </Link>
      </section>

      <CtaBand
        eyebrow="Pertanyaan minggu ini"
        title="Boleh nggak salat pakai kaus kaki?"
        body="Tanyakan langsung, lalu cek sendiri rujukannya. Pertanyaan apa pun boleh."
      />
    </>
  );
}
