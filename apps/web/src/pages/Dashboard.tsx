import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type { Food, FoodsResponse } from "../lib/foodsApi";

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
