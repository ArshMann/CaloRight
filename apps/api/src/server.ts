import "dotenv/config";
import express from "express";
import cors from "cors";
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { authRouter } from "./routes/auth";import cookieParser from "cookie-parser";

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: corsOrigin,
        credentials: true
    })
);
app.use(cookieParser());

app.get("/health", (_req, res) => {
    res.json({ ok: true });
});

// TEMP: dev-only endpoint, remove after auth
app.get("/debug/foods", async (_req, res) => {
    const foods = await prisma.food.findMany({
      take: 10,
      orderBy: {
        name: 'asc',
      },
    })
    res.json(foods);
});

app.use("/auth", authRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${port} (NODE_ENV=${process.env.NODE_ENV ?? "development"})`);
});