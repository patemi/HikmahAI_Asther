# 3. HASIL DAN PEMBAHASAN

Bab ini menyajikan hasil pengembangan dan pengujian platform chatbot cerdas **Asther** yang dirancang khusus untuk domain keilmuan Islam. Pembahasan mencakup arsitektur sistem, implementasi fitur-fitur utama, mekanisme *Retrieval-Augmented Generation* (RAG), sistem klasifikasi topik, serta analisis terhadap kekuatan dan keterbatasan sistem.

## 3.1 Hasil Implementasi Arsitektur Sistem

Sistem Asther dibangun menggunakan arsitektur *full-stack* berbasis **Next.js 15** dengan *App Router* dan *React Server Components*. Arsitektur ini mengadopsi pola *monolithic modular* dimana seluruh komponen — mulai dari antarmuka pengguna, logika bisnis, hingga *API endpoint* — terintegrasi dalam satu proyek tunggal. Pemilihan arsitektur monolitik ini didasarkan pada pertimbangan efisiensi pengembangan dan kemudahan *deployment* menggunakan Docker, tanpa mengorbankan modularitas internal kode.

Tabel 1 menyajikan ringkasan *tech stack* yang digunakan dalam pengembangan Asther.

**Tabel 1.** Tech Stack Platform Asther

| Komponen | Teknologi | Versi | Fungsi |
|---|---|---|---|
| *Framework* | Next.js (*App Router*) | 15.x | *Full-stack framework* dengan SSR/SSG |
| Bahasa | TypeScript | 5.x | Bahasa pemrograman utama (*type-safe*) |
| Basis Data | PostgreSQL + pgvector | 16+ | Penyimpanan data relasional & vektor |
| ORM | Drizzle ORM | Latest | *Database query builder* dengan *type-safety* |
| *LLM Provider* | OpenAI API | GPT-4.1 series | Pemrosesan bahasa alami & *embedding* |
| *Styling* | Tailwind CSS + shadcn/ui | 4.x | Antarmuka pengguna responsif |
| Validasi | Zod | Latest | Validasi skema *request/response* |
| Autentikasi | bcrypt + JWT | — | *Hashing password* & manajemen sesi |
| *Containerization* | Docker + Docker Compose | — | Isolasi lingkungan & *deployment* |

Arsitektur sistem secara keseluruhan terbagi menjadi empat lapisan utama, sebagaimana diilustrasikan pada Gambar 1.

**Gambar 1.** Diagram Arsitektur Sistem Asther

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Dashboard     │  │ API Client   │  │ External App     │   │
│  │ (React/Next)  │  │ (REST)       │  │ (via Bearer      │   │
│  │              │  │              │  │  Token)           │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js Route Handlers)        │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────────┐ │
│  │ /api/chat   │ │ /api/      │ │ Server Actions           │ │
│  │ (POST)      │ │ knowledge  │ │ (auth, chat, config,     │ │
│  │             │ │ (CRUD)     │ │  knowledge, settings)    │ │
│  └──────┬──────┘ └─────┬──────┘ └────────────┬─────────────┘ │
└─────────┼──────────────┼─────────────────────┼──────────────┘
          │              │                     │
          ▼              ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Topic     │ │ RAG      │ │ OpenAI   │ │ Auth          │  │
│  │ Classif.  │ │ Engine   │ │ Client   │ │ Module        │  │
│  │ (Regex +  │ │ (Hybrid  │ │ (Chat +  │ │ (bcrypt +     │  │
│  │  LLM)     │ │  Search) │ │  Embed)  │ │  session)     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PostgreSQL + pgvector                   │    │
│  │  ┌────────┐ ┌────────────┐ ┌──────────────────────┐ │    │
│  │  │ users  │ │ app_config │ │ chat_participants    │ │    │
│  │  │        │ │            │ │ + chat_messages      │ │    │
│  │  ├────────┤ ├────────────┤ ├──────────────────────┤ │    │
│  │  │knowledge_documents   │ │ knowledge_chunks     │ │    │
│  │  │                      │ │ (+ vector embedding) │ │    │
│  │  ├──────────────────────┤ ├──────────────────────┤ │    │
│  │  │ evaluation_test_cases│ │ evaluation_runs      │ │    │
│  │  └──────────────────────┘ └──────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 3.2 Hasil Implementasi Skema Basis Data

Basis data dirancang menggunakan PostgreSQL yang diperkaya dengan ekstensi **pgvector** untuk mendukung penyimpanan dan pencarian vektor *embedding*. Seluruh skema didefinisikan secara programatik menggunakan Drizzle ORM dengan pendekatan *code-first*, sehingga seluruh definisi tabel, relasi, dan indeks dapat dilacak melalui *version control* (Git).

Tabel 2 menunjukkan struktur ketujuh tabel yang digunakan dalam sistem.

**Tabel 2.** Struktur Tabel Basis Data Asther

| No | Nama Tabel | Jumlah Kolom | Fungsi Utama |
|---|---|---|---|
| 1 | `users` | 5 | Menyimpan data admin (*email, password_hash, name*) |
| 2 | `app_config` | 16 | Konfigurasi *singleton* sistem (identitas bot, API key, model AI, parameter RAG, dan *guardrail*) |
| 3 | `chat_participants` | 5 | Merepresentasikan pengguna eksternal yang berkomunikasi dengan bot |
| 4 | `chat_messages` | 8 | Menyimpan seluruh riwayat pesan (*role, content, image_url, token usage*) |
| 5 | `knowledge_documents` | 6 | Menyimpan dokumen sumber *knowledge base* |
| 6 | `knowledge_chunks` | 5 | Menyimpan potongan teks dokumen beserta vektor *embedding* 1536 dimensi |
| 7 | `evaluation_test_cases` | 5 | Menyimpan kasus uji untuk evaluasi kualitas RAG |

Relasi antar tabel dirancang dengan integritas referensial melalui *foreign key* dan *cascade delete*. Tabel `chat_messages` memiliki relasi *many-to-one* terhadap `chat_participants`, dan tabel `knowledge_chunks` memiliki relasi *many-to-one* terhadap `knowledge_documents`. Indeks yang digunakan meliputi:

1. **B-tree index** pada kolom `participant_id` dan `created_at` di tabel `chat_messages` untuk mempercepat kueri riwayat percakapan.
2. **HNSW index** (*Hierarchical Navigable Small World*) pada kolom `embedding` di tabel `knowledge_chunks` menggunakan operator `vector_cosine_ops` untuk pencarian *nearest neighbor* yang efisien.
3. **GIN index** (*Generalized Inverted Index*) pada kolom `content` di tabel `knowledge_chunks` menggunakan *full-text search* untuk mendukung pencarian berbasis kata kunci.

## 3.3 Hasil Implementasi Sistem RAG (*Retrieval-Augmented Generation*)

Fitur RAG merupakan komponen inti dari platform Asther yang memungkinkan chatbot memberikan jawaban yang akurat berdasarkan *knowledge base* yang telah disediakan. Implementasi RAG pada Asther menggunakan pendekatan **Hybrid Search** yang menggabungkan dua metode pencarian secara simultan.

### 3.3.1 Mekanisme Penyimpanan Dokumen (*Ingestion Pipeline*)

Proses penyimpanan dokumen ke dalam *knowledge base* dilakukan melalui tahapan berikut:

1. **Input Dokumen**: Admin memasukkan dokumen melalui *dashboard* dengan mengisi judul, konten, dan sumber.
2. **Chunking**: Dokumen dipecah menjadi potongan-potongan teks (*chunks*) dengan ukuran maksimum **500 karakter** dan *overlap* sebesar **50 karakter** antar *chunk*. Pemecahan dilakukan berdasarkan batas paragraf (`\n\n`).
3. **Embedding Generation**: Setiap *chunk* dikonversi menjadi vektor *embedding* berdimensi **1536** menggunakan model `text-embedding-3-small` dari OpenAI.
4. **Storage**: *Chunk* beserta vektor *embedding*-nya disimpan ke dalam tabel `knowledge_chunks` di PostgreSQL.

Tabel 3 menyajikan parameter konfigurasi proses *chunking*.

**Tabel 3.** Parameter *Chunking* Dokumen

| Parameter | Nilai | Keterangan |
|---|---|---|
| `maxChunkSize` | 500 karakter | Ukuran maksimum per *chunk* |
| `overlap` | 50 karakter | Tumpang tindih antar *chunk* yang berurutan |
| Metode pemisahan | Batas paragraf (`\n\n`) | Menjaga koherensi semantik paragraf |
| Dimensi *embedding* | 1536 | Sesuai model `text-embedding-3-small` |

### 3.3.2 Mekanisme Pencarian Hibrid (*Hybrid Retrieval*)

Ketika pengguna mengirimkan pertanyaan, sistem melakukan pencarian relevansi melalui dua jalur secara paralel:

**a) Pencarian Vektor (*Vector Search*)**

Pertanyaan pengguna dikonversi menjadi vektor *embedding* menggunakan model yang sama (`text-embedding-3-small`), kemudian dibandingkan dengan seluruh vektor *embedding* yang tersimpan menggunakan metrik **cosine similarity**. Persamaan cosine similarity didefinisikan sebagai:

```
similarity(A, B) = 1 - cosine_distance(A, B)
```

dimana `A` adalah vektor *embedding* kueri dan `B` adalah vektor *embedding* setiap *chunk* dalam basis data.

**b) Pencarian Kata Kunci (*Keyword Search*)**

Secara bersamaan, sistem juga melakukan pencarian menggunakan *PostgreSQL full-text search* melalui fungsi `plainto_tsquery` dan `ts_rank`. Pencarian ini efektif untuk menangkap kecocokan eksak pada istilah-istilah teknis keislaman seperti nama surah, istilah fiqh, atau nama ulama.

**c) Penggabungan Skor (*Score Blending*)**

Hasil dari kedua metode pencarian digabungkan dengan formula pembobotan:

```
skor_akhir = (skor_vektor × 0.75) + (skor_kata_kunci × 0.25)
```

Pembobotan 75:25 memberikan prioritas pada kesamaan semantik (*vector*) sambil tetap memperhitungkan kecocokan leksikal (*keyword*). Apabila pencarian vektor tidak tersedia (misalnya karena kegagalan API *embedding*), sistem secara otomatis melakukan *fallback* ke pencarian kata kunci saja.

### 3.3.3 Domain Boosting

Sistem Asther mengimplementasikan mekanisme **Domain Boosting** untuk meningkatkan relevansi pada kategori konten spesifik. Ketika pertanyaan pengguna mengandung indikator Al-Qur'an (dideteksi melalui regex `QURAN_REGEX`) dan *chunk* yang diambil juga mengandung konten terkait Al-Qur'an, maka skor relevansi *chunk* tersebut ditingkatkan sebesar **+0.12**. Mekanisme serupa diterapkan untuk konten hadits.

Tabel 4 menunjukkan aturan *domain boosting*.

**Tabel 4.** Aturan Domain Boosting

| Intensi Kueri | Konten Chunk yang Cocok | Peningkatan Skor |
|---|---|---|
| Terkait Al-Qur'an | Mengandung kata kunci Al-Qur'an | +0.12 |
| Terkait Hadits | Mengandung kata kunci Hadits | +0.12 |
| Keduanya terpenuhi | Al-Qur'an + Hadits | +0.24 (kumulatif) |

### 3.3.4 Parameter Konfigurasi RAG

Admin dapat menyesuaikan perilaku RAG melalui *dashboard* konfigurasi. Tabel 5 menyajikan parameter yang tersedia.

**Tabel 5.** Parameter Konfigurasi RAG yang Dapat Diatur Admin

| Parameter | Nilai Default | Rentang | Keterangan |
|---|---|---|---|
| `ragEnabled` | `false` | Boolean | Mengaktifkan/menonaktifkan fitur RAG |
| `ragTopK` | 5 | 1–20 | Jumlah *chunk* teratas yang diambil |
| `ragMinScore` | 70% | 0–100% | Skor minimum relevansi *chunk* |
| `memoryLength` | 5 | 1–20 | Jumlah pasangan pesan untuk konteks memori |
| `guardrailLevel` | "standar" | standar/ketat | Tingkat keketatan *guardrail* topik |
| `citationStrict` | `false` | Boolean | Mewajibkan sitasi dari *knowledge base* |

## 3.4 Hasil Implementasi Sistem Klasifikasi Topik

Platform Asther dirancang sebagai chatbot yang **eksklusif** untuk domain keislaman. Untuk menjamin bahwa bot hanya merespons pertanyaan yang relevan, dikembangkan sistem klasifikasi topik berlapis tiga (*three-tier topic classification*).

### 3.4.1 Lapisan 1: Deteksi Regex Cepat

Lapisan pertama menggunakan **Regular Expression** (Regex) untuk mendeteksi kata kunci secara deterministik. Sistem menggunakan empat pola regex utama sebagaimana disajikan dalam Tabel 6.

**Tabel 6.** Pola Regex untuk Klasifikasi Topik

| Nama Regex | Fungsi | Contoh Kata Kunci yang Dideteksi |
|---|---|---|
| `ISLAMIC_QUERY_REGEX` | Mendeteksi topik keislaman umum | islam, fiqh, aqidah, shalat, puasa, zakat, haji, nikah, waris, ulama, khalifah |
| `QURAN_QUERY_REGEX` | Mendeteksi pertanyaan tentang Al-Qur'an | qur'an, alquran, tafsir, ayat, surah |
| `CLEARLY_NON_ISLAMIC_REGEX` | Mendeteksi topik yang jelas non-Islam | javascript, python, saham, crypto, sepak bola, anime, casino, judi |
| `ISLAMIC_CONTEXT_EXTRA_REGEX` | Mendeteksi istilah tambahan terkait ibadah | tawaf, ihram, wukuf, fatwa, ustadz, kyai, dalil, mazhab |

Apabila pertanyaan terdeteksi mengandung kata kunci Islam, maka langsung diklasifikasikan sebagai **diizinkan** tanpa memerlukan pemrosesan lebih lanjut. Sebaliknya, apabila terdeteksi mengandung kata kunci non-Islam, maka langsung **ditolak**.

### 3.4.2 Lapisan 2: Deteksi Konteks Follow-Up

Untuk pertanyaan yang ambigu (tidak mengandung kata kunci eksplisit), sistem memeriksa apakah pertanyaan tersebut merupakan **follow-up** dari percakapan keislaman sebelumnya. Deteksi dilakukan melalui dua mekanisme:

1. **Shared Context Terms**: Menghitung jumlah kata bermakna yang sama antara pesan saat ini dan 6 pesan terakhir dalam riwayat. Jika terdapat ≥ 2 kata yang sama dan riwayat mengandung sinyal keislaman, maka pertanyaan dianggap masih dalam konteks Islam.
2. **Reference Cue Detection**: Mendeteksi kata-kata referensi seperti "itu", "tersebut", "yang tadi", "kalau begitu" melalui `FOLLOW_UP_REFERENCE_REGEX`. Jika ditemukan minimal 1 *reference cue* dan 1 *shared term*, maka pertanyaan dianggap sebagai tindak lanjut.

### 3.4.3 Lapisan 3: Klasifikasi via LLM

Apabila kedua lapisan sebelumnya tidak dapat menentukan klasifikasi secara meyakinkan, sistem mengirimkan pertanyaan kepada model LLM (*Large Language Model*) — secara default `gpt-4.1-nano` — untuk melakukan klasifikasi. Model diberikan *system prompt* khusus yang mendefinisikan tiga kategori topik yang diizinkan:

1. Hukum Islam (fiqh, ibadah, muamalah, akhlak, adab)
2. Sejarah Islam (nabi/rasul, sahabat, ulama, khalifah, peradaban Islam)
3. Pengetahuan umum Islam (aqidah, Al-Qur'an, hadits, tafsir, sirah)

Model diminta mengembalikan respons dalam format JSON: `{"allowed": true|false, "reason": "..."}`. Sistem mengimplementasikan mekanisme *multi-model fallback* dimana apabila model utama gagal, akan dicoba secara berurutan ke model `gpt-4.1-mini` dan `gpt-4o-mini`.

### 3.4.4 Alur Klasifikasi Keseluruhan

Gambar 2 mengilustrasikan alur keputusan klasifikasi topik secara keseluruhan.

**Gambar 2.** Flowchart Klasifikasi Topik Tiga Lapisan

```
[Pesan Masuk]
      │
      ▼
┌──────────────────┐    Ya
│ Mengandung Kata  ├────────► [DIIZINKAN]
│ Kunci Islam?     │
└────────┬─────────┘
         │ Tidak
         ▼
┌──────────────────┐    Ya
│ Mengandung Kata  ├────────► [DITOLAK] ──► "Maaf, saya hanya
│ Kunci Non-Islam? │              melayani topik keislaman."
└────────┬─────────┘
         │ Tidak
         ▼
┌──────────────────┐    Ya
│ Follow-up dari   ├────────► [DIIZINKAN]
│ Konteks Islam?   │
└────────┬─────────┘
         │ Tidak
         ▼
┌──────────────────┐
│ Kirim ke LLM     │
│ Classifier       │
│ (gpt-4.1-nano)   │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
[DIIZINKAN] [DITOLAK]
```

## 3.5 Hasil Implementasi Chat API

Chat API merupakan *endpoint* utama (`POST /api/chat`) yang menerima permintaan percakapan dari aplikasi eksternal. Endpoint ini dilindungi oleh autentikasi **Bearer Token** dan mendukung beberapa fitur lanjutan sebagaimana disajikan pada Tabel 7.

**Tabel 7.** Parameter *Request* Chat API

| Parameter | Tipe | Wajib | Default | Keterangan |
|---|---|---|---|---|
| `participantId` | string | Ya | — | ID unik pengguna dari aplikasi klien |
| `message` | string | Ya | — | Isi pesan dari pengguna |
| `userName` | string | Tidak | — | Nama pengguna (opsional) |
| `imageUrl` | string | Tidak | — | URL gambar untuk dianalisis |
| `saveHistory` | boolean | Tidak | `true` | Menyimpan riwayat percakapan |
| `responseDepth` | enum | Tidak | "standar" | Tingkat kedalaman jawaban: ringkas, standar, mendalam |
| `includeCitations` | boolean | Tidak | `true` | Menyertakan sitasi dari *knowledge base* |

Alur pemrosesan *request* Chat API dapat dijabarkan sebagai berikut:

1. **Validasi Token**: Memverifikasi *Bearer Token* terhadap hash yang tersimpan di `app_config`.
2. **Validasi Request**: Menggunakan skema Zod untuk memvalidasi struktur dan tipe data *request body*.
3. **Registrasi Partisipan**: Membuat atau memperbarui data partisipan berdasarkan `participantId`.
4. **Klasifikasi Topik**: Menjalankan sistem klasifikasi berlapis tiga (Sub-bab 3.4).
5. **Pengambilan Konteks RAG**: Jika RAG aktif, mengambil *chunk* relevan dari *knowledge base*.
6. **Pembangunan Riwayat**: Mengambil N pasangan pesan terakhir sebagai konteks memori.
7. **Pemanggilan LLM**: Mengirim *prompt* (termasuk *system prompt*, konteks RAG, dan riwayat) ke model OpenAI.
8. **Penyimpanan Pesan**: Menyimpan pesan pengguna dan respons bot ke basis data.
9. **Pengembalian Respons**: Mengembalikan jawaban dalam format JSON.

### 3.5.1 Fitur Analisis Gambar

Selain teks, Chat API juga mendukung **analisis gambar** melalui parameter `imageUrl`. Ketika URL gambar disertakan, sistem memanggil model `gpt-4.1` untuk menganalisis konten visual gambar, dan hasil analisis digunakan sebagai konteks tambahan untuk memperkaya jawaban. Hasil analisis gambar disimpan di kolom `image_analysis` pada tabel `chat_messages`.

### 3.5.2 Fitur Kedalaman Respons

Parameter `responseDepth` memungkinkan aplikasi klien mengontrol panjang dan kedalaman respons yang dihasilkan bot:

- **Ringkas**: Jawaban singkat dan langsung ke inti permasalahan.
- **Standar**: Jawaban dengan penjelasan yang cukup dan contoh.
- **Mendalam**: Jawaban komprehensif dengan dalil, konteks historis, dan perbandingan pendapat ulama.

## 3.6 Hasil Implementasi Dashboard Admin

Dashboard admin dibangun menggunakan React Server Components dan mengimplementasikan *layout* responsif dengan *sidebar navigation*. Dashboard terdiri dari tujuh halaman utama sebagaimana disajikan pada Tabel 8.

**Tabel 8.** Halaman-Halaman Dashboard Admin

| No | Halaman | Path | Fungsi Utama |
|---|---|---|---|
| 1 | *Overview* | `/dashboard` | Menampilkan statistik ringkasan (total pesan, partisipan, dokumen, model aktif) |
| 2 | Demo Chat | `/dashboard/demo` | Antarmuka percobaan chat langsung untuk menguji perilaku bot |
| 3 | Konfigurasi | `/dashboard/config` | Pengaturan identitas bot, model AI, parameter RAG, dan *guardrail* |
| 4 | *Knowledge Base* | `/dashboard/knowledge` | Manajemen dokumen: tambah, edit, hapus dokumen sumber |
| 5 | Riwayat Chat | `/dashboard/history` | Melihat riwayat percakapan seluruh partisipan |
| 6 | Pengaturan | `/dashboard/settings` | Pengaturan akun admin, API key, dan profil |
| 7 | API Docs | `/dashboard/api-docs` | Dokumentasi penggunaan Chat API untuk pengembang |

Dashboard mengimplementasikan fitur **dark mode** yang didukung melalui *class-based toggling* pada elemen `<html>` dengan *persistence* pada `localStorage`.

## 3.7 Hasil Pengujian Sistem Evaluasi RAG

Untuk mengukur kualitas *retrieval* dari sistem RAG, dilakukan pengujian evaluasi menggunakan fitur evaluasi bawaan Asther. Pengujian dilaksanakan pada tanggal **8 April 2026** pukul 16:57 WIB dengan 3 kasus uji (*test case*) yang mencakup tiga kategori domain keislaman yang berbeda.

### 3.7.1 Definisi Metrik Evaluasi

Tabel 9 menyajikan definisi metrik yang digunakan dalam pengujian evaluasi RAG.

**Tabel 9.** Definisi Metrik Evaluasi RAG

| Metrik | Formula | Keterangan |
|---|---|---|
| *Precision* (P) | TP / (TP + FP) | Proporsi *chunk* relevan dari seluruh *chunk* yang diambil |
| *Recall* (R) | TP / (TP + FN) | Proporsi *chunk* relevan yang berhasil diambil dari seluruh *chunk* relevan yang ada |
| *F1-Score* | 2 × (P × R) / (P + R) | Rata-rata harmonik antara *precision* dan *recall* |
| *Relevance* (Rel) | Penilaian LLM (0–100%) | Skor relevansi konten jawaban terhadap pertanyaan, dinilai oleh LLM |
| *Accuracy* (Acc) | Penilaian LLM (0–100%) | Skor ketepatan (*correctness*) jawaban, dinilai oleh LLM |

### 3.7.2 Kasus Uji dan Konfigurasi Pengujian

Admin membuat 3 kasus uji yang masing-masing merepresentasikan satu kategori domain keislaman. Setiap kasus uji mendefinisikan:
- **Query**: Pertanyaan dalam bahasa Indonesia yang akan diuji.
- **Expected Document IDs**: ID dokumen yang seharusnya diambil oleh sistem.
- **Category**: Kategori domain (QURAN, FIQH, AQIDAH).

Konfigurasi RAG yang digunakan selama pengujian: `topK = 3`, sehingga sistem mengambil maksimal 3 *chunk* teratas untuk setiap kueri.

### 3.7.3 Hasil Pengujian Per Kueri

Tabel 10 menyajikan hasil pengujian untuk setiap kasus uji secara rinci.

**Tabel 10.** Hasil Evaluasi RAG Per Kueri

| No | Kueri | Kategori | Chunks | Relevan | P | R | F1 | Rel | Acc |
|---|---|---|---|---|---|---|---|---|---|
| 1 | "Sebutkan surah yang pertama kali turun?" | QURAN | 3 | 3 | 100% | 100% | 100% | 89,1% | 89,1% |
| 2 | "Apakah membunuh perampok ketika dirampok itu berdosa dalam Islam?" | FIQH | 3 | 3 | 100% | 100% | 100% | 70,9% | 70,9% |
| 3 | "Kenapa Islam disebut sebagai agama yang benar dan sempurna dibanding agama lain seperti Yahudi, Kristen, dll?" | AQIDAH | 3 | 3 | 100% | 100% | 100% | 98,6% | 98,6% |

### 3.7.4 Hasil Agregat

Tabel 11 menyajikan rata-rata keseluruhan dari seluruh metrik evaluasi.

**Tabel 11.** Hasil Agregat Evaluasi RAG (Rata-rata 3 Kueri)

| Metrik | Nilai Rata-rata | Interpretasi |
|---|---|---|
| Avg *Precision* | **100,0%** | Seluruh *chunk* yang diambil relevan terhadap pertanyaan |
| Avg *Recall* | **100,0%** | Seluruh *chunk* relevan yang ada berhasil diambil |
| Avg *F1-Score* | **100,0%** | Keseimbangan sempurna antara *precision* dan *recall* |
| Avg *Relevance* | **86,2%** | Jawaban cukup hingga sangat relevan terhadap pertanyaan |
| Avg *Accuracy* | **86,2%** | Jawaban cukup hingga sangat akurat |

### 3.7.5 Analisis Hasil Pengujian

Berdasarkan hasil pengujian, dapat diidentifikasi beberapa temuan penting:

**a) Kinerja Retrieval Sempurna (P = R = F1 = 100%)**

Ketiga kueri menghasilkan skor *precision*, *recall*, dan *F1-score* sebesar 100%. Hal ini menunjukkan bahwa mekanisme *hybrid search* (vektor + kata kunci) dengan *domain boosting* berhasil mengambil seluruh *chunk* yang relevan tanpa menyertakan *chunk* yang tidak relevan. Dari 3 *chunk* yang diambil untuk setiap kueri, seluruhnya dinilai relevan terhadap dokumen yang diharapkan.

**b) Variasi Skor Relevance dan Accuracy**

Meskipun *retrieval* sempurna, skor *relevance* dan *accuracy* menunjukkan variasi yang cukup signifikan:

- **Kueri AQIDAH** (98,6%): Skor tertinggi. Pertanyaan mengenai kebenaran Islam sebagai agama yang sempurna merupakan topik fundamental yang tercakup secara komprehensif dalam *knowledge base*, sehingga jawaban yang dihasilkan sangat relevan dan akurat.
- **Kueri QURAN** (89,1%): Skor tinggi. Pertanyaan mengenai surah pertama yang turun merupakan pengetahuan spesifik yang terdokumentasi dengan baik, namun mungkin memerlukan nuansa tambahan (perbedaan pendapat antara surah Al-'Alaq, Al-Muddaththir, dll.) yang menyebabkan sedikit penurunan skor.
- **Kueri FIQH** (70,9%): Skor terendah. Pertanyaan mengenai hukum membunuh perampok dalam keadaan darurat merupakan topik fiqh yang kompleks dengan banyak perbedaan pendapat antar mazhab, sehingga jawaban memerlukan tingkat *nuance* yang lebih tinggi. Skor 70,9% mengindikasikan bahwa *knowledge base* yang tersedia belum mencakup kedalaman pembahasan fiqh yang memadai untuk topik ini.

**c) Korelasi Relevance–Accuracy**

Pada seluruh kasus uji, skor *relevance* dan *accuracy* selalu identik. Hal ini menunjukkan bahwa ketika jawaban relevan terhadap pertanyaan, jawaban tersebut juga akurat — tidak ditemukan kasus dimana jawaban relevan tetapi mengandung informasi yang salah (*hallucination*).

## 3.8 Analisis Kekuatan Sistem

Berdasarkan hasil implementasi dan pengujian, teridentifikasi beberapa kekuatan utama platform Asther:

1. **Arsitektur Modular**: Meskipun monolitik, kode terorganisir dengan baik dalam modul-modul terpisah (`lib/db`, `lib/auth`, `lib/rag`, `lib/openai`) yang memudahkan pemeliharaan dan pengembangan.

2. **Hybrid RAG Search**: Kombinasi pencarian vektor dan kata kunci meningkatkan akurasi *retrieval*, terutama pada istilah-istilah teknis keislaman yang memiliki transliterasi beragam.

3. **Klasifikasi Topik Berlapis**: Sistem tiga lapisan (Regex → Follow-up → LLM) efektif dan efisien — menghindari pemanggilan LLM untuk kasus-kasus yang dapat diselesaikan oleh regex saja, sehingga menghemat biaya API.

4. **Konfigurabilitas Tinggi**: Seluruh parameter utama (model AI, *guardrail level*, parameter RAG) dapat diatur melalui dashboard tanpa memerlukan perubahan kode.

5. **Kontainerisasi**: Docker Compose memudahkan *deployment* pada berbagai lingkungan server dengan konsistensi.

## 3.9 Analisis Keterbatasan Sistem

Di samping kekuatan-kekuatan tersebut, teridentifikasi pula sejumlah keterbatasan yang perlu menjadi perhatian untuk pengembangan selanjutnya. Tabel 12 menyajikan ringkasan keterbatasan berdasarkan tingkat keparahan.

**Tabel 12.** Keterbatasan Sistem Berdasarkan Tingkat Keparahan

| No | Kategori | Keterbatasan | Tingkat | Dampak |
|---|---|---|---|---|
| 1 | Keamanan | API key OpenAI disimpan dalam *plaintext* di basis data | Kritikal | Potensi kebocoran kredensial sensitif |
| 2 | Keamanan | Tidak adanya *rate limiting* pada API endpoint | Kritikal | Rentan terhadap serangan *Denial of Service* (DoS) dan penyalahgunaan API |
| 3 | Keamanan | *Server actions* tidak memiliki *auth guard* yang konsisten | Kritikal | Potensi akses tidak terotorisasi ke fungsi-fungsi sensitif |
| 4 | Keamanan | CORS dikonfigurasi *wildcard* (`*`) | Kritikal | Rentan terhadap *Cross-Site Request Forgery* (CSRF) |
| 5 | Keamanan | Tidak ada mekanisme pembersihan sesi otomatis | Kritikal | Sesi yang kedaluwarsa tidak dibersihkan |
| 6 | Arsitektur | Tidak ada *middleware* untuk autentikasi pada *route* dashboard | Penting | Setiap halaman harus mengimplementasikan pengecekan autentikasi secara mandiri |
| 7 | Arsitektur | Duplikasi logika autentikasi di banyak *server actions* | Penting | Meningkatkan risiko inkonsistensi dan kesulitan pemeliharaan |
| 8 | Performa | Tidak ada paginasi pada halaman riwayat chat | Penting | Performa menurun seiring bertambahnya data |
| 9 | Keamanan | Tidak ada sanitasi *input* pada konten pesan | Penting | Potensi serangan *injection* melalui konten pesan |
| 10 | Arsitektur | Model admin terbatas (*single admin*) | Penting | Tidak mendukung manajemen multi-administrator |
| 11 | Audit | Tidak ada *audit trail* untuk perubahan konfigurasi | Penting | Sulit melacak perubahan yang dilakukan admin |
| 12 | Pengujian | Tidak terdapat *unit test* maupun *integration test* | Minor | Tidak ada jaminan otomatis terhadap regresi |
| 13 | RAG | Strategi *chunking* sederhana (berbasis paragraf) | Minor | Kurang optimal untuk dokumen dengan format beragam |
| 14 | Fitur | Tidak mendukung unggah file langsung | Minor | Admin harus menyalin konten secara manual |
| 15 | Analitik | Tidak ada analisis penggunaan token secara terperinci | Minor | Sulit memantau biaya operasional API |

## 3.10 Perbandingan dengan Sistem Sejenis

Untuk memberikan konteks terhadap posisi Asther di antara solusi yang ada, dilakukan perbandingan dengan dua platform chatbot Islami berbasis AI yang telah beroperasi sebelumnya, yaitu **QuranGPT** (https://www.qurangpt.com/) dan **HadithGPT** (https://www.hadithgpt.com/).

### 3.10.1 Deskripsi Singkat Platform Pembanding

**a) QuranGPT**

QuranGPT merupakan platform chatbot Islami yang dikembangkan oleh 9x Technology LLC dan berfokus secara eksklusif pada Al-Qur'an. Platform ini menyediakan antarmuka chat bertenaga AI untuk menjawab pertanyaan seputar ayat-ayat Al-Qur'an, dilengkapi fitur penelusuran surah per juz, eksplorasi tema (iman, kesabaran, moralitas), serta dukungan multi-edisi terjemahan. QuranGPT juga tersedia dalam bentuk aplikasi mobile (Android dan iOS). Basis pengetahuan yang digunakan bersifat **statis** — terdiri dari teks Al-Qur'an beserta terjemahannya — dan tidak dapat dikelola atau diperluas oleh pengguna.

**b) HadithGPT**

HadithGPT merupakan proyek eksperimental yang dirancang untuk menemukan dan mensintesis hadits berdasarkan pertanyaan pengguna menggunakan *Large Language Model*. Platform ini dilatih menggunakan **40.000 hadits** dari enam koleksi utama: *Sahih Bukhari*, *Sahih Muslim*, *Sunan Abu Dawud*, *Sunan al-Nasa'i*, *Sunan Ibn Majah*, dan *Muwatta Imam Malik*. Namun, setelah menerima masukan dari komunitas terkait keakuratan dan keabsahan penggunaan teknologi AI untuk konten hadits, pengembang memutuskan untuk **menonaktifkan layanan** dan berkonsultasi dengan para ulama guna mencari pemanfaatan teknologi yang lebih tepat. Pada saat penelitian ini dilakukan (April 2026), HadithGPT berstatus **offline**.

### 3.10.2 Tabel Perbandingan Fitur

Tabel 13 menyajikan perbandingan fitur secara komprehensif antara Asther, QuranGPT, dan HadithGPT.

**Tabel 13.** Perbandingan Fitur Asther dengan QuranGPT dan HadithGPT

| No | Aspek Perbandingan | Asther | QuranGPT | HadithGPT |
|---|---|---|---|---|
| 1 | Status operasional | Aktif (self-hosted) | Aktif (publik) | Offline (dinonaktifkan) |
| 2 | Cakupan domain | Multi-domain keislaman (fiqh, aqidah, sejarah, Al-Qur'an, hadits) | Al-Qur'an saja | Hadits saja |
| 3 | Metode NLP | LLM (GPT-4.1) + RAG (*Hybrid Search*) | LLM (GPT-based) + database statis | LLM + dataset statis 40.000 hadits |
| 4 | Pencarian hibrid (vektor + kata kunci) | ✓ | ✗ | ✗ |
| 5 | *Knowledge base* terkelola (CRUD) | ✓ (admin dashboard) | ✗ (statis, tidak dapat diubah pengguna) | ✗ (statis, *pre-trained*) |
| 6 | Klasifikasi topik otomatis | ✓ (3 lapisan: regex, follow-up, LLM) | ✗ (fokus tunggal Al-Qur'an) | ✗ (fokus tunggal hadits) |
| 7 | *Guardrail* konten berlevel | ✓ (standar / ketat) | Tidak eksplisit | Tidak eksplisit |
| 8 | Sitasi sumber | ✓ (dari *knowledge base*) | ✓ (ayat Al-Qur'an) | ✓ (referensi hadits) |
| 9 | Penelusuran teks sumber | ✗ | ✓ (per surah/juz) | ✗ |
| 10 | Konfigurabilitas model AI | ✓ (via dashboard admin) | ✗ | ✗ |
| 11 | Analisis gambar | ✓ | ✗ | ✗ |
| 12 | Evaluasi RAG bawaan (P, R, F1) | ✓ | ✗ | ✗ |
| 13 | API untuk integrasi eksternal | ✓ (REST + Bearer Token) | ✗ | ✗ |
| 14 | Dashboard admin | ✓ (overview, config, knowledge, history, evaluasi) | ✗ | ✗ |
| 15 | Dukungan multi-bahasa | Bahasa Indonesia | Multi-edisi terjemahan | Bahasa Inggris |
| 16 | Aplikasi mobile | ✗ | ✓ (Android, iOS) | ✗ |
| 17 | Kedalaman respons (*response depth*) | ✓ (ringkas, standar, mendalam) | ✗ | ✗ |
| 18 | Arsitektur deployment | Self-hosted (Docker) | Cloud (publik) | Cloud (publik, offline) |

### 3.10.3 Analisis Perbandingan

Berdasarkan tabel perbandingan di atas, dapat dianalisis beberapa poin penting:

**a) Keunggulan Asther**

Asther memiliki keunggulan signifikan pada aspek **konfigurabilitas** dan **ekstensibilitas**. Berbeda dengan QuranGPT dan HadithGPT yang memiliki basis pengetahuan statis dan cakupan domain tunggal, Asther dirancang sebagai platform yang fleksibel — admin dapat menambahkan dokumen dari berbagai domain keislaman (fiqh, aqidah, sejarah, tafsir, hadits) secara dinamis melalui dashboard. Selain itu, fitur evaluasi RAG bawaan, API untuk integrasi eksternal, dan sistem klasifikasi topik berlapis tiga merupakan fitur-fitur yang tidak ditemukan pada kedua platform pembanding.

**b) Keunggulan QuranGPT**

QuranGPT unggul dalam hal **aksesibilitas pengguna akhir** dengan ketersediaan aplikasi mobile dan dukungan multi-edisi terjemahan. Fitur penelusuran Al-Qur'an per surah/juz juga memberikan pengalaman eksplorasi yang tidak dimiliki Asther. Sebagai platform publik yang telah beroperasi, QuranGPT juga memiliki basis pengguna yang lebih luas.

**c) Pelajaran dari HadithGPT**

Penonaktifan HadithGPT memberikan pelajaran penting mengenai **tantangan validasi konten keislaman berbasis AI**. Keputusan pengembang untuk berkonsultasi dengan ulama sebelum melanjutkan layanan menggarisbawahi pentingnya mekanisme *guardrail* dan validasi pakar dalam sistem chatbot Islami. Asther mengantisipasi tantangan ini melalui implementasi *guardrail* konten berlevel (standar/ketat) dan *knowledge base* yang dapat dikurasi oleh admin.

**d) Perbedaan Paradigma Arsitektur**

Asther mengadopsi paradigma **self-hosted** yang memberikan kontrol penuh kepada pengguna atas data, model AI, dan konfigurasi sistem. Sementara itu, QuranGPT dan HadithGPT menggunakan paradigma **cloud-hosted** yang lebih mudah diakses namun mengorbankan fleksibilitas konfigurasi. Paradigma self-hosted yang dipilih Asther lebih sesuai untuk institusi keislaman (pesantren, organisasi dakwah) yang membutuhkan kontrol penuh atas konten dan privasi data.

## 3.11 Pengembangan ke Depan

Berdasarkan analisis keterbatasan pada Sub-bab 3.9, berikut adalah rekomendasi pengembangan untuk versi selanjutnya:

1. **Penguatan Keamanan**: Implementasi enkripsi API key menggunakan *envelope encryption*, penambahan *rate limiting* menggunakan *middleware* seperti `express-rate-limit` atau implementasi *token bucket* pada level Next.js, serta konfigurasi CORS yang lebih ketat.

2. **Refaktorisasi Autentikasi**: Mengkonsolidasikan logika autentikasi ke dalam *middleware* Next.js terpusat yang melindungi seluruh *route* `/dashboard/*` dan *server actions*.

3. **Peningkatan RAG**: Mengimplementasikan strategi *chunking* yang lebih canggih seperti *recursive character splitter* atau *semantic chunking*, serta menambahkan mekanisme *re-ranking* menggunakan *cross-encoder* untuk meningkatkan presisi *retrieval*.

4. **Fitur Unggah File**: Menambahkan dukungan unggah file PDF, DOCX, dan TXT dengan *parsing* otomatis untuk mempermudah pengelolaan *knowledge base*.

5. **Monitoring**: Menambahkan *dashboard* analitik yang lebih detail mencakup penggunaan token, biaya API, dan metrik performa per model.

6. **Pengujian Otomatis**: Mengimplementasikan *unit test* untuk komponen-komponen kritis (RAG, klasifikasi topik, autentikasi) dan *end-to-end test* untuk alur utama Chat API.

7. **Penambahan Referensi Kitab Empat Mazhab**: Menambahkan referensi dari kitab-kitab karya Imam Syafi'i, Imam Malik, Imam Hanafi, dan Imam Hambali ke dalam *knowledge base* untuk memperkaya perspektif jawaban dengan pandangan berbagai mazhab fiqih.

8. **Penambahan Referensi Kitab Tafsir**: Menambahkan referensi dari kitab-kitab tafsir Al-Qur'an (seperti Tafsir Ibnu Katsir, Tafsir Al-Maraghi, atau Tafsir Al-Misbah) ke dalam *knowledge base* untuk memberikan pemaknaan yang lebih mendalam terhadap ayat-ayat Al-Qur'an, termasuk konteks historis dan *asbabun nuzul*.

## 3.12 Validasi Ahli (*Expert Judgment*)

Sebagai validasi akhir terhadap kelayakan sistem, dilakukan pengujian oleh **Ustadz Negus** — Ketua Ranting Muhammadiyah Alasombo, Kepala Kesantrian Pondok Pesantren Tahfidzul Qur'an Qoryatul Qur'an, seorang hafidz Al-Qur'an 30 juz sekaligus ahli hadits. Penguji mengajukan lima pertanyaan fiqih dengan tingkat kompleksitas beragam kepada sistem Hikmah AI, meliputi: hukum minum khamr, hukum menikahi wanita yang telah dicerai, hukum cerai tiga kali, hukum nikah siri, dan kebolehan puasa Syawal di luar bulan Syawal.

Hasil pengujian menunjukkan bahwa sistem Hikmah AI dinilai **sangat layak** dan **tidak ditemukan kesalahan** dalam menjawab seluruh pertanyaan yang diajukan. Ustadz Negus menyatakan bahwa jawaban sistem sudah **akurat** dalam menjelaskan berbagai masalah fiqih sesuai dengan Al-Qur'an dan hadits. Dalil-dalil yang ditampilkan oleh sistem juga sudah **sesuai dengan topik pembahasan** dan **sesuai dengan nash aslinya**. Beliau menyimpulkan bahwa sistem ini sudah cukup membantu, bermanfaat, dan layak digunakan oleh orang umum.

Adapun saran yang diberikan untuk pengembangan ke depan adalah menambahkan referensi kitab-kitab dari para ulama, terutama empat mazhab (Imam Syafi'i, Imam Malik, Imam Hanafi, dan Imam Hambali), serta menambahkan referensi kitab tafsir agar sistem dapat lebih mendalam dalam memaknai ayat-ayat Al-Qur'an.

# 4. PENUTUP

## 4.1 Kesimpulan

Penelitian ini telah berhasil mengembangkan platform chatbot cerdas **Asther** yang didedikasikan untuk domain keilmuan Islam. Sistem ini mengintegrasikan teknologi *Large Language Model* (LLM) dari OpenAI dengan mekanisme *Retrieval-Augmented Generation* (RAG) berbasis pencarian hibrid (vektor + kata kunci) untuk menghasilkan jawaban yang akurat dan terdokumentasi sumbernya.

Beberapa hasil utama yang dicapai dalam penelitian ini meliputi:

1. Berhasil diimplementasikan arsitektur *full-stack* berbasis Next.js 15 dengan PostgreSQL dan pgvector sebagai pendukung penyimpanan dan pencarian vektor.
2. Sistem klasifikasi topik berlapis tiga (Regex → *Follow-up Detection* → LLM *Classifier*) terbukti efektif dalam membatasi cakupan chatbot pada domain keislaman, sekaligus meminimalkan pemanggilan LLM yang tidak perlu.
3. Mekanisme *Hybrid RAG* dengan formula pembobotan 75:25 (vektor : kata kunci) dan **domain boosting** mampu meningkatkan relevansi *retrieval* pada konten-konten spesifik seperti Al-Qur'an dan hadits.
4. Dashboard admin yang konfiguratif memungkinkan pengelolaan *knowledge base*, pengaturan model AI, dan pemantauan riwayat percakapan tanpa memerlukan keahlian pemrograman.

## 4.2 Saran

Untuk pengembangan selanjutnya, disarankan agar **menambahkan lapisan keamanan** yang lebih kuat (enkripsi, *rate limiting*, audit trail), mengimplementasikan **pengujian otomatis**, serta mengeksplorasi strategi *chunking* dan *re-ranking* yang lebih canggih guna meningkatkan kualitas RAG secara keseluruhan. Penelitian lebih lanjut juga dapat diarahkan pada pengujian kuantitatif dengan dataset hadits dan tafsir yang lebih besar untuk mengukur presisi dan *recall* secara empiris.

---

**DAFTAR PUSTAKA**

Brown, T. B., Mann, B., Ryder, N., Subbiah, M., Kaplan, J. D., Dhariwal, P., Neelakantan, A., Shyam, P., Sastry, G., Askell, A., Agarwal, S., Herbert-Voss, A., Krueger, G., Henighan, T., Child, R., Ramesh, A., Ziegler, D. M., Wu, J., Winter, C., … Amodei, D. (2020). Language Models are Few-Shot Learners. *Advances in Neural Information Processing Systems*, 33, 1877–1901.

Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S., & Kiela, D. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *Advances in Neural Information Processing Systems*, 33, 9459–9474.

OpenAI. (2024). GPT-4 Technical Report. *ArXiv Preprint*. https://arxiv.org/abs/2303.08774

Vercel. (2024). Next.js 15 Documentation. https://nextjs.org/docs

Johnson, J., Douze, M., & Jégou, H. (2019). Billion-scale similarity search with GPUs. *IEEE Transactions on Big Data*, 7(3), 535–547.

Drizzle Team. (2024). Drizzle ORM Documentation. https://orm.drizzle.team/docs/overview

pgvector. (2024). Open-source vector similarity search for PostgreSQL. https://github.com/pgvector/pgvector

Karpukhin, V., Oguz, B., Min, S., Lewis, P., Wu, L., Edunov, S., Chen, D., & Yih, W.-T. (2020). Dense Passage Retrieval for Open-Domain Question Answering. *Proceedings of the 2020 Conference on Empirical Methods in Natural Language Processing (EMNLP)*, 6769–6781.

Mikolov, T., Chen, K., Corrado, G., & Dean, J. (2013). Efficient Estimation of Word Representations in Vector Space. *ArXiv Preprint*. https://arxiv.org/abs/1301.3781

Malkov, Y. A., & Yashunin, D. A. (2020). Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs. *IEEE Transactions on Pattern Analysis and Machine Intelligence*, 42(4), 824–836.
