# SecurePrint — Repository Bootstrap Prompt

You are a senior software architect responsible for bootstrapping a production-grade repository for a startup called **SecurePrint**.

Your task is to generate the **initial repository structure and core application scaffolding** for this project.

Follow all architecture and security rules strictly.

---

# Product Summary

SecurePrint is a privacy-first document printing platform.

Users upload documents and receive a temporary QR code. Cyber cafes scan the QR code to retrieve the document and print it. After printing, the document is automatically deleted.

This prevents sensitive documents from being stored on public computers.

---

# Repository Structure

Create the following repository structure.

secureprint
│
├ PRD.md
├ ARCHITECTURE.md
├ DATABASE.md
├ PROJECT_TASKS.md
├ AI_AGENT_RULES.md
├ STARTUP_MASTER_PROMPT.md
├ REPO_BOOTSTRAP_PROMPT.md
│
├ backend
│   ├ src
│   │   ├ auth
│   │   ├ users
│   │   ├ documents
│   │   ├ qr
│   │   ├ print
│   │   ├ shops
│   │   ├ common
│   │   └ config
│   │
│   ├ prisma
│   │   └ schema.prisma
│   │
│   ├ package.json
│   └ tsconfig.json
│
├ frontend
│   ├ pages
│   ├ components
│   ├ services
│   ├ utils
│   ├ package.json
│   └ next.config.js
│
└ mobile
└ flutter_app

---

# Backend Requirements

Framework

NestJS (Node.js + TypeScript)

ORM

Prisma

Database

PostgreSQL

Storage

AWS S3

Authentication

JWT

QR Code

qrcode library

---

# Backend Modules

Create these NestJS modules:

AuthModule
UsersModule
DocumentsModule
QrModule
PrintModule
ShopsModule

Each module must contain:

controller
service
dto
entity

Follow NestJS modular architecture.

---

# Core Backend Features

Document Upload API

POST /documents/upload

Responsibilities:

* validate file type
* enforce file size limits
* encrypt file
* upload to AWS S3
* generate QR token
* return QR image

---

QR Generation

Generate QR codes containing signed tokens.

Example URL

https://secureprint.app/print/{token}

---

Print Retrieval API

GET /print/:token

Responsibilities

* verify token
* check expiry
* fetch document URL
* return print settings

---

Print Completion

POST /print/complete

Responsibilities

* mark print job completed
* delete file from storage
* invalidate token

---

# Database Schema

Users

id
email
name
password_hash
created_at

Documents

id
user_id
file_url
expiry_time
status
created_at

PrintJobs

id
document_id
shop_id
pages
copies
color_mode
status
created_at

Shops

id
name
location
owner_email
created_at

---

# Frontend Requirements

Framework

Next.js (React)

Pages

Home
Upload
QR Display
Shop Dashboard
Scanner

---

# Frontend Features

User Upload Page

* upload file
* configure print settings
* generate QR

QR Display Page

* show QR code
* show expiry timer

Shop Dashboard

* login
* QR scanner
* document preview
* print button

---

# Mobile App

Create Flutter project scaffold.

Future features:

* upload documents
* generate QR codes
* locate nearby printers

---

# Security Rules

Documents must never be stored permanently.

All documents expire automatically.

Maximum file size

20 MB

Allowed file types

PDF
DOCX
JPG
PNG

Tokens must be:

signed
time limited
single use

---

# Dev Environment

Backend

Node.js 18+

Frontend

Node.js 18+

Database

PostgreSQL

Environment variables must be used for:

DATABASE_URL
JWT_SECRET
AWS_ACCESS_KEY
AWS_SECRET_KEY

---

# Development Phases

Phase 1

Backend core setup

Phase 2

Document upload + QR generation

Phase 3

Shop dashboard + scanner

Phase 4

Print workflow

Phase 5

Auto delete system

---

# Code Quality

Use TypeScript.

Use dependency injection.

Follow REST API design.

Write modular, maintainable code.

Add comments explaining logic.

---

# AI Implementation Instructions

When generating the repository:

1 Generate all folder structures.
2 Generate base NestJS modules.
3 Create Prisma schema.
4 Create basic Next.js frontend pages.
5 Add README instructions.
6 Ensure code compiles successfully.

The generated repository must be ready to run locally with minimal setup.
