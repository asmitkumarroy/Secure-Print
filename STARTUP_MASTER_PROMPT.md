# SecurePrint — Startup Master Prompt

You are a senior software architect and startup engineer.

Your task is to design and implement a scalable production-ready platform called **SecurePrint**.

Follow the architecture and requirements defined below.

Do not simplify the system. Build it using clean modular architecture suitable for a real startup product.

---

# Product Overview

SecurePrint is a privacy-first document printing platform.

Users upload documents and receive a temporary QR code. The QR code can be scanned at cyber cafes to securely retrieve the document and print it.

After printing, the document is automatically deleted.

The goal is to prevent sensitive documents from being stored on public computers.

---

# Problem Statement

Cyber cafes currently print documents through:

* WhatsApp
* Email
* USB drives

This creates privacy risks because files remain on shop computers.

SecurePrint enables **temporary secure printing** using QR-based access tokens.

---

# Core Workflow

User uploads document
↓
System encrypts file
↓
File stored temporarily
↓
QR code generated
↓
Cyber cafe scans QR
↓
Document retrieved
↓
Document printed
↓
File automatically deleted

---

# Tech Stack

Backend

NestJS (Node.js + TypeScript)

Frontend Web

Next.js (React)

Mobile App

Flutter

Database

PostgreSQL

ORM

Prisma

Storage

AWS S3

Authentication

JWT

QR Generation

qrcode library

---

# Core Backend Modules

Generate a modular NestJS backend with these modules:

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

Follow NestJS best practices.

---

# Database Models

Users

* id
* email
* name
* password_hash
* created_at

Documents

* id
* user_id
* file_url
* expiry_time
* status
* created_at

PrintJobs

* id
* document_id
* shop_id
* pages
* copies
* color_mode
* status
* created_at

Shops

* id
* name
* location
* owner_email
* created_at

---

# API Endpoints

Document Upload

POST /documents/upload

Returns

documentId
qrCode
expiryTime

---

Fetch Document For Printing

GET /print/:token

Returns

documentUrl
printSettings

---

Mark Print Complete

POST /print/complete

Deletes document.

---

# Security Requirements

All documents must be encrypted before storage.

Documents must automatically expire within 30 minutes.

QR tokens must:

* expire
* be single-use
* be signed

Maximum file size: 20MB

Allowed file types:

* PDF
* DOCX
* JPG
* PNG

---

# QR Token Format

QR code must contain a signed token.

Example

https://secureprint.app/print/{token}

Token payload

documentId
expiryTime
signature

---

# Shop Dashboard

Build a dashboard for cyber cafe operators.

Features

* login
* QR scanner
* document preview
* print button

Use browser-based QR scanning.

---

# Document Deletion

Implement automatic cleanup using scheduled tasks.

Expired files must be deleted automatically.

Use cron jobs.

---

# Folder Structure

Backend

src
auth
users
documents
qr
print
shops

Frontend

pages
components
services
utils

---

# Development Strategy

Follow this order:

1 Backend core setup
2 Document upload system
3 QR generation
4 Shop dashboard
5 Print workflow
6 Auto delete system

---

# Code Quality Requirements

Use TypeScript.

Use dependency injection.

Follow modular architecture.

Write readable, production-grade code.

Add comments explaining logic.

Avoid monolithic files.

---

# Long-Term Vision

SecurePrint will evolve into a nationwide print network.

Future features include:

* nearby printer discovery
* UPI payments
* document scanning
* DigiLocker printing
* self-service print kiosks

Design the architecture so these features can be added later.

---

# AI Instructions

When generating code:

* follow the architecture exactly
* ensure security best practices
* avoid unnecessary dependencies
* prefer maintainable scalable code
* add clear documentation
