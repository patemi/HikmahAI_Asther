import { PageHero } from "@/components/site/Blocks";
export const dynamic = "force-dynamic";
export const metadata = { title: "Privasi percakapan — Hikmah AI" };
export default function PrivacyPage() {
  const retention = Number(process.env.CHAT_RETENTION_DAYS || 0);
  return (
    <>
      <PageHero
        eyebrow="Privasi"
        title="Privasi percakapan"
        lead="Apa yang disimpan, siapa yang bisa melihatnya, dan bagaimana kamu mengendalikannya. Ditulis singkat dan apa adanya."
      />
      <article className="mx-auto grid max-w-3xl gap-4 px-4 py-14 leading-relaxed sm:px-6 sm:py-20">
        <section data-reveal className="surface-card p-6 sm:p-7">
          <h2 className="font-heading text-xl">Data yang disimpan</h2>
          <p className="mt-2 text-[15px] text-stone-700">
            Akun menyimpan email, nama panggilan, dan hash password. Riwayat
            mencakup pertanyaan, jawaban, waktu percakapan, referensi yang
            digunakan, serta informasi model dan penggunaan token. Jika kamu
            mengirim gambar melalui integrasi yang mendukungnya, URL dan hasil
            analisisnya dapat ikut tersimpan.
          </p>
        </section>
        <section data-reveal className="surface-card p-6 sm:p-7">
          <h2 className="font-heading text-xl">Pemrosesan oleh layanan AI</h2>
          <p className="mt-2 text-[15px] text-stone-700">
            Pertanyaan, sebagian riwayat percakapan, rujukan yang relevan, dan
            gambar jika ada dikirim ke penyedia AI yang dikonfigurasi pengelola.
            Kebijakan penyimpanan dan pemrosesan penyedia tersebut berlaku
            terhadap data yang dikirim. Hindari mengirim password, identitas
            resmi, dan informasi pribadi yang tidak diperlukan.
          </p>
        </section>
        <section data-reveal className="surface-card p-6 sm:p-7">
          <h2 className="font-heading text-xl">Akses pengelola</h2>
          <p className="mt-2 text-[15px] text-stone-700">
            Pengelola yang memiliki hak admin dapat membaca riwayat untuk
            mengelola layanan dan memeriksa kesalahan. Pengguna biasa hanya
            dapat membuka percakapannya sendiri. Laporan jawaban menyertakan
            pertanyaan, jawaban, dan referensinya agar pengelola dapat meninjau
            laporan tersebut.
          </p>
        </section>
        <section data-reveal className="surface-card p-6 sm:p-7">
          <h2 className="font-heading text-xl">Penyimpanan dan penghapusan</h2>
          <p className="mt-2 text-[15px] text-stone-700">
            {Number.isInteger(retention) && retention > 0
              ? "Deployment ini menerapkan batas simpan " +
                retention +
                " hari. Pembersihan terjadwal menghapus pesan lama saat aplikasi berjalan."
              : "Riwayat disimpan sampai kamu menghapus percakapan atau pengelola menghapusnya untuk pemeliharaan layanan. Penghapusan otomatis berdasarkan usia belum diaktifkan pada deployment ini."}{" "}
            Kamu bisa menghapus percakapan melalui daftar chat. Penghapusan
            juga menghapus laporan yang terkait dengan pesan tersebut pada
            database aktif. Salinan cadangan dan data yang sudah dikirim ke
            penyedia AI mengikuti kebijakan pengelolaan masing-masing.
          </p>
        </section>
        <section data-reveal className="surface-card p-6 sm:p-7">
          <h2 className="font-heading text-xl">Chat sementara, lampiran, dan suara</h2>
          <p className="mt-2 text-[15px] text-stone-700">
            Chat sementara tidak disimpan sebagai percakapan atau pesan pada
            database Hikmah AI. Konteksnya berada pada halaman browser sampai
            kamu beralih chat atau memuat ulang. Penyedia AI tetap menerima
            pesan untuk menjawab; kuota dan catatan penggunaan teknis tetap
            berlaku. Lampiran .txt dan .md dikirim sebagai konteks, dan ikut
            disimpan pada chat biasa. Lampiran bukan sumber keagamaan yang telah
            ditinjau. Dikte suara dapat mengirim audio ke layanan browser;
            pembacaan jawaban menggunakan layanan suara perangkat atau browser.
          </p>
        </section>
        <section data-reveal className="surface-card p-6 sm:p-7">
          <h2 className="font-heading text-xl">Tautan berbagi dan arsip</h2>
          <p className="mt-2 text-[15px] text-stone-700">
            Tautan berbagi menampilkan salinan pesan dan kutipan sumber kepada
            siapa pun yang memiliki tautan. Periksa pratinjau sebelum
            membuatnya. Nama akun, email, serta isi berkas lampiran tidak
            disertakan sebagai data terpisah, tetapi informasi yang kamu tulis
            dalam pesan atau yang dikutip jawaban tetap terlihat. Pesan baru
            tidak ditambahkan otomatis. Cabut tautan melalui dialog Bagikan
            untuk menghentikan akses; salinan yang sudah disimpan orang lain
            tidak dapat ditarik kembali. Menghapus percakapan juga menghapus
            tautannya. Arsip hanya menyembunyikan chat dari daftar utama dan
            tidak menghapus data atau mencabut tautan.
          </p>
        </section>
        <section data-reveal className="surface-card p-6 sm:p-7">
          <h2 className="font-heading text-xl">Batas penggunaan jawaban</h2>
          <p className="mt-2 text-[15px] text-stone-700">
            Hikmah AI membantu pembelajaran keislaman. Periksa kutipan dan
            konteks sumber yang ditampilkan. Untuk penetapan hukum pada keadaan
            pribadi, tanyakan ke ustadz yang kamu percaya. Gunakan fitur
            pelaporan jika menemukan kesalahan.
          </p>
        </section>
      </article>
    </>
  );
}
