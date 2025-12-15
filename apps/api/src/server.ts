import "dotenv/config";
import express from "express";
import cors from "cors";

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

app.get("/health", (_req, res) => {
    res.json({ ok: true });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${port} (NODE_ENV=${process.env.NODE_ENV ?? "development"})`);
});