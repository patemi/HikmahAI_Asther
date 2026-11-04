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
  title: "Tentang — Hikmah AI",
  description:
    "Arti nama Hikmah, untuk siapa Hikmah AI dibuat, empat sifat yang kami jaga, dan prinsip dalam menyampaikan ilmu.",
};

const AUDIENCE: Array<[IconName, string, string]> = [
  ["help", "Gen Z yang penasaran", "Punya banyak pertanyaan tapi sungkan bertanya langsung? Di sini pertanyaan apa pun boleh."],
  ["book", "Pelajar dan santri", "Mengulang pelajaran, mencari dalil, atau memahami istilah yang belum jelas."],
  ["users", "Ustadz dan pengajar", "Menyiapkan bahan kajian lebih cepat, lengkap dengan rujukan yang bisa diperiksa."],
  ["heart", "Keluarga milenial", "Menjawab pertanyaan sehari-hari di rumah, dari ibadah sampai muamalah."],
];

const VALUES = [
  ["A", "Kalem", "Tenang, tidak menghakimi. Pertanyaan apa pun boleh."],
  ["B", "Cerdas", "To the point. Yang rumit dibikin runtut."],
  ["C", "Hangat", "Seperti kakak tingkat yang sabar, bukan mesin pencari."],
  ["D", "Berdalil", "Al-Qur'an, hadis, dan kitab ulama. Selalu disebutkan."],
] as const;

const PRINCIPLES: Array<[string, string]> = [
  ["Jawaban dulu", "Kalimat pertama menjawab. Penjelasan menyusul, tanpa berbelit."],
  ["Sumber selalu ada", "Ayat, perawi hadis, atau kitab. Tanpa sumber yang kuat, kami bilang terus terang."],
  ["Adil soal beda pendapat", "Pandangan mazhab disebutkan, bukan disembunyikan. Perbedaan ditandai Khilafiyah."],
  ["Tahu batas", "Untuk kasus pribadi, kami arahkan ke ustadz yang kamu percaya."],
];

export default function TentangPage() {
  return (
    <>
      <PageHero
        eyebrow="Tentang"
        title="Cepat seperti chat, teliti seperti kitab."
        lead="Hikmah AI adalah teman belajar untuk Hukum Islam, Sejarah Islam, dan Pengetahuan Umum Islam. Santai di permukaan, serius di isi."
      />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.1fr]">
        <div
          data-reveal
          className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[36px] bg-pucuk"
        >
          <span
            dir="rtl"
            lang="ar"
            className="font-kufi float-slow text-[clamp(96px,14vw,180px)] leading-none font-black text-hijau-900"
          >
            حكمة
          </span>
          <span className="label-caps absolute bottom-5 left-6 text-hijau-900/80">
            Hikmah · Kebijaksanaan
          </span>
        </div>
        <div data-reveal style={delay(2)} className="flex flex-col gap-5">
          <Eyebrow>Arti nama</Eyebrow>
          <h2 className="font-display text-4xl leading-[0.95] sm:text-5xl">
            Ilmu yang dipahami, lalu dipakai dengan tepat.
          </h2>
          <p className="text-[17px] leading-[1.65] text-stone-700">
            <em>Hikmah</em> berarti kebijaksanaan: ilmu yang dipahami dengan
            benar lalu dipakai di tempat yang tepat. Itu juga yang ingin kami
            bantu: bukan sekadar memberi jawaban, tapi membantumu memahami
            alasan dan dalil di baliknya.
          </p>
          <p className="rounded-3xl bg-[#FAF3E3] px-6 py-5 text-[19px] leading-snug font-semibold text-[#5C4516] dark:bg-[#2b2914] dark:text-[#e5c98a]">
            Janji kami: tidak ada jawaban tanpa sumber. Kalau ragu, kami bilang
            ragu.
          </p>
        </div>
      </section>

      <section className="px-3">
        <div className="mx-auto max-w-[1400px] rounded-[40px] bg-stone-100 px-6 py-16 sm:px-12 sm:py-20 lg:px-16">
          <SectionHead
            eyebrow="Untuk siapa"
            title="Satu suara untuk semuanya."
            lead="Dari yang baru mulai belajar sampai yang mengajar. Bahasanya santai, isinya tetap serius."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCE.map(([icon, title, body], i) => (
              <div
                key={title}
                data-reveal
                style={delay(i + 1)}
                className="surface-card lift flex flex-col gap-4 p-6"
              >
                <span className="wiggle-hover flex size-12 items-center justify-center rounded-2xl bg-pucuk text-hijau-900">
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
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHead
          eyebrow="Sifat kami"
          title="Kalem, cerdas, hangat, berdalil."
          lead="Empat sifat yang kami jaga di setiap jawaban, dari sapaan pertama sampai rujukan terakhir."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(([letter, name, body], i) => (
            <div
              key={name}
              data-reveal
              style={delay(i + 1)}
              className="surface-card lift flex flex-col gap-4 p-6"
            >
              <span className="wiggle-hover flex size-12 items-center justify-center rounded-full bg-hijau font-display text-lg text-kertas dark:bg-pucuk dark:text-hijau-900">
                {letter}
              </span>
              <h3 className="font-heading text-xl">{name}</h3>
              <p className="text-[15px] leading-relaxed text-stone-600">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-3">
        <div className="mx-auto max-w-[1400px] rounded-[40px] bg-tinta px-6 py-16 text-kertas sm:px-12 sm:py-20 lg:px-16">
          <div data-reveal className="flex flex-col gap-3">
            <Eyebrow tone="dark">Cara kami bicara</Eyebrow>
            <h2 className="font-display max-w-[18ch] text-4xl leading-[0.95] sm:text-5xl">
              Santai di sapaan, serius di dalil.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {PRINCIPLES.map(([title, body], i) => (
              <div
                key={title}
                data-reveal
                style={delay((i % 2) + 1)}
                className="lift flex gap-4 rounded-[26px] bg-white/[0.06] p-6 ring-1 ring-white/10"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pucuk text-hijau-900">
                  <Icon name="check" size={16} />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-heading text-lg">{title}</h3>
                  <p className="text-[14px] leading-relaxed text-[#D7D3D3]">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div data-reveal className="mt-10 grid gap-3 md:grid-cols-3">
            {[
              ["Terlalu kaku", "\"Berdasarkan ketentuan yang berlaku, Anda diwajibkan untuk menunaikan zakat fitrah sebelum pelaksanaan salat Idulfitri.\"", false],
              ["Pas", "\"Zakat fitrah dibayar sebelum salat Idulfitri. Paling aman satu atau dua hari sebelumnya, seperti kebiasaan para sahabat.\"", true],
              ["Terlalu santai", "\"Santuy bestie, bayar zakatnya kapan aja yang penting sebelum lebaran yaa!!\"", false],
            ].map(([label, quote, good]) => (
              <figure
                key={label as string}
                className={
                  "flex flex-col gap-3 rounded-[26px] p-6 " +
                  (good
                    ? "bg-pucuk text-hijau-900"
                    : "bg-white/[0.04] text-[#BAB6B6] ring-1 ring-white/10")
                }
              >
                <span className="label-caps">{label}</span>
                <blockquote className="text-[15px] leading-relaxed">
                  {quote}
                </blockquote>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Kenalan langsung, yuk."
        body="Cara terbaik memahami Hikmah AI adalah mencobanya. Mulai dari satu pertanyaan."
      />
    </>
  );
}
