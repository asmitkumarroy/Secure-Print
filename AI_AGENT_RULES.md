# AI Coding Agent Instructions

This repository is designed for AI-assisted development.

The AI agent must follow these rules when generating code.

## Architecture Rules

Backend
NestJS with modular structure

Frontend
Next.js with React

Database
PostgreSQL using Prisma ORM

Storage
AWS S3 temporary storage

## Security Rules

Never store documents permanently.

All documents must expire automatically.

Maximum upload size
20 MB

Allowed file types

* PDF
* DOCX
* PNG
* JPG

Tokens must be:

* signed
* time limited
* single use

## Code Style

Use TypeScript.

Use dependency injection.

Separate:

* controllers
* services
* modules

Follow REST API structure.

## Development Priorities

1 Document upload
2 QR generation
3 Print retrieval
4 Auto delete system
5 Shop dashboard

## AI Development Workflow

When implementing new features:

1 Read architecture file
2 Follow project folder structure
3 Generate modular code
4 Add comments explaining logic
5 Ensure security compliance
