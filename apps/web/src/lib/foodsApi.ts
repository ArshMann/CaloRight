import type { User } from "./authApi";

export type Food = {
  id: string;
  name: string;
  brand: string | null;
  caloriesPer100g: string;
  proteinPer100g: string;
  carbsPer100g: string;
  fatPer100g: string;
  userId: string | null;
};

export type FoodsResponse = { foods: Food[] };

export type CreateFoodInput = {
  name: string;
  brand?: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};
