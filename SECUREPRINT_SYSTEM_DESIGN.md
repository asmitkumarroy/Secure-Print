# SecurePrint — System Design Document

## 1. System Overview

SecurePrint is a privacy-first QR-based document printing platform.

Users upload documents through a web or mobile application. The system generates a temporary QR code that can be scanned by cyber cafe operators to retrieve and print the document.

After printing, the document is automatically deleted from storage.

The system is designed to prevent sensitive documents from being stored on public computers.

---

# 2. High-Level Architecture

User App (Web / Mobile)
↓
API Gateway
↓
Backend Services
↓
Temporary File Storage
↓
QR Token Service
↓
Shop Dashboard
↓
Printer

---

# 3. Core Components

## 3.1 User Application

Platforms

Web Application
Mobile Application

Technologies

Next.js (React)
Flutter (Mobile)

Responsibilities

Upload documents
Select print settings
Generate QR code
Display QR code to shop operator

---

## 3.2 API Gateway

The API gateway acts as the entry point for all client requests.

Responsibilities

Authentication
Request routing
Rate limiting
Security validation

Technology

NestJS Gateway Layer

---

## 3.3 Backend Services

Backend services handle business logic.

Technology

NestJS (Node.js + TypeScript)

Services

Auth Service
Document Service
QR Service
Print Job Service
Shop Service

---

## 3.4 Database Layer

Primary Database

PostgreSQL

ORM

Prisma

Tables

Users
Documents
PrintJobs
Shops

---

# 4. File Storage System

Documents are stored temporarily using cloud object storage.

Technology

AWS S3

Key characteristics

Temporary storage
Encrypted files
Lifecycle deletion rules

Storage rules

Maximum storage duration: 30 minutes

---

# 5. QR Token System

Each uploaded document generates a temporary QR token.

Token contains

documentId
expiryTime
signature

Format

https://secureprint.app/print/{token}

Token technology

JWT

Security properties

Time-limited
Single-use
Signed tokens

---

# 6. Document Lifecycle

1 User uploads document

2 File encrypted locally or server-side

3 File uploaded to temporary storage

4 QR token generated

5 QR code displayed to user

6 Shop scans QR code

7 Document retrieved from storage

8 Document printed

9 Document deleted

---

# 7. Shop Dashboard

Cyber cafe operators access a web dashboard.

Features

Login authentication
QR scanner using camera
Document preview
Print button
Print job status

Technology

Next.js dashboard interface

QR scanning library

html5-qrcode

---

# 8. Print Workflow

User uploads document
↓
QR generated
↓
Shop scans QR
↓
Backend validates token
↓
Document fetched
↓
Preview shown
↓
Print command executed
↓
Document deleted

---

# 9. Security Architecture

Security is the primary design goal.

Security layers

Encrypted storage
Signed tokens
Token expiration
File type validation
File size limits

Allowed file types

PDF
DOCX
PNG
JPG

Maximum upload size

20MB

---

# 10. Automatic Cleanup System

Expired documents must be automatically removed.

Mechanisms

Cron jobs
S3 lifecycle rules

Cron job frequency

Every 5 minutes

Cleanup actions

Delete expired files
Invalidate expired tokens
Mark document status as expired

---

# 11. Scalability Strategy

The system should scale to support thousands of users and print shops.

Scaling approach

Stateless backend servers
Horizontal scaling
Cloud storage

Infrastructure

Docker containers
Kubernetes (future)

Load balancing

AWS Load Balancer

---

# 12. Future Microservices Architecture

As the system grows, services can be separated.

Auth Service
Document Service
Print Service
Payment Service
Notification Service

Communication

REST APIs
Message queues

Message queue technology

Redis
Kafka (future scaling)

---

# 13. Print Agent (Future Feature)

For advanced automation, shops can install a local print agent.

Responsibilities

Connect to backend server
Retrieve documents automatically
Send jobs directly to printer

Technology

Node.js background service

Benefits

Fully automated printing
No manual dashboard interaction

---

# 14. Monitoring and Logging

Monitoring tools

Prometheus
Grafana

Logging

Centralized logging system

Log events

Upload events
Print events
Security violations

---

# 15. Cost Optimization Strategy

To keep infrastructure costs low

Use serverless storage
Use auto-scaling servers
Use short file retention

Cost drivers

Storage usage
API requests
Bandwidth

Optimization

Aggressive auto deletion
File compression

---

# 16. Deployment Strategy

Backend

Docker containers

Frontend

Vercel or Netlify

Database

Managed PostgreSQL

Storage

AWS S3

---

# 17. Reliability Design

The system must handle failures gracefully.

Mechanisms

Retry mechanisms
Graceful error handling
Fallback document retrieval

Failure scenarios

Expired token
File not found
Printer unavailable

---

# 18. Performance Targets

QR generation time

Under 1 second

Document retrieval

Under 2 seconds

System uptime

99.9%

---

# 19. Long-Term Vision

SecurePrint will evolve into a nationwide printing network.

Future capabilities

Nearby printer discovery
UPI payments
Document scanning
DigiLocker integration
Self-service printing kiosks

The architecture must allow these features to be added without major redesign.

---

# End of System Design
