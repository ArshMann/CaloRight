export type LogEntry = {
  id: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS";
  sourceType: "FOOD" | "RECIPE";
  grams: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  createdAt: string;
  food: { id: string; name: string; brand: string | null } | null;
};

export type TodayLogResponse = {
  log: {
    id: string;
    date: string;
    entries: LogEntry[];
    totals: { calories: number; protein: number; carbs: number; fat: number };
    meals: Record<string, { calories: number; protein: number; carbs: number; fat: number }>;
  };
};
