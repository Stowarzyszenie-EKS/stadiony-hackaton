# 🏗️ Hackathon Infrastructure Setup (Frontend + Backend Java + Postgres + GitHub CI/CD)

Poniżej pełny, gotowy setup infrastruktury w formie jednego dokumentu zawierającego **strukturę repo**, **docker-compose**, **Dockerfile backendu**, **Caddy reverse proxy**, oraz **GitHub Actions** dla ciągłego wdrażania.

Możesz aktywować to repo jednym `git push`.

---

# 📁 Struktura repozytorium (monorepo)

```
repo/
├─ backend/
│  ├─ Dockerfile
│  ├─ src/...
│  └─ pom.xml / build.gradle
│
├─ frontend/
│  ├─ Dockerfile
│  ├─ package.json
│  └─ src/...
│
├─ infrastructure/
│  ├─ docker-compose.yml
│  └─ Caddyfile
│
└─ .github/
   └─ workflows/
      └─ deploy.yml
```

---

# 🐳 `infrastructure/docker-compose.yml`

```yaml
version: "3.9"

services:
  backend:
    build: ../backend
    container_name: app-backend
    restart: always
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/app
      SPRING_DATASOURCE_USERNAME: app
      SPRING_DATASOURCE_PASSWORD: app
    expose:
      - "8080"
    depends_on:
      - db

  frontend:
    build: ../frontend
    container_name: app-frontend
    restart: always
    expose:
      - "3000"

  db:
    image: postgres:15
    container_name: app-db
    restart: always
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    volumes:
      - db_data:/var/lib/postgresql/data

  reverse-proxy:
    image: caddy:latest
    container_name: caddy-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - backend
      - frontend

volumes:
  db_data:
  caddy_data:
  caddy_config:
```

---

# 🪪 `infrastructure/Caddyfile`

```caddy\yourdomain.com {
    reverse_proxy app-frontend:3000
}

api.yourdomain.com {
    reverse_proxy app-backend:8080
}
```

---

# ☕ Backend – `backend/Dockerfile`

*(działa dla Maven — jeśli używasz Gradle, mogę podmienić)*

```dockerfile
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn -q -e -DskipTests clean package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

CMD ["java", "-jar", "app.jar"]

````

---

# 🎨 Frontend – `frontend/Dockerfile`
*(dla React; mogę dostosować pod Vue/Angular)*
```dockerfile
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"] ["serve", "-s", "build", "-l", "3000"]
````

---

# 🔁 GitHub Actions — `.github/workflows/deploy.yml`

Automatyczny deploy na VPS przez SSH + restart docker-compose.

```yaml
name: Deploy

on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Copy files to server
        uses: appleboy/scp-action@v0.1.4
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_KEY }}
          source: "./"
          target: "/app"

      - name: Run docker compose on server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_KEY }}
          script: |
            cd /app/infrastructure
            docker compose down
            docker compose up -d --build
```

---

# 🔐 Wymagane sekrety GitHub Actions

Dodaj w repo:

* `SERVER_IP`
* `SERVER_USER`
* `SERVER_KEY` (klucz prywatny SSH zakodowany jako plaintext)

---

# 🚀 Deploy krok po kroku

1. Na serwerze:

```
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
mkdir /app
```

2. W GitHub → ustaw sekrety.
3. Push do `main` → auto deployment.
4. Front: `https://yourdomain.com`
5. Back: `https://api.yourdomain.com`

---

Jeśli chcesz, mogę przygotować:

* gotowy szkielet backendu (Spring Boot z REST + DB),
* gotowy template Reacta,
* wersję pod Gradle zamiast Maven,
* integrację z Keycloak / JWT,
* monitoring (Grafana + Prometheus).

Daj znać, co dorobić! 🚀
