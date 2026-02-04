import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type { Food, FoodsResponse } from "../lib/foodsApi";
import type { TodayLogResponse } from "../lib/dailyLogsApi";
import "./Dashboard.css";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS";
const MEALS: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"];

function emptyTotals() {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

/** Debounces a rapidly-changing value (e.g., search input) to reduce API calls. */
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function fmtMealTitle(meal: MealType) {
  if (meal === "BREAKFAST") return "Breakfast";
  if (meal === "LUNCH") return "Lunch";
  if (meal === "DINNER") return "Dinner";
  return "Snacks";
}

function toISODateLocal(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysISO(iso: string, deltaDays: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + deltaDays);
  return toISODateLocal(dt);
}

function prettyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MacroPill(props: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="pill">
      <div className="pillLabel">{props.label}</div>
      <div className="pillValue">
        {props.value}
        {props.unit ? <span className="pillUnit"> {props.unit}</span> : null}
      </div>
    </div>
  );
}

function InlineError(props: { text: string }) {
  return <div className="alert alertError">{props.text}</div>;
}

function InlineInfo(props: { text: string }) {
  return <div className="alert alertInfo">{props.text}</div>;
}

function Badge(props: { text: string; tone?: "neutral" | "green" | "blue" }) {
  return <span className={`badge ${props.tone ?? "neutral"}`}>{props.text}</span>;
}

function Button(props: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={props.type ?? "button"}
      className={`btn ${props.variant ?? "primary"}`}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}

function IconButton(props: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "ghost" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`iconBtn ${props.variant ?? "ghost"}`}
      aria-label={props.label}
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.label}
    >
      {props.children}
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  const { label, hint, id, ...rest } = props;
  const inputId = id ?? (label ? `inp_${label.replace(/\s+/g, "_")}` : undefined);

  return (
    <label className="field" htmlFor={inputId}>
      {label ? <span className="fieldLabel">{label}</span> : null}
      <input className="input" id={inputId} {...rest} />
      {hint ? <span className="fieldHint">{hint}</span> : null}
    </label>
  );
}

type FoodEditDraft = {
  id: string;
  name: string;
  brand: string; // empty string represents null for controlled inputs
  caloriesPer100g: string;
  proteinPer100g: string;
  carbsPer100g: string;
  fatPer100g: string;
};

function toDraft(f: Food): FoodEditDraft {
  return {
    id: f.id,
    name: f.name ?? "",
    brand: f.brand ?? "",
    caloriesPer100g: String(f.caloriesPer100g ?? ""),
    proteinPer100g: String(f.proteinPer100g ?? ""),
    carbsPer100g: String(f.carbsPer100g ?? ""),
    fatPer100g: String(f.fatPer100g ?? ""),
  };
}

export default function Dashboard() {
  const { user, logout, authedRequest } = useAuth();

  const todayISO = useMemo(() => toISODateLocal(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const isViewingToday = selectedDate === todayISO;

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 250);

  const [foods, setFoods] = useState<Food[]>([]);
  const [foodsLoading, setFoodsLoading] = useState(false);
  const [foodsError, setFoodsError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const [log, setLog] = useState<TodayLogResponse["log"] | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const [logMealType, setLogMealType] = useState<MealType>("LUNCH");
  const [gramsByFoodId, setGramsByFoodId] = useState<Record<string, string>>({});
  const [entryError, setEntryError] = useState<string | null>(null);
  const [logLoadingFoodId, setLogLoadingFoodId] = useState<string | null>(null);

  const [deleteLoadingEntryId, setDeleteLoadingEntryId] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<FoodEditDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [foodDeleteLoadingId, setFoodDeleteLoadingId] = useState<string | null>(null);
  const [foodDeleteError, setFoodDeleteError] = useState<string | null>(null);

  const logByMeal = useMemo(() => {
    if (!log) return null;

    const entriesByMeal = {
      BREAKFAST: log.entries.filter((e) => e.mealType === "BREAKFAST"),
      LUNCH: log.entries.filter((e) => e.mealType === "LUNCH"),
      DINNER: log.entries.filter((e) => e.mealType === "DINNER"),
      SNACKS: log.entries.filter((e) => e.mealType === "SNACKS"),
    } satisfies Record<MealType, typeof log.entries>;

    const totalsByMeal = {
      BREAKFAST: log.meals?.BREAKFAST ?? emptyTotals(),
      LUNCH: log.meals?.LUNCH ?? emptyTotals(),
      DINNER: log.meals?.DINNER ?? emptyTotals(),
      SNACKS: log.meals?.SNACKS ?? emptyTotals(),
    } satisfies Record<MealType, ReturnType<typeof emptyTotals>>;

    return { entriesByMeal, totalsByMeal };
  }, [log]);

  async function loadFoods() {
    setFoodsLoading(true);
    setFoodsError(null);
    try {
      const qs = debouncedQuery ? `?query=${encodeURIComponent(debouncedQuery)}` : "";
      const data = await authedRequest<FoodsResponse>(`/foods${qs}`);
      setFoods(data.foods);
    } catch (e: any) {
      setFoodsError(e?.message ?? "Failed to load foods");
    } finally {
      setFoodsLoading(false);
    }
  }

  async function fetchLogForDate(dateISO: string) {
    return authedRequest<TodayLogResponse>(`/daily-logs/by-date?date=${encodeURIComponent(dateISO)}`);
  }

  async function loadSelectedDay() {
    setLogLoading(true);
    setLogError(null);
    try {
      const data =
        selectedDate === todayISO
          ? await authedRequest<TodayLogResponse>("/daily-logs/today")
          : await fetchLogForDate(selectedDate);

      setLog(data.log);
    } catch (e: any) {
      setLogError(e?.message ?? "Failed to load log");
      setLog(null);
    } finally {
      setLogLoading(false);
    }
  }

  async function addFoodToSelectedDay(foodId: string) {
    setEntryError(null);

    const gramsStr = (gramsByFoodId[foodId] ?? "").trim();
    const grams = Number(gramsStr);

    if (!gramsStr || Number.isNaN(grams) || grams <= 0) {
      setEntryError("Enter grams > 0 before adding.");
      return;
    }

    setLogLoadingFoodId(foodId);
    try {
      let logId = log?.id;

      if (!logId) {
        const data =
          selectedDate === todayISO
            ? await authedRequest<TodayLogResponse>("/daily-logs/today")
            : await fetchLogForDate(selectedDate);

        logId = data.log?.id;
        setLog(data.log);
      }

      if (!logId) {
        setEntryError("No log found for that date.");
        return;
      }

      await authedRequest(`/daily-logs/${logId}/entries`, {
        method: "POST",
        body: { foodId, grams, mealType: logMealType },
      });

      setGramsByFoodId((prev) => {
        const copy = { ...prev };
        delete copy[foodId];
        return copy;
      });

      await loadSelectedDay();
    } catch (e: any) {
      setEntryError(e?.message ?? "Failed to add entry");
    } finally {
      setLogLoadingFoodId(null);
    }
  }

  async function deleteEntry(entryId: string) {
    if (!log) return;

    setDeleteLoadingEntryId(entryId);
    try {
      await authedRequest(`/daily-logs/${log.id}/entries/${entryId}`, { method: "DELETE" });
      await loadSelectedDay();
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

    if (!payload.name) return setCreateError("Name is required.");
    if (
      [payload.caloriesPer100g, payload.proteinPer100g, payload.carbsPer100g, payload.fatPer100g].some((n) =>
        Number.isNaN(n)
      )
    ) {
      return setCreateError("All macros must be numbers.");
    }

    setCreating(true);
    try {
      await authedRequest("/foods", { method: "POST", body: payload });

      setName("");
      setBrand("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");

      await loadFoods();
    } catch (e: any) {
      setCreateError(e?.message ?? "Failed to create food");
    } finally {
      setCreating(false);
    }
  }

  function openEditFood(food: Food) {
    setEditError(null);
    setEditDraft(toDraft(food));
    setEditOpen(true);
  }

  function closeEditFood() {
    setEditOpen(false);
    setEditDraft(null);
    setEditError(null);
  }

  async function saveEditedFood() {
    if (!editDraft) return;

    setEditError(null);

    const payload = {
      name: editDraft.name.trim(),
      brand: editDraft.brand.trim() ? editDraft.brand.trim() : null,
      caloriesPer100g: Number(editDraft.caloriesPer100g),
      proteinPer100g: Number(editDraft.proteinPer100g),
      carbsPer100g: Number(editDraft.carbsPer100g),
      fatPer100g: Number(editDraft.fatPer100g),
    };

    if (!payload.name) return setEditError("Name is required.");
    if (
      [payload.caloriesPer100g, payload.proteinPer100g, payload.carbsPer100g, payload.fatPer100g].some(
        (n) => Number.isNaN(n) || n < 0
      )
    ) {
      return setEditError("Macros must be non-negative numbers.");
    }

    setEditSaving(true);
    try {
      await authedRequest(`/foods/${editDraft.id}`, { method: "PATCH", body: payload });
      closeEditFood();
      await loadFoods();
      await loadSelectedDay();
    } catch (e: any) {
      setEditError(e?.message ?? "Failed to update food.");
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteFood(foodId: string) {
    setFoodDeleteError(null);
    setFoodDeleteLoadingId(foodId);
    try {
      await authedRequest(`/foods/${foodId}`, { method: "DELETE" });
      await loadFoods();
      await loadSelectedDay();
    } catch (e: any) {
      setFoodDeleteError(e?.message ?? "Failed to delete food.");
    } finally {
      setFoodDeleteLoadingId(null);
    }
  }

  useEffect(() => {
    loadFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  useEffect(() => {
    loadSelectedDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const total = log?.totals ?? emptyTotals();

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <div className="logoMark" aria-hidden="true" />
            <div className="brandText">
              <div className="brandName">CaloRight</div>
              <div className="brandSub">Logged in as {user?.email ?? ""}</div>
            </div>
          </div>

          <div className="topbarActions">
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="summaryCard card">
          <div className="summaryHeader">
            <div>
              <div className="sectionTitle">{isViewingToday ? "Today" : prettyDate(selectedDate)}</div>
              <div className="sectionSub">
                View and edit logs for any day. ({isViewingToday ? "Viewing today" : "Viewing past day"})
              </div>
            </div>

            <div className="summaryActions" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Button
                variant="ghost"
                onClick={() => setSelectedDate(addDaysISO(selectedDate, -1))}
                disabled={logLoading}
              >
                ← Prev
              </Button>

              <input
                className="input"
                style={{ width: 160 }}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Select date"
              />

              <Button variant="ghost" onClick={() => setSelectedDate(addDaysISO(selectedDate, 1))} disabled={logLoading}>
                Next →
              </Button>

              {!isViewingToday ? (
                <Button variant="ghost" onClick={() => setSelectedDate(todayISO)} disabled={logLoading}>
                  Today
                </Button>
              ) : null}

              <Button variant="ghost" onClick={loadSelectedDay} disabled={logLoading}>
                {logLoading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>

          <div className="pillGrid">
            <MacroPill label="Calories" value={total.calories} unit="kcal" />
            <MacroPill label="Protein" value={total.protein} unit="g" />
            <MacroPill label="Carbs" value={total.carbs} unit="g" />
            <MacroPill label="Fat" value={total.fat} unit="g" />
          </div>

          <div className="alerts">
            {logError ? <InlineError text={logError} /> : null}
            {entryError ? <InlineError text={entryError} /> : null}
            {!log && !logError && !logLoading ? (
              <InlineInfo text="No log for this date (yet). Add something from Foods to create it." />
            ) : null}
          </div>
        </section>

        <div className="grid">
          <section className="card">
            <div className="cardHeader">
              <div>
                <div className="sectionTitle">Meals</div>
                <div className="sectionSub">Entries are grouped by meal type.</div>
              </div>
              <div className="rightMeta">
                {log ? <Badge tone="blue" text={`${log.entries.length} item(s)`} /> : <Badge text="Empty" />}
              </div>
            </div>

            <div className="cardBody mealGrid">
              {logByMeal ? (
                MEALS.map((meal) => (
                  <MealCard
                    key={meal}
                    title={fmtMealTitle(meal)}
                    totals={logByMeal.totalsByMeal[meal]}
                    entries={logByMeal.entriesByMeal[meal]}
                    deleteLoadingEntryId={deleteLoadingEntryId}
                    onDeleteEntry={deleteEntry}
                  />
                ))
              ) : (
                <div className="emptyState">
                  <div className="emptyTitle">Nothing logged</div>
                  <div className="emptySub">Pick a date and add foods (grams) to create entries.</div>
                </div>
              )}
            </div>
          </section>

          <aside className="side stack">
            <section className="card">
              <div className="cardHeader">
                <div>
                  <div className="sectionTitle">Foods</div>
                  <div className="sectionSub">Search by name or brand, then add grams.</div>
                </div>
                <div className="rightMeta">
                  <div className="mealQuick">
                    <span className="mealQuickLabel">Add to</span>
                    <select
                      className="select compact"
                      value={logMealType}
                      onChange={(e) => setLogMealType(e.target.value as MealType)}
                    >
                      <option value="BREAKFAST">Breakfast</option>
                      <option value="LUNCH">Lunch</option>
                      <option value="DINNER">Dinner</option>
                      <option value="SNACKS">Snacks</option>
                    </select>
                  </div>

                  {foodsLoading ? <Badge text="Loading…" /> : <Badge tone="green" text={`${foods.length} results`} />}
                </div>
              </div>

              <div className="cardBody stack">
                <form
                  className="searchRow"
                  onSubmit={(e) => {
                    e.preventDefault();
                    loadFoods();
                  }}
                >
                  <input
                    className="input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search foods (name or brand)…"
                    aria-label="Search foods"
                  />
                  <Button variant="primary" type="submit" disabled={foodsLoading}>
                    {foodsLoading ? "Searching…" : "Search"}
                  </Button>
                </form>

                {foodsError ? <InlineError text={foodsError} /> : null}
                {foodDeleteError ? <InlineError text={foodDeleteError} /> : null}

                <div className="foodList">
                  {foods.map((f) => (
                    <FoodListRow
                      key={f.id}
                      food={f}
                      grams={gramsByFoodId[f.id] ?? ""}
                      onChangeGrams={(v) => setGramsByFoodId((prev) => ({ ...prev, [f.id]: v }))}
                      onAdd={() => addFoodToSelectedDay(f.id)}
                      adding={logLoadingFoodId === f.id}
                      onEdit={() => openEditFood(f)}
                      onDelete={() => deleteFood(f.id)}
                      deleting={foodDeleteLoadingId === f.id}
                    />
                  ))}

                  {!foodsLoading && foods.length === 0 ? (
                    <div className="emptyInline">No foods found. Try a different search.</div>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="card">
              <div className="cardHeader">
                <div>
                  <div className="sectionTitle">Create food</div>
                  <div className="sectionSub">Add your own custom food with macros per 100g.</div>
                </div>
                <div className="rightMeta">
                  <Badge text="Custom" />
                </div>
              </div>

              <div className="cardBody stack">
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    createFood();
                  }}
                >
                  <div className="twoCol">
                    <Input
                      label="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Greek yogurt"
                    />
                    <Input
                      label="Brand (optional)"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Kirkland"
                    />
                  </div>

                  <div className="fourCol">
                    <Input
                      label="Calories/100g"
                      inputMode="decimal"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="59"
                    />
                    <Input
                      label="Protein/100g"
                      inputMode="decimal"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="10"
                    />
                    <Input
                      label="Carbs/100g"
                      inputMode="decimal"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="3.6"
                    />
                    <Input
                      label="Fat/100g"
                      inputMode="decimal"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="0.4"
                    />
                  </div>

                  {createError ? <InlineError text={createError} /> : null}

                  <div className="rowEnd">
                    <Button variant="primary" type="submit" disabled={creating}>
                      {creating ? "Creating…" : "Create food"}
                    </Button>
                  </div>
                </form>
              </div>
            </section>
          </aside>
        </div>

        {editOpen && editDraft ? (
          <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Edit food">
            <div className="modalCard">
              <div className="modalHeader">
                <div>
                  <div className="sectionTitle">Edit food</div>
                  <div className="sectionSub">Only your custom foods can be edited.</div>
                </div>
                <IconButton label="Close" onClick={closeEditFood}>
                  ✕
                </IconButton>
              </div>

              <div className="modalBody stack">
                <div className="twoCol">
                  <Input
                    label="Name"
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                  />
                  <Input
                    label="Brand (optional)"
                    value={editDraft.brand}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, brand: e.target.value } : d))}
                  />
                </div>

                <div className="fourCol">
                  <Input
                    label="Calories/100g"
                    inputMode="decimal"
                    value={editDraft.caloriesPer100g}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, caloriesPer100g: e.target.value } : d))}
                  />
                  <Input
                    label="Protein/100g"
                    inputMode="decimal"
                    value={editDraft.proteinPer100g}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, proteinPer100g: e.target.value } : d))}
                  />
                  <Input
                    label="Carbs/100g"
                    inputMode="decimal"
                    value={editDraft.carbsPer100g}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, carbsPer100g: e.target.value } : d))}
                  />
                  <Input
                    label="Fat/100g"
                    inputMode="decimal"
                    value={editDraft.fatPer100g}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, fatPer100g: e.target.value } : d))}
                  />
                </div>

                {editError ? <InlineError text={editError} /> : null}

                <div className="rowEnd">
                  <Button variant="ghost" onClick={closeEditFood} disabled={editSaving}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={saveEditedFood} disabled={editSaving}>
                    {editSaving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function MealCard(props: {
  title: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  entries: Array<TodayLogResponse["log"]["entries"][number]>;
  onDeleteEntry: (entryId: string) => void;
  deleteLoadingEntryId: string | null;
}) {
  const t = props.totals;

  return (
    <div className="mealCard">
      <div className="mealHeader">
        <div className="mealTitleRow">
          <h3 className="mealTitle">{props.title}</h3>
          <div className="mealTotals">
            <span className="mealKcal">
              <strong>{t.calories}</strong> kcal
            </span>
            <span className="mealMacros">
              P {t.protein} • C {t.carbs} • F {t.fat}
            </span>
          </div>
        </div>
      </div>

      {props.entries.length === 0 ? (
        <div className="emptyInline">No entries</div>
      ) : (
        <div className="entryList">
          {props.entries.map((e) => (
            <EntryRow
              key={e.id}
              entry={e}
              onDelete={() => props.onDeleteEntry(e.id)}
              deleting={props.deleteLoadingEntryId === e.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EntryRow(props: {
  entry: TodayLogResponse["log"]["entries"][number];
  onDelete: () => void;
  deleting: boolean;
}) {
  const e = props.entry;

  return (
    <div className="entryRow">
      <div className="entryMain">
        <div className="entryName">
          <span className="truncate">{e.food ? e.food.name : "Item"}</span>
          {e.food?.brand ? <span className="entryBrand"> • {e.food.brand}</span> : null}
        </div>
        <div className="entryMeta">
          {e.grams}g • {e.calories} kcal • P {e.protein} • C {e.carbs} • F {e.fat}
        </div>
      </div>

      <IconButton label="Delete entry" variant="danger" onClick={props.onDelete} disabled={props.deleting}>
        {props.deleting ? "…" : "✕"}
      </IconButton>
    </div>
  );
}

function FoodListRow(props: {
  food: Food;
  grams: string;
  onChangeGrams: (v: string) => void;
  onAdd: () => void;
  adding: boolean;

  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const f = props.food;
  const isCustom = f.userId !== null;

  return (
    <div className="foodRow">
      <div className="foodMain">
        <div className="foodName">
          <span className="truncate">{f.name}</span>
          {f.brand ? <span className="foodBrand"> • {f.brand}</span> : null}
        </div>

        <div className="foodMeta">
          {f.caloriesPer100g} kcal • P {f.proteinPer100g}g • C {f.carbsPer100g}g • F {f.fatPer100g}g{" "}
          <span className="muted">(per 100g)</span>
        </div>

        <div className="foodBadges">
          <Badge text={isCustom ? "Custom" : "Global"} tone={isCustom ? "blue" : "neutral"} />
        </div>
      </div>

      <div className="foodActions">
        <input
          className="input grams"
          value={props.grams}
          onChange={(e) => props.onChangeGrams(e.target.value)}
          placeholder="grams"
          inputMode="decimal"
          aria-label={`Grams for ${f.name}`}
        />

        <Button onClick={props.onAdd} disabled={props.adding} variant="primary">
          {props.adding ? "Adding…" : "Add"}
        </Button>

        {isCustom ? (
          <>
            <IconButton label="Edit food" onClick={props.onEdit}>
              ✎
            </IconButton>
            <IconButton label="Delete food" variant="danger" onClick={props.onDelete} disabled={props.deleting}>
              {props.deleting ? "…" : "✕"}
            </IconButton>
          </>
        ) : null}
      </div>
    </div>
  );
}
