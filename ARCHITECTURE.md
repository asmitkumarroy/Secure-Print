# System Architecture

## High Level Overview

User App
↓
Backend API
↓
Temporary Storage
↓
QR Token Service
↓
Shop Dashboard
↓
Printer

## Components

### User Application

Web: Next.js
Mobile: Flutter

Responsibilities

* File upload
* Print settings
* QR display

### Backend Server

Framework: NestJS

Responsibilities

* Authentication
* Document processing
* QR token generation
* Print job management

### Database

PostgreSQL

Tables

* Users
* Documents
* PrintJobs
* Shops

### File Storage

AWS S3

Rules

* Files encrypted before upload
* Files auto deleted using lifecycle policy

### QR Token Service

QR contains signed token with:

* document ID
* expiry time
* print permissions

### Shop Dashboard

Functions

* QR scanning
* Document preview
* Print control

## Security Architecture

Encryption
AES-256 file encryption

Token Security
JWT signed tokens

Access Control
QR tokens valid only once

Auto Cleanup
Cron job deletes expired files
