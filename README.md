# CaloRight

CaloRight is a full-stack calorie and macronutrient tracking web application that allows users to log foods, track daily nutrition totals, and review historical logs by date.

The application supports user authentication, custom food management, and per-day meal tracking with aggregated macro calculations.

---

## Features (MVP)

* User authentication with JWT access and refresh tokens
* Daily calorie and macronutrient tracking
* Browse and search a global food database
* Create, edit, and delete custom foods
* Log foods by meal (Breakfast, Lunch, Dinner, Snacks)
* View and edit logs for any date
* Automatic daily macro totals and per-meal breakdowns

---

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Custom CSS

### Backend

* Node.js
* Express
* TypeScript
* Prisma ORM

### Database

* PostgreSQL

### Authentication

* JWT (access and refresh tokens)
* Secure, HTTP-only refresh token cookies

### Infrastructure (Local)

* Docker Compose (PostgreSQL)
* Environment-based configuration

---

## Repository Structure

```
caloright/
├─ apps/
│  ├─ api/          # Backend API (Express + Prisma)
│  └─ web/          # Frontend web app (React + Vite)
├─ packages/
│  └─ shared/       # Shared types and utilities
├─ docs/            # Architecture notes and assets
└─ docker-compose.yml
```

---

## Local Development

### Prerequisites

* Node.js (v18+ recommended)
* Docker & Docker Compose
* PostgreSQL client (optional)

### Setup

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/caloright.git
   cd caloright
   ```

2. Install dependencies

   ```bash
   cd apps/api && npm install
   cd ../web && npm install
   ```

3. Configure environment variables

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

4. Start the database

   ```bash
   docker compose up -d
   ```

5. Prepare the database (from `apps/api`)

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed
   ```

6. Start the development servers

   ```bash
   # in apps/api
   npm run dev

   # in apps/web
   npm run dev
   ```

Frontend runs on `http://localhost:5173`
Backend API runs on `http://localhost:3001`

---

## Environment Configuration

Example environment files are provided:

* `apps/api/.env.example`
* `apps/web/.env.example`

These document the required configuration for both local development and production deployment.

---

## Project Status

✅ **MVP complete**

Core functionality is implemented and stable. Future improvements may include:

* Weight tracking
* Nutrition goals
* Data visualization
* Recipes feature
* Mobile support
* Cloud deployment

---

## License

MIT
