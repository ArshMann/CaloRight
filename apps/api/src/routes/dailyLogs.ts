import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, type AuthedRequest } from "../auth/requireAuth";

export const dailyLogsRouter = Router();

function todayDateOnlyLocal(): Date {
  const now = new Date();
  // local midnight (matches @db.Date)
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

dailyLogsRouter.post("/today", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const date = todayDateOnlyLocal();

  const log = await prisma.dailyLog.upsert({
    where: {
      userId_date: { userId, date },
    },
    update: {},
    create: { userId, date },
    select: { id: true, date: true },
  });

  return res.status(201).json({ log });
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

dailyLogsRouter.get("/today", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const date = todayDateOnlyLocal();

  // ensure today's log exists (same pattern as 7.1)
  const baseLog = await prisma.dailyLog.upsert({
    where: { userId_date: { userId, date } },
    update: {},
    create: { userId, date },
    select: { id: true, date: true },
  });

  const log = await prisma.dailyLog.findFirst({
    where: { id: baseLog.id, userId },
    select: {
      id: true,
      date: true,
      entries: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          mealType: true,
          sourceType: true,
          grams: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true,
          createdAt: true,
          food: {
            select: {
              id: true,
              name: true,
              brand: true,
            },
          },
        },
      },
    },
  });

  if (!log) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Daily log not found." },
    });
  }

  // totals
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  const mealTotals: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};

  for (const e of log.entries) {
    const cals = Number(e.calories);
    const p = Number(e.protein);
    const c = Number(e.carbs);
    const f = Number(e.fat);

    totalCalories += cals;
    totalProtein += p;
    totalCarbs += c;
    totalFat += f;

    const key = e.mealType;
    if (!mealTotals[key]) mealTotals[key] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    mealTotals[key].calories += cals;
    mealTotals[key].protein += p;
    mealTotals[key].carbs += c;
    mealTotals[key].fat += f;
  }

  // round totals (for nicer UI)
  const totals = {
    calories: round2(totalCalories),
    protein: round2(totalProtein),
    carbs: round2(totalCarbs),
    fat: round2(totalFat),
  };

  const meals = Object.fromEntries(
    Object.entries(mealTotals).map(([k, v]) => [
      k,
      {
        calories: round2(v.calories),
        protein: round2(v.protein),
        carbs: round2(v.carbs),
        fat: round2(v.fat),
      },
    ])
  );

  return res.json({
    log: {
      id: log.id,
      date: log.date,
      entries: log.entries,
      totals,
      meals,
    },
  });
});
