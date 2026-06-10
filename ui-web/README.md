# Agrawork Frontend

Frontend Next.js 14 untuk platform manajemen proyek Agrawork.

## Tech Stack

- **Next.js 14**: App Router
- **TypeScript**
- **Tailwind CSS**
- **Zustand**: State management
- **TanStack Query**: Data fetching & caching
- **Framer Motion**: Animasi
- **Recharts**: Grafik & chart
- **React Hook Form**: Form handling
- **Axios**: HTTP client
- **react-hot-toast**: Notifications

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Konfigurasi environment

Edit file `.env.local` dan sesuaikan URL setiap service:

```env
NEXT_PUBLIC_AUTH_URL=http://localhost:8001
NEXT_PUBLIC_PROJECT_URL=http://localhost:8002
NEXT_PUBLIC_WORKLOAD_URL=http://localhost:8003
NEXT_PUBLIC_NOTIFICATION_URL=http://localhost:8004
NEXT_PUBLIC_REPORT_URL=http://localhost:8005
NEXT_PUBLIC_STORAGE_URL=http://localhost:8006
```

### 3. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 4. Build untuk production

```bash
npm run build
npm start
```

## Halaman

| Halaman | Path | Deskripsi |
|---------|------|-----------|
| Landing Page | `/` | Landing page publik |
| Login | `/login` | Halaman login |
| Dashboard | `/dashboard` | Auto-redirect sesuai role |
| Dashboard Product Owner | `/dashboard/kepala-balai` | Overview semua project & tim |
| Dashboard Product Manager | `/dashboard/kepala-seksi` | Supervisi workload |
| Dashboard Project Manager | `/dashboard/project-manager` | Kelola sprint & task |
| Dashboard Scrum Master | `/dashboard/scrum-master` | Sprint & burndown |
| Dashboard Staff | `/dashboard/staff` | Task pribadi |
| Dashboard Super Admin | `/dashboard/superadmin` | Admin panel |
| Projects | `/projects` | Daftar semua project |
| Project Detail | `/projects/[id]` | Detail project + tabs |
| Kanban Board | `/projects/[id]/board` | Board view task |
| Roadmap | `/projects/[id]/roadmap` | Timeline Gantt |
| Tasks | `/tasks` | Semua task |
| Task Detail | `/tasks/[id]` | Detail + komentar + log waktu |
| Workload | `/workload` | Burndown & velocity chart |
| Reports | `/reports` | Laporan analitik |
| Notifications | `/notifications` | Riwayat notifikasi |
| Storage | `/storage` | Upload & kelola file |
| Settings | `/settings` | Profil & Telegram config |
| Admin Users | `/admin/users` | Manajemen user & role |

## Roles

| Role | Akses |
|------|-------|
| `kepala_balai` | Full akses termasuk buat project & kelola user |
| `kepala_seksi` | Supervisi project, buat sprint/task |
| `project_manager` | Kelola sprint, assign task, laporan |
| `scrum_master` | Kelola sprint, burndown, velocity |
| `staff` | Update task sendiri, log waktu, komentar |
| `superadmin` | Akses admin panel sistem |

## Akun Testing

| Email | Password | Role |
|-------|----------|------|
| po@test.com | namamuji | Product Owner |
| pdm@test.com | namamuji | Product Manager |
| pm@test.com | namamuji | Project Manager |
| sm@test.com | namamuji | Scrum Master |
| staff@test.com | namamuji | Staff |

## Struktur Folder

```
src/
├── app/
│   ├── page.tsx
│   ├── login/
│   ├── dashboard/
│   │   ├── kepala-balai/
│   │   ├── kepala-seksi/
│   │   ├── project-manager/
│   │   ├── scrum-master/
│   │   ├── staff/
│   │   └── superadmin/
│   ├── projects/
│   │   └── [id]/
│   │       ├── board/
│   │       └── roadmap/
│   ├── tasks/
│   │   └── [id]/
│   ├── workload/
│   ├── reports/
│   ├── notifications/
│   ├── storage/
│   ├── settings/
│   └── admin/users/
├── components/
│   ├── layout/
│   ├── ui/
│   └── charts/
├── lib/
│   ├── api.ts
│   └── utils.ts
└── store/
    └── authStore.ts
```
