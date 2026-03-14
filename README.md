# SecurePrint

SecurePrint is a privacy-first QR-based print system MVP.

This repository now includes implementation scaffolding for:

- `backend/` (NestJS + Prisma + PostgreSQL)
- `frontend/` (Next.js web app)
- `mobile/flutter_app/` (placeholder, out of MVP scope)

## Canonical MVP Decisions

- Database: PostgreSQL from day 1
- Security: encryption and upload validation are mandatory in early implementation
- User model: anonymous uploads allowed for MVP
- Platform scope: web-only MVP
- Expiry policy: configurable, max 60 minutes

## Local Setup (Windows)

### 1. Install prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)

### 2. Configure backend

```powershell
cd "c:\Users\royas\Desktop\Personal-Projects\Secure Print\backend"
copy .env.example .env
npm install
```

Update `backend/.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY`

### 3. Create database schema

```powershell
cd "c:\Users\royas\Desktop\Personal-Projects\Secure Print\backend"
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Configure frontend

```powershell
cd "c:\Users\royas\Desktop\Personal-Projects\Secure Print\frontend"
copy .env.local.example .env.local
npm install
```

### 5. Run apps

Backend (port `3000`):

```powershell
cd "c:\Users\royas\Desktop\Personal-Projects\Secure Print\backend"
npm run start:dev
```

Frontend (port `3001`):

```powershell
cd "c:\Users\royas\Desktop\Personal-Projects\Secure Print\frontend"
npm run dev -- -p 3001
```

## Current API Skeleton

- `POST /documents/upload`
- `GET /print/:token`
- `POST /print/complete`
- `POST /qr/preview`
- `GET /shops`, `POST /shops`
- `GET /users`, `POST /users`
- `POST /auth/session`

## Next Implementation Steps

1. Replace in-memory placeholders with Prisma persistence.
2. Add AES-256 encryption/decryption for document bytes.
3. Sign and verify single-use print tokens with JWT.
4. Add S3-backed storage adapter (with local fallback).
5. Implement shop-side QR camera scanner.
