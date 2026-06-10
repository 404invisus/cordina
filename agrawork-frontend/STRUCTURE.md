# Agrawork Frontend Structure

## Tech Stack
- Next.js 14+ App Router
- Tailwind CSS
- Zustand (state)
- TanStack Query (data fetching)
- Framer Motion (animations)
- Recharts (charts)
- Primary color: #284074

## Pages
### Public
- / (Landing Page - 5 sections)
- /login

### Auth Protected
- /dashboard (redirect by role)
- /dashboard/kepala-balai
- /dashboard/kepala-seksi  
- /dashboard/project-manager
- /dashboard/scrum-master
- /dashboard/staff
- /dashboard/superadmin

### Features
- /projects
- /projects/[id]
- /projects/[id]/board (Kanban)
- /projects/[id]/roadmap (Gantt)
- /projects/[id]/sprints
- /tasks
- /tasks/[id]
- /workload
- /workload/assignments
- /reports
- /notifications
- /settings/profile
- /settings/notifications
- /admin (superadmin)

## Components
- Layout: Header, Footer, Sidebar, MobileNav
- UI: Button, Card, Modal, Badge, Avatar, Tooltip
- Forms: Input, Select, DatePicker, FileUpload
- Data: Table, KanbanBoard, GanttChart, BurndownChart
- Notifications: NotifBell, NotifItem
