import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, type AuthedRequest } from "../auth/requireAuth";

export const logEntriesRouter = Router();

function toNumber(v: any): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

logEntriesRouter.post("/:logId/entries", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const logId = req.params.logId;

  const foodIdRaw = req.body?.foodId;
  const gramsRaw = req.body?.grams;
  const mealTypeRaw = req.body?.mealType;

  if (typeof foodIdRaw !== "string" || !foodIdRaw.trim()) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "foodId is required." },
    });
  }
  const foodId = foodIdRaw.trim();

  const grams = toNumber(gramsRaw);
  if (grams === null || grams <= 0) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "grams must be a number > 0." },
    });
  }

  const allowedMeals = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"] as const;
  if (typeof mealTypeRaw !== "string" || !allowedMeals.includes(mealTypeRaw as any)) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "mealType must be BREAKFAST, LUNCH, DINNER, or SNACKS." },
    });
  }

  // 1) Ensure the log belongs to this user
  const log = await prisma.dailyLog.findFirst({
    where: { id: logId, userId },
    select: { id: true },
  });

  if (!log) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Daily log not found." },
    });
  }

  // 2) Ensure food is accessible (global OR owned by user)
  const food = await prisma.food.findFirst({
    where: {
      id: foodId,
      OR: [{ userId: null }, { userId }],
    },
    select: {
      id: true,
      caloriesPer100g: true,
      proteinPer100g: true,
      carbsPer100g: true,
      fatPer100g: true,
    },
  });

  if (!food) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Food not found." },
    });
  }

  // 3) Compute macros server-side
  const factor = grams / 100;

  const calories = round2(Number(food.caloriesPer100g) * factor);
  const protein = round2(Number(food.proteinPer100g) * factor);
  const carbs = round2(Number(food.carbsPer100g) * factor);
  const fat = round2(Number(food.fatPer100g) * factor);

  const entry = await prisma.logEntry.create({
    data: {
      dailyLogId: logId,
      mealType: mealTypeRaw as any,
      sourceType: "FOOD",
      foodId,
      grams,
      calories,
      protein,
      carbs,
      fat,
    },
    select: {
      id: true,
      dailyLogId: true,
      mealType: true,
      sourceType: true,
      foodId: true,
      recipeId: true,
      grams: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(201).json({ entry });
});

logEntriesRouter.delete("/:logId/entries/:entryId", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const { logId, entryId } = req.params;

  // verify log belongs to user
  const log = await prisma.dailyLog.findFirst({
    where: { id: logId, userId },
    select: { id: true },
  });

  if (!log) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Daily log not found." },
    });
  }

  // verify entry belongs to that log
  const entry = await prisma.logEntry.findFirst({
    where: { id: entryId, dailyLogId: logId },
    select: { id: true },
  });

  if (!entry) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Entry not found." },
    });
  }

  await prisma.logEntry.delete({ where: { id: entryId } });
  return res.sendStatus(204);
});
