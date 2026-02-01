import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, type AuthedRequest } from "../auth/requireAuth";

export const foodsRouter = Router();

foodsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
  const limit =
    typeof req.query.limit === "string"
      ? Math.min(parseInt(req.query.limit, 10) || 50, 100)
      : 50;

  const whereClause: any = {
    OR: [
      { userId: null },        // global foods
      { userId },              // user's custom foods
    ],
  };

  if (query) {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5); // cap to avoid crazy queries

    whereClause.AND = tokens.map((t) => ({
      OR: [
        { name: { contains: t, mode: "insensitive" } },
        { brand: { contains: t, mode: "insensitive" } },
      ],
    }));
  }

  const foods = await prisma.food.findMany({
    where: whereClause,
    orderBy: { name: "asc" },
    take: limit,
  });

  res.json({ foods });
});

foodsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  const nameRaw = req.body?.name;
  const brandRaw = req.body?.brand;

  const calsRaw = req.body?.caloriesPer100g;
  const proteinRaw = req.body?.proteinPer100g;
  const carbsRaw = req.body?.carbsPer100g;
  const fatRaw = req.body?.fatPer100g;

  if (typeof nameRaw !== "string" || !nameRaw.trim()) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Name is required." },
    });
  }

  // brand can be string or null/undefined
  const brand =
    brandRaw === null || brandRaw === undefined
      ? null
      : typeof brandRaw === "string"
      ? brandRaw.trim() || null
      : null;

  function toNumber(v: any): number | null {
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
    return null;
  }

  const caloriesPer100g = toNumber(calsRaw);
  const proteinPer100g = toNumber(proteinRaw);
  const carbsPer100g = toNumber(carbsRaw);
  const fatPer100g = toNumber(fatRaw);

  if (
    caloriesPer100g === null ||
    proteinPer100g === null ||
    carbsPer100g === null ||
    fatPer100g === null
  ) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Macros per 100g are required and must be numbers." },
    });
  }

  if (
    caloriesPer100g < 0 ||
    proteinPer100g < 0 ||
    carbsPer100g < 0 ||
    fatPer100g < 0
  ) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Macros cannot be negative." },
    });
  }

  const food = await prisma.food.create({
    data: {
      userId,
      name: nameRaw.trim(),
      brand,
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g,
    },
  });

  return res.status(201).json({ food });
});

foodsRouter.patch("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const id = req.params.id;

  const existing = await prisma.food.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Food not found." },
    });
  }

  if (existing.userId !== userId) {
    // includes global foods (userId null) and other users' foods
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: "You can only edit your own foods." },
    });
  }

  const updates: any = {};

  if (req.body?.name !== undefined) {
    if (typeof req.body.name !== "string" || !req.body.name.trim()) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Name must be a non-empty string." },
      });
    }
    updates.name = req.body.name.trim();
  }

  if (req.body?.brand !== undefined) {
    if (req.body.brand === null) {
      updates.brand = null;
    } else if (typeof req.body.brand === "string") {
      updates.brand = req.body.brand.trim() || null;
    } else {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Brand must be a string or null." },
      });
    }
  }

  function toNumber(v: any): number | null {
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
    return null;
  }

  const macroFields = ["caloriesPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g"] as const;
  for (const field of macroFields) {
    if (req.body?.[field] !== undefined) {
      const val = toNumber(req.body[field]);
      if (val === null || val < 0) {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: `${field} must be a non-negative number.` },
        });
      }
      updates[field] = val;
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "No valid fields to update." },
    });
  }

  const food = await prisma.food.update({
    where: { id },
    data: updates,
  });

  return res.json({ food });
});

foodsRouter.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const id = req.params.id;

  const existing = await prisma.food.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Food not found." },
    });
  }

  if (existing.userId !== userId) {
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: "You can only delete your own foods." },
    });
  }

  await prisma.food.delete({ where: { id } });
  return res.sendStatus(204);
});
