import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type { Food, FoodsResponse } from "../lib/foodsApi";
import type { TodayLogResponse } from "../lib/dailyLogsApi";

export default function Dashboard() {
  const { user, logout, authedRequest } = useAuth();

  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const [today, setToday] = useState<TodayLogResponse["log"] | null>(null);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState<string | null>(null);

  const [logMealType, setLogMealType] = useState<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS">("LUNCH");
  const [gramsByFoodId, setGramsByFoodId] = useState<Record<string, string>>({});
  const [logError, setLogError] = useState<string | null>(null);
  const [logLoadingFoodId, setLogLoadingFoodId] = useState<string | null>(null);
  const [deleteLoadingEntryId, setDeleteLoadingEntryId] = useState<string | null>(null);


  const debouncedQuery = useMemo(() => query.trim(), [query]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = debouncedQuery ? `?query=${encodeURIComponent(debouncedQuery)}` : "";
      const data = await authedRequest<FoodsResponse>(`/foods${qs}`);
      setFoods(data.foods);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load foods");
    } finally {
      setLoading(false);
    }
  }

  async function loadToday() {
    setTodayLoading(true);
    setTodayError(null);
    try {
      const data = await authedRequest<TodayLogResponse>("/daily-logs/today");
      setToday(data.log);
    } catch (e: any) {
      setTodayError(e?.message ?? "Failed to load today log");
    } finally {
      setTodayLoading(false);
    }
  }

  async function addFoodToToday(foodId: string) {
    setLogError(null);

    const gramsStr = (gramsByFoodId[foodId] ?? "").trim();
    const grams = Number(gramsStr);

    if (!gramsStr || Number.isNaN(grams) || grams <= 0) {
      setLogError("Enter grams > 0 before adding.");
      return;
    }

    setLogLoadingFoodId(foodId);
    try {
      // Ensure we have today's log loaded (we need its id)
      let logId = today?.id;
      if (!logId) {
        const data = await authedRequest<{ log: { id: string } }>("/daily-logs/today");
        logId = data.log.id;
        // refresh local state too
        await loadToday();
      }

      await authedRequest(`/daily-logs/${logId}/entries`, {
        method: "POST",
        body: {
          foodId,
          grams,
          mealType: logMealType,
        },
      });

      // clear grams input for that food row (nice UX)
      setGramsByFoodId((prev) => {
        const copy = { ...prev };
        delete copy[foodId];
        return copy;
      });

      // refresh today totals + list
      await loadToday();
    } catch (e: any) {
      setLogError(e?.message ?? "Failed to add entry");
    } finally {
      setLogLoadingFoodId(null);
    }
  }

  async function deleteEntry(entryId: string) {
    if (!today) return;

    setDeleteLoadingEntryId(entryId);
    try {
      await authedRequest(`/daily-logs/${today.id}/entries/${entryId}`, {
        method: "DELETE",
      });
      await loadToday();
    } finally {
      setDeleteLoadingEntryId(null);
    }
  }

  async function createFood() {
    setCreateError(null);

    const payload = {
      name: name.trim(),
      brand: brand.trim() ? brand.trim() : null,
      caloriesPer100g: Number(calories),
      proteinPer100g: Number(protein),
      carbsPer100g: Number(carbs),
      fatPer100g: Number(fat),
    };

    // Basic client validation
    if (!payload.name) return setCreateError("Name is required.");
    if ([payload.caloriesPer100g, payload.proteinPer100g, payload.carbsPer100g, payload.fatPer100g].some((n) => Number.isNaN(n))) {
      return setCreateError("All macros must be numbers.");
    }

    setCreating(true);
    try {
      await authedRequest("/foods", { method: "POST", body: payload });

      // clear form + reload list
      setName("");
      setBrand("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      await load();
    } catch (e: any) {
      setCreateError(e?.message ?? "Failed to create food");
    } finally {
      setCreating(false);
    }
  }


  useEffect(() => {
    load();
    loadToday();
  }, [debouncedQuery]);

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Foods</h1>
          <div style={{ opacity: 0.8, fontSize: 14 }}>Logged in as {user?.email}</div>
        </div>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Today</h2>
          <button onClick={loadToday} disabled={todayLoading}>
            {todayLoading ? "Refreshing…" : "Refresh"}
          </button>
          <select
            value={logMealType}
            onChange={(e) => setLogMealType(e.target.value as any)}
            style={{ marginRight: 8 }}
          >
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
            <option value="SNACKS">Snacks</option>
          </select>
        </div>

        {todayError && <div style={{ marginTop: 8, color: "crimson" }}>{todayError}</div>}
        {logError && <div style={{ marginTop: 8, color: "crimson" }}>{logError}</div>}

        {!today && !todayError ? (
          <div style={{ marginTop: 12, opacity: 0.7 }}>No log yet.</div>
        ) : null}

        {today ? (
          <>
            {/* DAILY TOTALS */}
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                background: "#000000",
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div><strong>{today.totals.calories}</strong> kcal</div>
              <div><strong>{today.totals.protein}</strong> P</div>
              <div><strong>{today.totals.carbs}</strong> C</div>
              <div><strong>{today.totals.fat}</strong> F</div>
            </div>

            {/* MEAL SECTIONS */}
            {(["BREAKFAST", "LUNCH", "DINNER", "SNACKS"] as const).map((meal) => {
              const entries = today.entries.filter((e) => e.mealType === meal);
              const totals = today.meals[meal] ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };

              return (
                <div
                  key={meal}
                  style={{
                    marginTop: 16,
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  {/* MEAL HEADER */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ margin: 0 }}>{meal}</h3>
                    <div style={{ fontSize: 14, opacity: 0.85 }}>
                      <strong>{totals.calories}</strong> kcal • P {totals.protein} • C {totals.carbs} • F {totals.fat}
                    </div>
                  </div>

                  {/* MEAL ENTRIES */}
                  {entries.length === 0 ? (
                    <div style={{ marginTop: 8, opacity: 0.6 }}>No entries</div>
                  ) : (
                    <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                      {entries.map((e) => (
                        <div
                          key={e.id}
                          style={{
                            border: "1px solid #f0f0f0",
                            borderRadius: 10,
                            padding: 10,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          {/* LEFT: entry info */}
                          <div>
                            <div style={{ fontWeight: 700 }}>
                              {e.food ? e.food.name : "Item"}
                              {e.food?.brand ? ` • ${e.food.brand}` : ""}
                            </div>
                            <div style={{ fontSize: 14, opacity: 0.85 }}>
                              {e.grams}g • {e.calories} kcal • P {e.protein} • C {e.carbs} • F {e.fat}
                            </div>
                          </div>

                          {/* RIGHT: delete button */}
                          <button
                            onClick={() => deleteEntry(e.id)}
                            disabled={deleteLoadingEntryId === e.id}
                            style={{ fontSize: 12 }}
                          >
                            {deleteLoadingEntryId === e.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : null}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods (name or brand)…"
          style={{ flex: 1 }}
        />
        <button onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Add custom food</div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Costco Greek Yogurt" />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <span>Brand (optional)</span>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g., Kirkland" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Calories/100g</span>
              <input value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="59" />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Protein/100g</span>
              <input value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="10" />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Carbs/100g</span>
              <input value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="3.6" />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Fat/100g</span>
              <input value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0.4" />
            </label>
          </div>

          {createError && <div style={{ color: "crimson" }}>{createError}</div>}

          <div>
            <button onClick={createFood} disabled={creating}>
              {creating ? "Creating..." : "Create food"}
            </button>
          </div>
        </div>
      </div>


      {error && <div style={{ marginTop: 12, color: "crimson" }}>{error}</div>}

      <div style={{ marginTop: 16 }}>
        <div style={{ opacity: 0.8, marginBottom: 8 }}>
          {loading ? "Loading…" : `${foods.length} result(s)`}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {foods.map((f) => {
            const isCustom = f.userId !== null;
            return (
              <div
                key={f.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {f.name}{" "}
                    {f.brand ? <span style={{ fontWeight: 400, opacity: 0.8 }}>• {f.brand}</span> : null}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.85 }}>
                    {f.caloriesPer100g} kcal • P {f.proteinPer100g}g • C {f.carbsPer100g}g • F {f.fatPer100g}g (per 100g)
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                  <input
                    value={gramsByFoodId[f.id] ?? ""}
                    onChange={(e) =>
                      setGramsByFoodId((prev) => ({ ...prev, [f.id]: e.target.value }))
                    }
                    placeholder="grams"
                    style={{ width: 90 }}
                  />
                  <button
                    onClick={() => addFoodToToday(f.id)}
                    disabled={logLoadingFoodId === f.id}
                  >
                    {logLoadingFoodId === f.id ? "Adding..." : "Add to Today"}
                  </button>
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {isCustom ? "Custom" : "Global"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
