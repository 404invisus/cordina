# ConnectOne

Platform manajemen kerja internal terintegrasi untuk BLPID (Balai Layanan Penghubung Identitas Digital), BSSN. Dibangun dengan arsitektur microservices Laravel 11 + Next.js.

## Modul

- Manajemen proyek, sprint, epic, task (Kanban board, roadmap Gantt)
- Change Request (CR) dengan penandatanganan TTE
- Kalender kegiatan (personal, tim, dan grup) dengan ekspor PDF
- Monitoring workload (kapasitas, burndown, velocity)
- Pelaporan analitik per sprint, divisi, dan periode
- Manajemen dokumen resmi dan aset fisik
- e-Sign / TTE via BSrE (single dan multi-signer serial, verifikasi, audit trail, distribusi dokumen)
- Manajemen grup pengguna (partisipan kalender, distribusi TTE, notifikasi grup Telegram)
- Notifikasi in-app dan Telegram (termasuk pengingat deadline H-1/H-0)
- Panel admin (manajemen user, role, permission, activity log, login history)

## Arsitektur

```
                    ┌─────────────┐
     Internet ─────►  api-gateway │ :8000  (Nginx, rate-limit, routing)
                    └──────┬──────┘
                           │
     ┌───────────┬─────────┼──────────┬───────────────┐
     ▼           ▼         ▼          ▼               ▼
 ┌────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
 │svc-auth│ │svc-     │ │svc-    │ │svc-      │ │svc-      │
 │        │ │project  │ │workload│ │notif.    │ │reporting │
 └────┬───┘ └────┬────┘ └───┬────┘ └────┬─────┘ └────┬─────┘
      │          │          │           │            │
      └──────────┴────┬─────┴───────────┴────────────┘
                      │
               ┌──────┴──────┐   ┌───────────┐   ┌───────────┐
               │ PostgreSQL  │   │   Redis   │   │ esign-api │──► BSrE
               │ pm_postgres │   │  pm_redis │   │    (Go)   │
               └─────────────┘   └───────────┘   └───────────┘

 Frontend: ui-web (Next.js) berjalan di luar Docker via `npm run dev`
```

## Services

| Service                  | Container              | Keterangan                                        |
|--------------------------|------------------------|---------------------------------------------------|
| api-gateway              | pm_gateway (:8000)     | Reverse proxy, rate limiting                      |
| svc-auth                 | pm_svc_auth            | JWT auth, users, roles, permissions (Spatie)      |
| svc-project              | pm_svc_project         | Projects, sprints, epics, tasks, CR, kalender     |
| svc-workload             | pm_svc_workload        | Kapasitas, burndown, velocity                     |
| svc-workload-scheduler   | pm_workload_scheduler  | Scheduler (pengingat deadline H-1/H-0)            |
| svc-notification         | pm_svc_notification    | Notifikasi in-app dan Telegram                    |
| svc-notification-worker  | pm_notif_worker        | Queue worker notifikasi                           |
| svc-reporting            | pm_svc_reporting       | Laporan PDF (DomPDF)                              |
| svc-storage              | pm_svc_storage         | Upload/download file                              |
| esign-api                | pm_esign_api           | Wrapper Go untuk BSrE (sign, verify, seal)        |
| postgres                 | pm_postgres (:5433)    | PostgreSQL 16, database per service               |
| redis                    | pm_redis (:6379)       | Cache dan queue                                   |
| ui-web                   | (di luar Docker)       | Frontend Next.js, TypeScript, Tailwind            |

## Quick Start

```bash
# 1. Setup env root
cp .env.example .env
# Isi JWT_SECRET dan TELEGRAM_BOT_TOKEN

# 2. Setup env per service
for svc in svc-auth svc-project svc-workload svc-notification svc-reporting svc-storage esign-api; do
  cp $svc/.env.example $svc/.env
done

# 3. Start semua service backend
docker compose up -d --build

# 4. Migrasi database
docker exec pm_svc_auth php artisan migrate --seed
docker exec pm_svc_project php artisan migrate
docker exec pm_svc_workload php artisan migrate
docker exec pm_svc_notification php artisan migrate

# 5. Jalankan frontend
cd ui-web && npm install && npm run dev

# 6. Verifikasi
curl http://localhost:8000/health
```

## Catatan Pengembangan

- `svc-auth` dan `svc-project` perlu `docker compose build` setelah perubahan kode. Service lain cukup restart karena folder `app/` di-mount sebagai volume.
- `api-gateway/nginx.conf` tidak di-mount, wajib `docker compose build api-gateway` setiap ada perubahan.
- `docker/nginx.conf` dipakai bersama oleh semua service PHP, rebuild service terkait jika diubah.
- Komunikasi ke BSrE melalui `esign-api` (Go) dengan keep-alive dimatikan. Panggil `GET /health` esign-api sebelum request sign (warmup koneksi).
- Batas ukuran file BSrE sign PDF sekitar 500KB.
- Gunakan `check_sync.sh` untuk verifikasi sinkronisasi file antara host dan container.

## Desain Keamanan

- JWT stateless via `tymon/jwt-auth`, role claims tertanam di token
- Spatie Laravel Permission untuk RBAC dengan lapisan permission per user
- Endpoint `/v1/internal/*` hanya bisa diakses dari jaringan Docker, diblokir gateway dari trafik eksternal
- Rate limiting per zona (auth: 10rpm, api: 60rpm)
- Soft delete pada semua model kritikal
- Validasi input via FormRequest
- Audit trail untuk aktivitas TTE dan admin activity log
