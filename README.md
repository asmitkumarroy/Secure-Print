# SecurePrint

SecurePrint is a privacy-first QR-based print system MVP.

Users upload a document, receive a temporary QR/token, and print from a shop dashboard without permanently sharing files.

## Monorepo Structure

- `backend/`: NestJS API, upload/print lifecycle, token registry, OS print dispatch
- `frontend/`: Next.js web app (upload flow + shop dashboard + scanner)
- `mobile/flutter_app/`: placeholder (out of current MVP scope)

## Latest Implemented Features

### Upload + Token Flow

- Anonymous upload flow (no user account required in MVP)
- Supported file types: PDF, DOCX, PNG, JPG
- File size validation (20MB max)
- PDF page auto-detection (`/documents/page-count`)
- Upload endpoint returns `documentId`, `printToken`, expiry, and print settings
- Configurable token expiry with hard max of 60 minutes

### QR + Shop Operations

- Print job fetch by token (`GET /print/:token`)
- Real QR scanner support on web shop pages (`html5-qrcode`)
- Manual token paste fallback for camera/device issues
- Shop queue with status badges (`ready`, `printing`, `completed`, `expired`, `failed`)

### Preview + Status Safety

- PDF preview endpoint (`GET /print/:token/preview`)
- Live status polling in dashboard (`GET /print/:token/status`)
- Expiry/completion guardrails on backend and frontend
- Preview is blocked after completion/expiry (HTTP 410)
- Scrollable PDF preview panel in shop dashboard

### Print Execution

- Execute print via API (`POST /print/execute`)
- Manual completion endpoint (`POST /print/complete`)
- Windows print dispatch via `Start-Process -Verb Print`
- Windows fallback support for SumatraPDF when default association is missing
- Hidden testing mode for "Microsoft Print to PDF" style save flow (station shortcut)

### Auto Cleanup (Latest)

- Uploaded files are automatically deleted after successful print completion
- Auto-delete runs for both completion paths:
  - `/print/execute` success flow
  - `/print/complete` manual completion flow
- Verified end-to-end: file exists before print, removed after completion

## Current Backend API

### Documents

- `POST /documents/page-count`
- `POST /documents/upload`

### Print

- `GET /print/:token`
- `GET /print/:token/status`
- `GET /print/:token/preview`
- `POST /print/execute`
- `POST /print/complete`

## Local Setup (Windows)

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)

### 2. Backend setup

```powershell
cd "c:\Users\royas\Desktop\Personal-Projects\Secure Print\backend"
copy .env.example .env
npm install
```

Set required variables in `backend/.env`.

### 3. Database setup

```powershell
cd "c:\Users\royas\Desktop\Personal-Projects\Secure Print\backend"
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Frontend setup

```powershell
cd "c:\Users\royas\Desktop\Personal-Projects\Secure Print\frontend"
copy .env.local.example .env.local
npm install
```

### 5. Run services

Backend (port 3000):

```powershell
cd "c:\Users\royas\Desktop\Personal-Projects\Secure Print\backend"
npm run start:dev
```

Frontend (port 3005):

```powershell
cd "c:\Users\royas\Desktop\Personal-Projects\Secure Print\frontend"
npm run dev
```

## Known MVP Gaps

- Token lifecycle/state is currently in-memory (not durable across backend restarts)
- Encryption-at-rest is planned but not finalized in the current code path
- Full production auth/multi-tenant shop controls are pending

## Future Features Roadmap

### Near-Term (Next Iterations)

1. Persist token/job lifecycle in PostgreSQL via Prisma (replace in-memory registry)
2. Add AES-256 document encryption-at-rest and secure key management
3. JWT-signed, one-time-use print tokens with stronger replay protection
4. Scheduled cleanup for expired/unprinted files as a background worker
5. Structured audit logs and operational metrics dashboard

### Product Expansion

1. Shop authentication and role-based access control
2. Queue management enhancements (bulk actions, retries, printer selection)
3. Cloud storage adapter (S3-compatible) with local fallback
4. Payments (UPI/Razorpay) and pricing rules
5. Nearby print-shop discovery and onboarding flow

### Production Hardening

1. Rate limiting and abuse prevention across upload/print endpoints
2. End-to-end automated tests (upload -> scan -> print -> delete)
3. Containerized deployment and CI/CD pipelines
4. Observability (health checks, traces, alerting)
