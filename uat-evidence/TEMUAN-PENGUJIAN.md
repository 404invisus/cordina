# Temuan Verifikasi Teknis (pre-UAT) — ConnectOne

- **Sifat pengujian**: verifikasi teknis internal otomatis (Playwright) oleh tim pengembang.
  **Bukan** UAT resmi oleh perwakilan pengguna BLPID.
- **Lingkungan**: lokal — frontend `localhost:3000`, API gateway `localhost:8000` (backend Docker).
  Frontend memakai `.env.local` yang menunjuk API lokal, **bukan** produksi.
- **Tanggal**: 30 Juli – 1 Agustus 2026 (termasuk pengujian ulang setelah perbaikan)
- **Cakupan**: 67 skenario (seluruh baris tabel uji pada dokumen UAT v3).
  Putaran pertama: 62 sesuai, 5 tidak sesuai. **Kelima ketidaksesuaian sudah diperbaiki dan diuji ulang — kini 67 sesuai.**
- **Metode verifikasi**: setiap skenario dijalankan lewat antarmuka, lalu hasilnya diverifikasi
  silang ke basis data PostgreSQL dan/atau log layanan. Hasil yang tidak dapat dibuktikan
  ditandai gagal, bukan lulus.

---

## A. Temuan putaran pertama — SUDAH DIPERBAIKI dan diuji ulang

> Ringkasan perbaikan:
>
> | Skenario | Akar masalah | Perbaikan |
> |---|---|---|
> | 3.6.2-1 | Parameter dikirim bernama `appearance`, layanan esign-api membaca `tampilan` | Nama parameter diseragamkan pada 3 pemanggil |
> | 3.8.1-4 | `is_active` tidak diperiksa saat login maupun pada rute terproteksi | `is_active` jadi syarat kredensial + middleware `EnsureActiveUser` |
> | 4.1-3 | `setAddBacklogOpen(true)` tidak pernah dipanggil | Tombol "Add Backlog" ditambahkan pada kartu sprint |
> | 4.2-5 | `useState` tidak tersinkron dengan `editData`; update dikirim `PUT` multipart | `useEffect` sinkronisasi + method spoofing `_method=PUT` |
> | 3.4.4-2 | Filter anggota belum ada | Dropdown anggota ditambahkan di `/workload` |


### A1. Penandatanganan multi pihak gagal — HTTP 504 (skenario 3.6.2-1) — SELESAI
`POST /api/v1/tte-sign-requests/{id}/sign` menggantung lalu gagal. Reproducible: lewat antarmuka
gagal setelah 180 detik; lewat pemanggilan API langsung gagal tepat pada detik ke-60.
Setelah kegagalan, seluruh penandatangan tetap berstatus `pending` dan dokumen tetap
`waiting_signature` — tidak ada tanda tangan tersimpan.

**Bukan masalah BSrE**: penandatanganan dokumen tunggal melalui `/esign` dengan dokumen dan
kredensial yang sama berhasil dalam ±2 detik. Penyebab ada pada alur multi penandatangan di
`svc-storage` (`TteSignRequestController`).

**Dampak**: fitur tanda tangan berurutan multi pihak tidak dapat dipakai.

### A2. Akun yang dinonaktifkan masih dapat login (skenario 3.8.1-4) — **isu keamanan** — SELESAI
Setelah aksi *Deactivate* dan terverifikasi `is_active = false` di basis data, akun tersebut
tetap dapat login: `POST /api/v1/auth/login` mengembalikan HTTP 200 beserta token sah, dan token
itu berhasil mengakses `GET /api/v1/auth/me` (200) serta `GET /api/v1/projects` (200).

Sebagai pembanding, aksi *Delete* (soft delete) sudah benar — login ditolak HTTP 401.

**Perbaikan**: periksa `is_active` saat autentikasi dan saat validasi token.
**Dampak**: pegawai yang sudah tidak bertugas masih bisa mengakses sistem.

### A3. Backlog tidak dapat dimasukkan ke sprint (skenario 4.1-3) — SELESAI
Tidak ada kontrol untuk menambahkan item backlog ke sprint di antarmuka manapun.
Modal `AddBacklogToSprintModal` ("Select Backlog for Sprint") sudah dirender di halaman detail
proyek, tetapi pemicunya `setAddBacklogOpen(true)` **tidak pernah dipanggil di mana pun**.
Tidak ada jalur alternatif — satu-satunya kode yang menetapkan `sprint_id` ke item backlog
berada di dalam modal yang tak terjangkau itu.

**Dampak**: sprint tidak dapat diisi pekerjaan; papan Kanban tetap kosong (`0 tasks total`).

### A4. Form Edit Dokumen terbuka kosong (skenario 4.2-5) — SELESAI
Modal "Edit Document" terbuka dengan seluruh isian kosong. Tombol *Save* nonaktif karena
validasi mensyaratkan judul dan kategori terisi, sehingga metadata dokumen tidak dapat diubah.

**Penyebab**: pada `DocModal`, state form diinisialisasi dari `editData` via `useState`. Nilai
awal `useState` hanya dievaluasi saat mount pertama, sedangkan `editData` baru terisi ketika
pengguna menekan Edit — dan tidak ada `useEffect` yang menyinkronkan ulang.

**Risiko tambahan**: bila pengguna mengetik ulang seluruh field agar Save aktif, field yang
tidak diketik ulang berpotensi menimpa metadata lama dengan nilai kosong.

### A5. Filter beban kerja per anggota tidak tersedia (skenario 3.4.4-2) — SELESAI
Halaman `/workload` hanya menyediakan penyaring Proyek dan Sprint. Tidak ada opsi memilih
anggota tertentu, sedangkan dokumen mengharapkan "pilih nama anggota dari filter".

### Rincian perbaikan yang diterapkan

**A1 — `svc-storage/TteSignRequestController.php`, `svc-storage/EsignController.php`,
`svc-project/ChangeRequestController.php`**: parameter `'appearance' => 'INVISIBLE'` diganti menjadi
`'tampilan' => 'INVISIBLE'`. Terbukti: dengan `appearance` layanan gagal 504 setelah 60 detik; dengan
`tampilan` berhasil HTTP 200 dalam 1,4 detik pada berkas dan kredensial yang sama.
Uji ulang: 4 penandatangan berurutan seluruhnya berhasil (1,4–1,9 detik), dokumen menjadi "Fully Signed",
dan penandatangan di luar giliran ditolak HTTP 422.

**A2 — `svc-auth/AuthService.php`** menambahkan `is_active => true` sebagai syarat kredensial, dan
**`svc-auth/EnsureActiveUser.php`** (baru) dipasang pada seluruh grup rute terproteksi di `routes/api.php`.
Catatan: middleware kustom `App\Http\Middleware\JwtMiddleware` di svc-auth ternyata **tidak pernah dipakai**
— rute memakai `Tymon\JWTAuth\Http\Middleware\Authenticate`. Karena itu perbaikan dipasang sebagai
middleware terpisah, bukan di dalam `JwtMiddleware`.
Uji ulang: login akun nonaktif ditolak HTTP 401; token lama ditolak HTTP 403; akun aktif tidak terpengaruh.

**A3 — `ui-web/src/app/projects/[id]/page.tsx`**: ditambahkan tombol "Add Backlog" pada kartu sprint
(tampil selama sprint belum selesai) yang memanggil `setAddBacklogOpen(true)`.
Uji ulang: item backlog berhasil dimasukkan, terverifikasi `sprint_id` terisi di basis data.

**A4 — `ui-web/src/app/documents/page.tsx`** menambahkan `useEffect` yang menyinkronkan state form dari
`editData` setiap modal dibuka, dan **`ui-web/src/lib/api.ts`** mengubah `documentService.update` dari
`PUT` multipart menjadi `POST` dengan `_method=PUT`. Cacat kedua ini baru terlihat setelah cacat pertama
diperbaiki: PHP tidak mem-parsing badan multipart pada metode `PUT`, sehingga payload sampai kosong dan
pembaruan "berhasil" tanpa mengubah data.
Uji ulang: form terisi otomatis, perubahan tersimpan dan `updated_at` diperbarui.

**A5 — `ui-web/src/app/workload/page.tsx`**: ditambahkan dropdown pemilihan anggota yang menyaring tabel
sekaligus kartu ringkasan (AVG UTILISATION, OVERLOADED, AVAILABLE), dan otomatis direset saat proyek atau
sprint diganti.

---

## B. Catatan kualitas dan ketidaksesuaian dokumen

### B0. Token lintas layanan belum dicabut saat akun dinonaktifkan — **tindak lanjut prioritas**
Penonaktifan kini langsung berlaku pada `svc-auth` (login ditolak, token ditolak 403). Namun layanan lain
(`svc-project`, `svc-storage`, dan seterusnya) memvalidasi JWT secara lokal tanpa memeriksa status akun,
sehingga token yang terbit sebelum penonaktifan masih dapat mengakses layanan tersebut sampai kedaluwarsa
(maksimal 1 jam). Menutup celah ini butuh mekanisme pencabutan bersama antar layanan.

Catatan pendukung: **tidak ada klien Redis terpasang di layanan manapun** (`phpredis` maupun `predis` tidak
tersedia), sehingga pendekatan penanda bersama di Redis tidak dapat dipakai tanpa membangun ulang image.
Konsekuensi lain dari hal yang sama: blacklist token saat logout di `svc-auth` (`Redis::setex`) **tidak pernah
benar-benar berjalan** karena panggilan Redis selalu gagal dan ditelan blok `try/catch`.

### B1. Bahasa antarmuka Inggris vs ekspektasi dokumen Indonesia
Dokumen menuliskan ekspektasi dalam Bahasa Indonesia ("Masuk", "Email atau password salah",
"Tambah Proyek"), sedangkan antarmuka seluruhnya berbahasa Inggris ("Sign in",
"Invalid credentials", "New project"). Fungsional setara, teks tidak sesuai.
**Tindak lanjut**: samakan dokumen dengan UI, atau lokalisasi UI.

### B2. Notifikasi Telegram tertahan `pending` secara senyap
Penerima yang belum memiliki `telegram_chat_id` menghasilkan baris notifikasi telegram
berstatus `pending` selamanya — tanpa `error_message`, tanpa status `failed`/`skipped`.
Operator tidak punya cara mudah mendeteksi notifikasi yang tidak pernah terkirim.
**Tindak lanjut**: beri status eksplisit, mis. `skipped: telegram_chat_id belum diisi`.

### B3. Langkah dokumen tidak sesuai alur aplikasi
| Skenario | Dokumen menyebut | Kondisi aplikasi |
|---|---|---|
| 3.3.2-1, 3.3.3-1 | isi peserta saat menambah kegiatan di `/calendar` | form `/calendar` tidak punya field peserta; hanya ada di `/admin/calendar` |
| 3.3.2-2 | "Klik kegiatan di kalender, pilih Edit" | `/calendar` tidak punya tombol Edit; hanya "+ Add report" (status/notulensi). Edit data kegiatan hanya di `/admin/calendar` |
| 3.4.1-1 | "tetapkan PM" saat membuat proyek | form hanya NAME, DESCRIPTION, START/END DATE, DIVISION; PM ditetapkan lewat anggota proyek |
| 3.4.2-2 | "Buka tab Backlog" | tidak ada tab Backlog; backlog dibuat dari dalam kartu Epic (kartu harus diperluas) |
| 3.4.5-1 | "klik Generate" | tidak ada tombol Generate; laporan tersusun otomatis dan **wajib** memilih sprint |
| 3.5.1-1 | CR tersimpan lalu reviewer dinotifikasi | "Save" hanya menyimpan **draft**; perlu aksi "Submit" terpisah agar alur persetujuan dimulai |
| 3.5.4-1 | filter "status dan rentang tanggal" | hanya tersedia filter status; tidak ada filter periode |
| 4.1-5 | "Selesaikan Sprint" | tombol berlabel "Complete"; tidak mensyaratkan semua task selesai |

### B4. Rekap dokumen asli tidak konsisten
Tabel rekap pada dokumen v3 menuliskan TOTAL 70 skenario pada kolom jumlah namun 74 pada kolom
Pass, sedangkan jumlah baris skenario yang sebenarnya ada pada tabel uji adalah **67**.
Seluruh 67 baris itu sudah diisi pada dokumen hasil.

### B5. Kode debug tertinggal di controller produksi
`AdminCalendarController::store()` memuat sejumlah `Log::info('CALENDAR_DEBUG', ...)`,
`GROUP_IDS_CHECK`, `GROUP_RESP`, `GROUP_DATA`, `GROUP_INSERT`, serta blok duplikat
(`$targetUserId` dan `syncParticipants` ditulis dua kali). Bila file log tidak dapat ditulis,
request **gagal HTTP 500 setelah data terlanjur tersimpan** — pengguna melihat error padahal
kegiatan sudah terbuat.

### B6. Dropdown Status pada form Epic tampil kosong
Nilai bawaan form adalah `active`, sedangkan opsi yang tersedia hanya `todo`, `in_progress`,
`done`, dan nilai yang akhirnya tersimpan di basis data adalah `open`. Tiga kosakata status
tidak konsisten dan dropdown tampak kosong saat modal dibuka.

---

## C. Catatan lingkungan pengujian (bukan cacat produk)

- **Rate limit gateway zona auth** `10r/m` burst `5` (`api-gateway/nginx.conf`). Login
  berturut-turut cepat memicu HTTP 429. Ini kontrol keamanan by design, namun penguji manual
  yang berpindah akun dengan cepat akan mengalaminya — perlu disebut pada panduan UAT.
- **HTTP 500 pada `POST /api/v1/admin/calendar` yang sempat teramati adalah artefak pengujian.**
  Penyebabnya perintah `php artisan` yang dijalankan sebagai `root` lewat `docker exec` sehingga
  `storage/logs/laravel.log` berubah kepemilikan menjadi root dan PHP-FPM (www-data) gagal menulis
  log. Setelah kepemilikan dikembalikan, endpoint kembali membalas HTTP 201. Lihat B5 untuk
  kerapuhan yang membuat hal ini berakibat 500.
- **Peringatan BSrE**: layanan verifikasi mengembalikan `conclusion: VALID` disertai peringatan
  bahwa algoritma RSA 2048 bit tidak lagi dianggap andal untuk pembuatan tanda tangan. Ini berasal
  dari BSrE dan perlu ditindaklanjuti bersama penyedia sertifikat, bukan cacat aplikasi.
- **Administrator tidak termasuk `canManage`** pada halaman detail proyek
  (`kepala_balai`, `kepala_seksi`, `project_manager`, `scrum_master`). Akun administrator tidak
  dapat membuat epic/backlog atau menambah anggota dari halaman tersebut — perlu dikonfirmasi
  apakah ini memang disengaja.

---

## D. Data uji yang dibuat selama pengujian

Data berikut sengaja ditinggalkan sebagai jejak bukti; hapus bila lingkungan akan dipakai ulang.

- Proyek `Proyek UAT 627832` beserta `Epic UAT 627832`, `Backlog UAT 627832`, dan
  `Sprint UAT 627832` (status completed)
- Kegiatan kalender `UAT Rapat Publik …`, `UAT Agenda Peserta … [DIUBAH]`, `UAT Agenda Hari-H …`
- Change Request `CR UAT Setujui …` (approved + tertandatangani TTE) dan `CR UAT Tolak …` (rejected)
- Dokumen e-Sign `Dokumen UAT TTE …` (tertandatangani BSrE)
- Dokumen resmi `Dokumen UAT …` dan berkas `Test sign.pdf` pada Storage
- Pengguna `uat…@test.com` (sebagian dihapus, sebagian ditinggalkan berstatus nonaktif sebagai bukti 3.8.1-4)
- Sprint `Sprint Perbaikan …` berisi `Backlog UAT …` (bukti perbaikan 4.1-3)
- Dokumen multi-TTE `tes dokumen UAT` kini berstatus **Fully Signed** 4/4 (bukti perbaikan 3.6.2-1)
- NIK akun `pdm@test.com` dan `sm@test.com` diisi agar dapat menandatangani (data uji)
- Kata sandi akun uji (`po/pdm/pm/sm/staff/admin@test.com`) diubah menjadi `UatCheck#2026`
