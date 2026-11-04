# Perubahan keandalan HikmahAI

## Akses

Semua halaman dashboard dan operasi administrasi memeriksa peran admin. Login dan registrasi mengembalikan profil aman tanpa hash password. Kunci provider tidak dikirim kembali melalui props komponen. Demo memakai sesi admin, sehingga tidak membutuhkan bearer token dalam browser.

Pada database lama, jalankan migrasi lalu seed. Seed mempertahankan password dan hanya mengangkat akun yang cocok dengan DEFAULT_USERNAME ketika belum ada admin. Jangan menjadikan akun pendaftar pertama sebagai admin secara otomatis.

## Dokumen dan rujukan

Dokumen baru / impor menjadi draft. Peninjau memeriksa isi dan identitas sumber sebelum publikasi. Pembaruan menghasilkan versi baru, menghapus penanda review, dan mengembalikan dokumen ke draft. Pemeriksaan versi mencegah perubahan menimpa hasil edit yang lebih baru.

Kutipan pada pesan menyimpan snapshot sehingga perubahan / penghapusan dokumen tidak mengubah rujukan yang diterima pengguna sebelumnya. Skor pencarian tidak ditampilkan sebagai tingkat kebenaran.

Pencarian hanya memakai dokumen terbit. Kegagalan semantic search dapat menggunakan keyword search yang tetap melewati ambang yang sama. Ketiadaan sumber tidak diloloskan oleh fallback. Identitas model embedding disimpan untuk mencegah pencampuran ruang vektor.

## Evaluasi

Kasus jawaban memerlukan jawaban acuan dan konfirmasi peninjauan. Kasus penolakan sumber dan penolakan domain dapat diuji secara eksplisit. Dataset referensi harus diperiksa ahli materi; perangkat lunak tidak melakukan sertifikasi kebenaran agama.

Precision, recall dan F1 berbasis dokumen hanya dihitung jika ada dokumen acuan, menggunakan dokumen unik pada pembilang dan penyebut. Skor jawaban memakai jawaban aktual dari pipeline chat yang sama. Kegagalan judge menghasilkan status belum terukur, tanpa mengganti nilai dengan similarity.

Run menyimpan konfigurasi nonrahasia, versi prompt, kasus acuan, respons aktual, serta kutipan yang dipakai. Hasil lama tetap tersedia dan diberi label yang membedakan kecukupan konteks dari ketepatan jawaban akhir.

## Operasional

Kuota disimpan secara atomik di PostgreSQL dan berlaku lintas instance. Request, batas ukuran input, sesi, dan sumber laporan diperiksa pada batas server. Riwayat mempertahankan kepemilikan percakapan. Laporan tidak dapat dibuat untuk pesan pengguna lain.

Penghapusan otomatis riwayat tidak diaktifkan secara default agar data lama tidak terhapus tanpa pengaturan eksplisit. Runtime membersihkan sesi / bucket yang kedaluwarsa; masa simpan pesan dapat diaktifkan melalui CHAT_RETENTION_DAYS.

Pengujian memakai provider tiruan. Ketersediaan model, kredensial provider produksi, biaya aktual, mutu sumber, serta jawaban acuan ahli harus diverifikasi pada deployment yang digunakan.
