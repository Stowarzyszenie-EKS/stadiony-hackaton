# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **backend** component of a hackathon monorepo project. It's a Spring Boot application written in **Kotlin**, using **Gradle** as the build tool, **PostgreSQL** as the database, and **Flyway** for database migrations.

**Technology Stack:**
- Spring Boot 3.2.0
- Kotlin 1.9.0 with JVM 17
- PostgreSQL with Spring Data JDBC
- Flyway for database migrations
- Kotest for testing
- Testcontainers for integration tests

## Build and Run Commands

### Build the project
```bash
./gradlew build
```

### Run the application locally
```bash
./gradlew bootRun
```
The application runs on `http://localhost:8080`

### Run unit tests
```bash
./gradlew test
```

### Run integration tests
```bash
./gradlew integrationTest
```
Integration tests use Testcontainers to spin up a PostgreSQL container automatically.

### Run all tests (unit + integration)
```bash
./gradlew check
```

### Run a specific test
```bash
./gradlew test --tests "com.example.demo.HelloControllerTest"
./gradlew integrationTest --tests "com.example.demo.HelloIntegrationTest"
```

### Build Docker image
```bash
docker build -t backend .
```

**Note:** The Dockerfile uses Maven, but this project uses Gradle. The Dockerfile needs to be updated to use Gradle instead of Maven for proper builds.

## Architecture and Structure

### Testing Strategy
This project uses a **two-tier testing approach**:

1. **Unit Tests** (`src/test/kotlin`): Fast, isolated tests using MockMvc
   - Use Kotest's `StringSpec` style
   - Mock dependencies and test controllers in isolation
   - Example: `HelloControllerTest.kt`

2. **Integration Tests** (`src/integration/kotlin`): Full Spring context tests
   - Custom source set defined in `build.gradle.kts`
   - Use Testcontainers for real PostgreSQL instances
   - Full Spring Boot context with `@SpringBootTest`
   - Use `TestRestTemplate` for HTTP calls
   - Example: `HelloIntegrationTest.kt` (currently named `IntegrationTest.kt`)

The integration tests are defined as a separate source set in Gradle and run via the `integrationTest` task.

### Database Configuration
- **Local development**: PostgreSQL on `localhost:5432`
  - Database: `app`
  - Username: `app`
  - Password: `app`
- **Docker/Production**: Uses environment variables:
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
- **Flyway migrations**: Located in `src/main/resources/db/migration/`

### Monorepo Structure
This backend is part of a larger monorepo:
```
repo/
├── backend/           # This Spring Boot application
├── frontend/          # Frontend application
├── infra/             # Docker Compose, Caddy configuration
└── .github/workflows/ # CI/CD pipelines
```

### Deployment
- Uses Docker Compose for orchestration
- Caddy reverse proxy routes `api.yourdomain.com` to backend:8080
- GitHub Actions auto-deploys on push to `main` branch
- CI/CD copies files to VPS and rebuilds containers

## Local Development Setup

1. Start a local PostgreSQL:
```bash
docker run -d \
  -e POSTGRES_DB=app \
  -e POSTGRES_USER=app \
  -e POSTGRES_PASSWORD=app \
  -p 5432:5432 \
  postgres:15
```

2. Run the application:
```bash
./gradlew bootRun
```

3. Test the endpoint:
```bash
curl http://localhost:8080/hello
```

## Important Notes

- The project uses **Gradle** but the current `Dockerfile` references Maven. When building Docker images, update the Dockerfile to use Gradle.
- Integration tests automatically handle PostgreSQL via Testcontainers - no manual database setup needed.
- Flyway runs automatically on application startup when `spring.flyway.enabled=true`