# Project Management System: Microservices (Laravel + Next.js)

## Architecture

```
                    ┌─────────────┐
     Internet ─────►  api-gateway │ :8000  (Nginx, rate-limit, routing)
                    └──────┬──────┘
                           │
          ┌────────────────┼─────────────────┐
          ▼                ▼                 ▼
    ┌──────────┐   ┌──────────────┐  ┌─────────────┐
    │ svc-auth │   │ svc-project  │  │svc-workload │
    └──────────┘   └──────────────┘  └─────────────┘
          │                │                 │
          └────────────────┼─────────────────┘
                           │ (shared PostgreSQL)
                    ┌──────┴──────┐
                    │  PostgreSQL │  pm_db
                    └─────────────┘
    
    ┌──────────────────┐  ┌──────────────┐  ┌─────────────┐
    │ svc-notification │  │ svc-reporting│  │ svc-storage │
    └──────────────────┘  └──────────────┘  └─────────────┘
```

## Services

| Service           | Port (internal) | Responsibility                        |
|-------------------|-----------------|---------------------------------------|
| api-gateway       | 8000            | Reverse proxy, rate limiting          |
| svc-auth          | 80              | JWT auth, users, roles (Spatie)       |
| svc-project       | 80              | Projects, sprints, epics, tasks       |
| svc-workload      | 80              | Capacity, burndown, velocity          |
| svc-notification  | 80              | Telegram bot, notification settings  |
| svc-reporting     | 80              | Reports per sprint/division/time      |
| svc-storage       | 80              | File upload/download                  |

## Quick Start

```bash
# 1. Clone and setup env
cp .env.example .env
# Fill in JWT_SECRET and TELEGRAM_BOT_TOKEN

# 2. For each service, setup env
for svc in svc-auth svc-project svc-workload svc-notification svc-reporting svc-storage; do
  cp $svc/.env.example $svc/.env
  # edit $svc/.env as needed
done

# 3. Start all services
docker compose up -d

# 4. Run migrations (run once: all services share the same DB)
docker exec pm_svc_auth php artisan migrate --seed
docker exec pm_svc_project php artisan migrate
docker exec pm_svc_workload php artisan migrate
docker exec pm_svc_notification php artisan migrate

# 5. Verify
curl http://localhost:8000/health
```

## Key Design Decisions

### Security (Secure by Design)
- **JWT** via `tymon/jwt-auth`: stateless, role claims embedded in token
- **Spatie Laravel Permission**: role-based access with Policy layer
- **InternalRequestMiddleware**: `/v1/internal/*` endpoints only accessible from Docker network
- **API Gateway** blocks `/v1/internal/*` from external traffic
- **Rate limiting** per zone (auth: 10rpm, api: 60rpm)
- **Soft deletes** on all critical models
- **Input validation** via FormRequest on all endpoints

### Service Communication
- Services call each other via HTTP using `AUTH_SERVICE_URL` etc.
- `/v1/internal/users/{id}`: fast user lookup without JWT (internal only)
- Notification is fire-and-forget (queued via Redis)

### Database
- Shared PostgreSQL (`pm_db`): simpler ops, cross-table queries work natively
- Each service still owns its own migrations
- UUID primary keys everywhere

## API Examples

```bash
# Login
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Create project (kepala_balai only)
curl -X POST http://localhost:8000/v1/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sprint Q1","description":"..."}'

# Assign task
curl -X POST http://localhost:8000/v1/tasks/{taskId}/assign \
  -H "Authorization: Bearer <token>" \
  -d '{"assignee_id":"<uuid>"}'
  # → triggers Telegram notification to assignee
```
