# Bukti Verifikasi Teknis (pre-UAT) — ConnectOne

Folder ini memuat bukti dan perkakas pengujian yang menghasilkan dokumen
`../UAT_ConnectOne_v3_HASIL-VERIFIKASI-TEKNIS.docx`.

## Isi

| Berkas / folder | Keterangan |
|---|---|
| `TEMUAN-PENGUJIAN.md` | **Ringkasan temuan** — 5 cacat yang perlu diperbaiki + catatan ketidaksesuaian dokumen |
| `ALL-RESULTS.json` | Hasil 67 skenario: verdict, catatan pengamatan, dan daftar screenshot |
| `shots/` | 168 tangkapan layar bukti (termasuk render output SQL/CLI untuk verifikasi backend) |
| `downloads/` | Berkas hasil unduhan yang diverifikasi (laporan PDF, dokumen tertandatangani TTE) |
| `lib.js` | Harness Playwright: login berjeda (hindari rate limit), tunggu render selesai, screenshot |
| `render-term.js` | Merender output SQL/CLI menjadi PNG agar bisa ditempel sebagai bukti |
| `m*.js` | Skrip pengujian per modul |
| `build_docx.py` | Mengisi tabel dokumen UAT dengan hasil + menyisipkan screenshot |
| `finalize_docx.py` | Menambahkan penanda status dokumen, metadata, dan memperbaiki kesimpulan |

## Menjalankan ulang

```bash
# 1. Backend
cd /home/ymjsty/dev/agrawork && docker compose up -d

# 2. Frontend (memakai .env.local -> API lokal)
cd ui-web && npm run dev

# 3. Pengujian (dari folder ini)
node m31_33.js        # 3.1 Autentikasi, 3.2 Dashboard, 3.3 Kalender
node m35b.js && node m35d.js && node m35e.js && node m35f.js   # 3.5 Change Request
TTE_PASSPHRASE='...' node m36b.js   # 3.6 e-Sign (memanggil BSrE sungguhan)
# ...dst

# 4. Susun dokumen
python3 build_docx.py && python3 finalize_docx.py
```

## Catatan penting

- Passphrase TTE **tidak** disimpan di repositori; diberikan lewat variabel lingkungan
  `TTE_PASSPHRASE` saat menjalankan skrip.
- Kata sandi akun uji diubah menjadi `UatCheck#2026` selama pengujian.
- Pengujian menyentuh layanan luar yang sesungguhnya: notifikasi Telegram benar-benar
  terkirim dan penandatanganan BSrE benar-benar dieksekusi (atas persetujuan pemilik sistem).
