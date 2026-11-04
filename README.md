# HikmahAI

Asisten edukasi keislaman berbasis LLM dan Retrieval-Augmented Generation (RAG), dengan aplikasi chat, pengelolaan sumber, evaluasi jawaban, dan API integrasi.

Ruang lingkup: hukum Islam, sejarah Islam, serta pengetahuan umum Islam. RAG menyediakan rujukan terkelola; ketepatan materi tetap memerlukan kurasi dan peninjauan ahli.

## Kemampuan

- Chat dengan sesi akun, riwayat milik pengguna, streaming, dan pilihan kedalaman jawaban.
- Dashboard khusus admin; pemeriksaan izin juga dilakukan pada halaman, Server Actions, dan endpoint sensitif.
- Dokumen teks / JSON melalui alur **draft → dalam tinjauan → terbit**. Hanya dokumen terbit yang sudah ditinjau digunakan dalam retrieval.
- Pencarian semantik dan kata kunci dengan ambang relevansi. Tidak ada fallback yang memaksakan dokumen di bawah ambang.
- Kutipan menyimpan isi, identitas sumber, penulis, lokasi rujukan, versi, dan peninjau pada saat jawaban dibuat.
- Mode wajib sumber menahan jawaban ketika rujukan tidak memadai, termasuk saat tampilan sitasi disembunyikan.
- Laporan jawaban dengan snapshot percakapan dan antrean tinjauan admin.
- Evaluasi jawaban aktual: dukungan sumber, ketepatan terhadap acuan, kelengkapan, ketepatan kutipan, dan perilaku menolak / menjawab.
- Kuota request dan cadangan anggaran token melalui PostgreSQL, serta pemantauan pemakaian provider.
- Halaman privasi dan penghapusan riwayat beserta laporan terkait.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL dengan pgvector, Bun. Klien AI mendukung OpenAI, endpoint kompatibel, dan konfigurasi Gemini.

## Menjalankan secara lokal

1. Siapkan PostgreSQL dengan ekstensi pgvector; konfigurasi contoh tersedia pada `postgres/`.
2. Salin `.env.example` ke `asther/.env`. Isi kredensial database, identitas pengelola, password yang kuat, dan kunci penyedia AI. Model harus tersedia pada penyedia yang dipilih.
3. Dari direktori `asther/`:

```sh
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

Buka `http://localhost:3000`. Dashboard pengelola berada di `/login`; pengguna biasa mendaftar melalui `/chat`.

Untuk menjalankan PostgreSQL saja melalui Docker, salin `.env.example` ke `.env` pada root, isi `POSTGRES_PASSWORD`, lalu jalankan dari root:

```sh
docker compose --env-file .env -f postgres/docker-compose.yaml up -d
```

Samakan password pada `DATABASE_URL` di `asther/.env` dengan `POSTGRES_PASSWORD`. Jika password mengandung karakter khusus URL, lakukan percent-encoding pada bagian password di `DATABASE_URL`.

Bootstrap hanya memberikan peran admin kepada akun yang cocok dengan `DEFAULT_USERNAME` ketika belum ada admin. Password akun lama dipertahankan. Pembuatan admin baru memerlukan password minimal 12 karakter. Registrasi publik selalu menghasilkan peran pengguna biasa.

## Ruang percakapan HikmahAI

Halaman utama langsung membuka `/chat`. Setelah masuk, pengguna dapat memulai percakapan, mencari riwayat berdasarkan judul atau isi, mengganti judul, menyematkan, dan menghapus percakapan. Tautan `/chat?c=<id>` membuka percakapan tertentu setelah kepemilikannya diperiksa server.

Jawaban tampil bertahap dengan pilihan kedalaman penjelasan. Pengguna dapat menghentikan respons, menyalin, membuat ulang jawaban terakhir, memeriksa panel sumber, dan melaporkan kekeliruan. Respons yang dihentikan tetap tersimpan. Pembuatan ulang menyimpan versi lama untuk pemeriksaan pengelola dan menampilkan versi aktif pada riwayat pengguna maupun API integrasi. Gunakan `bun run db:migrate` untuk menambahkan kolom pendukungnya.

HikmahAI menangani sapaan secara langsung dan memakai konteks pertanyaan sebelumnya untuk tindak lanjut singkat. Pengetahuan keislaman tetap mengikuti kebijakan rujukan: hanya dokumen terbit yang sudah ditinjau yang digunakan. Saat sumber belum memadai, sistem menjelaskan keterbatasan tersebut. Tema terang dan gelap, sidebar mobile, serta navigasi keyboard tersedia pada ruang percakapan.

Pengalaman percakapan memakai tata letak monokrom dengan composer di tengah saat chat baru dan di bawah saat percakapan berjalan. Fitur tambahan:

- **Edit pertanyaan** membuka cabang dengan konteks sebelumnya; percakapan asli tetap utuh. Cabang dibatasi hingga 500 pesan sebelumnya.
- **Chat sementara** mengirim konteks dari halaman browser, tanpa menyimpan peserta atau pesan pada database HikmahAI. Konteks hilang saat berganti chat atau memuat ulang. Kuota serta kebijakan penyedia AI tetap berlaku.
- **Arsip** menyembunyikan percakapan dari daftar utama; pulihkan dari menu Arsip. Arsip tidak mencabut tautan berbagi.
- **Bagikan** menyediakan pratinjau pesan dan kutipan sumber. Tautan publik menyimpan salinan, tidak mengikuti pesan baru otomatis, dan dapat diperbarui atau dicabut oleh pemilik. Pembaruan ditolak jika isi berbeda dari pratinjau. Email akun dan isi berkas tidak ditambahkan ke salinan, tetapi data yang tertulis pada pesan atau jawaban tetap terlihat. Halaman berbagi meminta mesin pencari untuk tidak mengindeksnya. Batas berbagi: 500 pesan dan 1 MB.
- **Ekspor** mengunduh percakapan aktif, lampiran, dan daftar rujukan sebagai Markdown (hingga 2.000 pesan).
- **Lampiran** mendukung hingga 3 berkas UTF-8 `.txt` / `.md`, masing-masing maksimal 64 KB dan 16.000 karakter, total maksimal 20.000 karakter. Lampiran adalah konteks pengguna yang belum ditinjau, bukan pengganti rujukan terkelola. PDF, gambar lokal, dan format lainnya belum didukung oleh composer.
- **Penilaian jawaban** menyimpan suara membantu / kurang membantu, hanya untuk pemilik pesan. Laporan terperinci tetap tersedia melalui menu jawaban.
- **Suara** menggunakan pembacaan teks dan dikte browser. Dukungan suara bergantung pada browser, perangkat, izin mikrofon, serta koneksi. Ini bukan mode percakapan suara real time.
- **Pengaturan** mengelola tema, gaya jawaban, arsip, serta informasi privasi. Tema dan gaya jawaban disimpan pada browser. Menu gaya jawaban mengubah kedalaman penjelasan, bukan mengganti model penyedia.

Pintasan: `Ctrl` / `⌘` + `K` untuk mencari, `Ctrl` / `⌘` + `Shift` + `O` untuk chat baru, `Shift` + `Enter` untuk baris baru.

## Upgrade database lama

```sh
cd asther
bun run db:migrate
bun run db:seed
```

Migrasi bersifat aditif, dijalankan dalam transaksi dan dapat diulang, termasuk pada database lama yang dibuat menggunakan `db:push`. Migrasi tidak menghapus akun, percakapan, atau dokumen.

Perubahan yang perlu diperhatikan:

- Dokumen lama masuk sebagai draft. Periksa identitas sumber dan isi, ajukan tinjauan, lalu terbitkan.
- Kewajiban rujukan diaktifkan saat upgrade. Aktifkan RAG dan terbitkan sumber yang sesuai agar sistem dapat menjawab.
- Vektor lama yang belum memiliki identitas model tidak dicampur dengan vektor model lain. Indeks ulang dokumen untuk mengaktifkan pencarian semantik; pencarian kata kunci tetap tersedia untuk dokumen terbit.
- Kutipan historis hanya tersedia untuk jawaban baru yang menyimpannya. Sistem tidak mengarang kutipan untuk jawaban lama.
- Kasus evaluasi lama perlu jawaban acuan dan konfirmasi peninjauan sebelum dijalankan ulang. Hasil lama ditandai sebagai evaluasi lama.

## API

`POST /api/chat` menggunakan `Authorization: Bearer <token>`. Atur token pada dashboard dan simpan token tersebut; hash yang tersimpan tidak dapat ditampilkan ulang. Mengganti token tidak memengaruhi autentikasi chat web.

```json
{
  "participantId": "external-user-001",
  "message": "Apa pengertian zakat?",
  "userName": "Pembaca",
  "saveHistory": true,
  "responseDepth": "standar",
  "includeCitations": true
}
```

`responseDepth`: `ringkas`, `standar`, atau `mendalam`. `imageUrl` opsional berupa URL HTTPS publik. `includeCitations` merupakan preferensi tampilan dan tidak dapat melewati kebijakan wajib sumber. Identitas pemilik chat web diambil dari sesi, bukan dari payload.

`attachments` opsional berupa array `{ "name": "catatan.md", "content": "Teks lampiran" }` dengan batas yang sama seperti composer. Pada `saveHistory: false`, `history` boleh berisi hingga 12 pesan dengan role `user` / `assistant` (maksimal 60.000 karakter seluruhnya) untuk konteks sementara. Untuk chat tersimpan, server selalu memakai riwayat database dan mengabaikan `history` dari klien.

Respons menggunakan Server-Sent Events:

```text
data: {"type":"turn","userMessageId":"..."}

data: {"type":"citations","citations":[...],"notice":null}

data: {"content":"Potongan jawaban"}

data: {"type":"metadata","messageId":"...","userMessageId":"...","provenance":{...}}

data: [DONE]
```

Jika penyimpanan atau streaming gagal setelah koneksi terbuka, server mengirim event `type: "error"`. Klien harus memeriksa event ini dan penanda `[DONE]`. Laporan hanya dapat dibuat untuk ID jawaban yang sudah tersimpan dan dimiliki pengguna.

`GET /api/chat/history?participantId=...&limit=50` dan `DELETE /api/chat/history` ditujukan untuk integrasi server tepercaya dengan bearer token. Token integrasi jangan ditanam dalam aplikasi publik. Dokumentasi tambahan tersedia pada dashboard.

## Kuota dan privasi

- `CHAT_REQUESTS_PER_MINUTE`: default 10 per identitas.
- `CHAT_REQUESTS_PER_DAY`: default 100 per periode 24 jam.
- `MODEL_REQUESTS_PER_DAY`: default 2000 percobaan provider untuk seluruh aplikasi.
- `MODEL_TOKENS_PER_DAY`: default 500000 cadangan anggaran token untuk seluruh aplikasi.
- Klasifikasi, embedding, generasi, analisis gambar, dan evaluasi menggunakan anggaran provider yang sama. Percobaan gagal tetap dihitung. Cadangan token bersifat konservatif, bukan estimasi tagihan.
- `TRUST_PROXY=true` hanya jika proxy deployment menimpa header IP dari klien. Tanpa itu, pembatasan berdasarkan jaringan memakai satu identitas bersama.
- `CORS_ORIGIN` mengaktifkan akses browser untuk origin integrasi yang ditentukan. Jangan memakai wildcard untuk endpoint sesi pengguna.
- `APP_URL` merupakan URL aplikasi; `LLM_API_BASE` merupakan endpoint penyedia model. Hindari mencampur keduanya.
- `CHAT_RETENTION_DAYS=0` mempertahankan riwayat sampai dihapus. Nilai positif secara eksplisit mengaktifkan pembersihan pesan lama saat runtime Node aplikasi berjalan, setiap jam. Untuk serverless / pekerjaan terjadwal, jalankan `bun run maintenance` melalui scheduler.
- Penghapusan percakapan menghapus laporan terkait dari database aktif. Kebijakan backup dan penyedia AI dikelola secara terpisah.

## Docker

Dari direktori root, isi `.env` untuk Docker Compose dan jalankan:

```sh
docker compose up -d --build
```

Entrypoint menjalankan migrasi aditif dan bootstrap sebelum server. Backup database tetap diperlukan sebagai prosedur operasional deployment.

## Validasi

Dari `asther/`:

```sh
bun run test
bun run test:integration
bun run typecheck
bun run lint
bun run build
```

Pengujian integrasi menggunakan skema PostgreSQL sementara dengan nama acak, memeriksa migrasi database baru dan lama, lalu menghapus skema pengujian. Pengujian ini memerlukan izin membuat skema pada database pengembangan dan tidak mengakses model AI nyata.

`bun scripts/smoke-server.ts` menyediakan server browser di port 3100 dengan database sementara dan provider AI lokal untuk pengujian antarmuka. Akun contoh pengujian hanya dibuat pada skema sementara. Hentikan server dengan Ctrl+C untuk membersihkan datanya.

## Berkas yang masuk GitHub

Repositori menyimpan kode aplikasi, aset pada `asther/public/`, pengujian, skrip, konfigurasi Docker, `bun.lock`, migrasi SQL beserta `drizzle/meta/`, dan dokumentasi teknis. Metadata Drizzle diperlukan untuk menjaga urutan dan perubahan skema. Workflow pada `.github/` juga boleh dilacak.

`.gitignore` pada root mengabaikan kredensial dan semua `.env` lokal, dependensi, hasil build, cache, log, laporan pengujian, database lokal, backup, serta konfigurasi dan sesi agen AI. Hanya template `.env.example`, `.env.sample`, dan `.env.template` yang boleh dilacak; isinya harus selalu berupa placeholder.

Dokumen akademik pada root (`.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx`), `ppt-slides/`, `build-pptx.js`, dan `hasil_dan_pembahasan.md` disimpan lokal. Aturan ini tidak mengecualikan aset aplikasi dengan format yang sama di subdirektori.

File yang sudah dilacak Git tidak otomatis dikeluarkan oleh `.gitignore`. Gunakan `git rm --cached -- <path>` untuk menghentikan pelacakan sambil mempertahankan salinan lokal. Penghapusan dari commit terbaru tidak menghapus file dari riwayat lama; jika kredensial pernah terunggah, ganti kredensial tersebut.

Sebelum commit, periksa `git status --short` dan `git diff --cached`. Untuk memeriksa aturan suatu file, gunakan `git check-ignore -v --no-index <path>`.

## Lisensi

Proprietary — lihat [LICENSE](LICENSE).
