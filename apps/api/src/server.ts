import "dotenv/config";
import express from "express";
import cors from "cors";
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { authRouter } from "./routes/auth";
import { foodsRouter } from "./routes/foods";
import { dailyLogsRouter } from "./routes/dailyLogs";
import { logEntriesRouter } from "./routes/logEntries";

import cookieParser from "cookie-parser";

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const app = express();

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origin === "http://localhost:5173") return cb(null, true);
    if (origin === "http://127.0.0.1:5173") return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // IMPORTANT: regex, not "*"

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
    res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/foods", foodsRouter);
app.use("/daily-logs", dailyLogsRouter);
app.use("/daily-logs", logEntriesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${port} (NODE_ENV=${process.env.NODE_ENV ?? "development"})`);
});