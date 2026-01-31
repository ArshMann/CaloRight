# CaloRight

CaloRight is a full-stack calorie, macro, and weight tracking web application.

This repository contains the frontend, backend API, and shared types used across the application.

---

## Tech Stack (Planned)

- **Frontend:** React + TypeScript + Vite
  
- **Backend:** Node.js + Express + TypeScript
  
- **Database:** PostgreSQL
  
- **ORM:** Prisma
  
- **Auth:** JWT (access tokens + refresh tokens)
  
- **Infra:** Docker (local), cloud deployment later

---

## Repository Structure

caloright/

  apps/
  
    api/ # Backend API (Express)
    
    web/ # Frontend web app (React)
    
  packages/
  
    shared/ # Shared types and validation schemas
    
  docs/ # Architecture diagrams and screenshots
  
  docker-compose.yml

---

## Local Development

>Clone repo

>npm install in apps/api and apps/web

>Copy .env.example → .env

>Fill env vars

>docker compose up -d

>npx prisma generate in apps/api

>npx prisma migrate deploy in apps/api

>npx prisma db seed in apps/api

>npm run dev in apps/web and apps/api

---

## Project Status

🚧 **Work in progress**

This project is under active development. Features, structure, and documentation will evolve as the app is built.

---

## License

MIT
