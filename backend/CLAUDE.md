# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the backend component of a hackathon project, currently implemented as a **Node.js/TypeScript** application using CommonJS modules. The project was initially planned as a Kotlin Spring Boot application (see `../be.md` for the original architecture) but is currently running on Node.js.

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript (CommonJS)
- **HTTP Client**: axios
- **Build Tool**: TypeScript Compiler (tsc)
- **Dev Runner**: ts-node

## Development Commands

### Install Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run dev
```
Runs the application using ts-node, which compiles and executes TypeScript on the fly.

### Build
```bash
npm run build
```
Compiles TypeScript to JavaScript in the `dist/` directory.

### Production Mode
```bash
npm start
```
Runs the compiled JavaScript from `dist/index.js`.

## Architecture & Structure

### Module System
- Uses **CommonJS** (`"type": "commonjs"` in package.json)
- Import syntax: `import x from "y"` (TypeScript syntax, compiled to CommonJS)
- Do NOT use ES modules syntax like `import x from "y" assert { type: "json" }`

### TypeScript Configuration
- **Target**: ES2021
- **Module**: CommonJS
- **Module Resolution**: Node
- **Strict Mode**: Enabled
- **Output Directory**: `./dist`

### Project Structure
```
backend/
├── src/
│   └── index.ts          # Application entry point
├── dist/                 # Compiled JavaScript output (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

### Current Implementation
The codebase is minimal and serves as a starter template. The main entry point (`src/index.ts`) contains a simple example using axios to fetch from GitHub API.

## Infrastructure Context

This backend is part of a larger monorepo with the following structure:

```
repo/
├── backend/              # This directory (Node.js/TypeScript)
├── frontend/             # Frontend application
├── infra/                # Docker Compose & Caddy configuration
│   ├── docker-compose.yml
│   └── Caddyfile
└── .github/workflows/    # CI/CD automation
```

### Deployment Architecture
- **Database**: PostgreSQL (configured in docker-compose)
- **Reverse Proxy**: Caddy (handles HTTPS and routing)
- **Backend Port**: 8080 (exposed via Docker)
- **Frontend Port**: 3000
- **Database Connection**: `jdbc:postgresql://localhost:5432/app` (user: app, password: app)
- **Migrations**: Flyway configured (see `build/resources/main/application.yml`)

### Docker & Deployment
The project includes:
- Docker Compose setup in `../infra/docker-compose.yml`
- GitHub Actions workflow for automated deployment to VPS
- Caddy reverse proxy configuration for SSL and routing (api.yourdomain.com → backend:8080)

## Database Configuration

There's a Spring Boot `application.yml` in `build/resources/main/` with PostgreSQL and Flyway configuration. This suggests the project may transition to or integrate with a JVM-based backend in the future.

Current database settings:
- URL: `jdbc:postgresql://localhost:5432/app`
- Username: `app`
- Password: `app`
- Flyway migrations: enabled, location: `classpath:db/migration`

## Development Notes

### Planned Architecture
The `../be.md` document describes a planned Kotlin Spring Boot architecture with:
- Kotest for testing
- Testcontainers for integration tests
- Separate source sets for unit tests (`src/test`) and integration tests (`src/integration`)
- Flyway migrations

This suggests the current Node.js implementation may be temporary or a prototype.

### When Adding New Features
1. Keep the CommonJS module system consistent
2. Follow TypeScript strict mode conventions
3. Add type definitions for external dependencies (@types packages)
4. Consider the future migration path to Kotlin/Spring if referenced in project docs

### Integration with Infrastructure
When developing API endpoints, remember:
- Backend will be accessible via `api.yourdomain.com` in production (Caddy proxy)
- Database connection will be provided via environment variables in Docker
- Frontend expects backend on a separate domain/port