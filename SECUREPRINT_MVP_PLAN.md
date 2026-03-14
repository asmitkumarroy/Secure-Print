# SECUREPRINT_MVP_PLAN

## Goal
Build a privacy-first QR-based print system MVP: user uploads document → QR generated → shop scans → print → auto delete.

## Timeline: 6 weeks (focused, single-developer MVP)

### Week 0 — Prep (1–2 days)
- Create repo + add project docs (PRD, ARCHITECTURE, TASKS).
- Set up basic dev environment (Node.js 18+, pnpm/npm, Postgres or SQLite).
- Decide local vs cloud storage (start local).

### Week 1 — Backend Core (Days 1–7)
- Scaffold NestJS project (or lightweight Express for faster MVP).
- Add Prisma schema, run initial migration (use SQLite for local dev).
- Implement basic Auth (email/password optional — can be placeholder).
- Implement file upload route with Multer; save to local `uploads/` initially.
- Implement JWT token generation service for print tokens.

**Deliverable:** Upload endpoint that returns `documentId` + `printToken` + `qrDataUrl`.

### Week 2 — QR + Print Flow (Days 8–14)
- Add QR generation (qrcode lib).
- Implement GET /print/:token endpoint (validates token, returns file URL + print settings).
- Implement simple POST /print/complete to mark printed and remove file.
- Implement scheduled cleanup (cron every 5 min) to delete expired files.

**Deliverable:** Full upload → QR → fetch-by-token → delete flow.

### Week 3 — Frontend MVP (Days 15–21)
- Create Next.js frontend with Upload page: upload file, choose print settings, show QR.
- Create Shop dashboard page with camera QR scanner (html5-qrcode).
- On scan: call /print/:token to preview and allow Print button (browser print or download).

**Deliverable:** End-to-end demo: upload on laptop/phone, show QR, scan with shop dashboard, print, file deleted.

### Week 4 — Hardening + Local Integrations (Days 22–28)
- Add file type & size validation (20MB).
- Add AES encryption before upload (optional server side; or simple at-rest encryption for MVP).
- Add rate limiting and small abuse protection.
- Replace local storage with AWS S3 integration (optional; fallback to local).

**Deliverable:** Secure file handling + S3 switchable.

### Week 5 — Shop UX + Automation (Days 29–35)
- Build shop login + print job queue.
- Add print job logs (no file content stored).
- Add one-time usage enforcement and expiry checks.

**Deliverable:** Shop onboarding flow and dashboard.

### Week 6 — Testing, Deploy & Onboard (Days 36–42)
- Run E2E tests (upload → scan → print → delete).
- Dockerize backend and frontend.
- Deploy backend (simple EC2 or Heroku) + frontend (Vercel).
- Onboard 2–3 local shops for beta testing.

**Deliverable:** Public MVP, first shops onboarded.

## Metrics to track (MVP)
- Upload success rate
- Print success rate (print jobs completed)
- Mean time from upload → print
- Number of copies/pages printed
- Number of expired unprinted documents (waste)

## Next steps after MVP
- Payment integration (UPI/Razorpay)
- Nearby printer discovery
- Print agent for automatic prints
- DigiLocker integration