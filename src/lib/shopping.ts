// Combines the shopping lists of several recipes into one list.
// Quantities of the same item are added together, converting between units of
// the same kind (tsp/tbsp/cup, oz/lb). Counted items (bunches, cans, whole
// produce) are rounded up to what you can actually buy.

export type ShopItem = { item: string; qty?: number; unit?: string; section: string };
export type ShopRecipe = { slug: string; name: string; shop: ShopItem[] };
export type Row = { item: string; amount: string; usedIn: string[] };
export type Section = { id: string; label: string; rows: Row[] };

export const SECTION_LABELS: Record<string, string> = {
  produce: "Produce",
  meat: "Meat",
  dairy: "Dairy and eggs",
  frozen: "Frozen",
  pantry: "Pantry",
  spices: "Spices",
  staples: "Staples, likely on hand",
};
const ORDER = Object.keys(SECTION_LABELS);

const VOLUME: Record<string, number> = { tsp: 1, tbsp: 3, cup: 48 }; // in tsp
const WEIGHT: Record<string, number> = { oz: 1, lb: 16 }; // in oz

function family(unit?: string): string {
  if (!unit) return "none";
  if (unit in VOLUME) return "volume";
  if (unit in WEIGHT) return "weight";
  return unit;
}

const FRACTIONS: [number, string][] = [
  [0, ""], [0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"], [1, ""],
];
function frac(x: number): string {
  let whole = Math.floor(x);
  const rest = x - whole;
  let best = FRACTIONS[0];
  for (const f of FRACTIONS) if (Math.abs(f[0] - rest) < Math.abs(best[0] - rest)) best = f;
  if (best[0] === 1) whole += 1;
  const glyph = best[0] === 1 ? "" : best[1];
  if (whole === 0 && !glyph) return "¼";
  return `${whole || ""}${glyph}` || "0";
}

// Nearest quarter or third, so "is this a clean measure?" can be checked.
function nearestFrac(x: number): number {
  const whole = Math.floor(x);
  const opts = [0, 0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1].map((f) => whole + f);
  return opts.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a));
}

function formatVolume(tsp: number): string {
  const cups = tsp / 48;
  // Cups from ½ cup up, or from ¼ cup when the amount is a clean cup measure.
  if (tsp >= 24 || (tsp >= 12 && Math.abs(nearestFrac(cups) - cups) < 0.02)) {
    return `${frac(cups)} ${cups > 1.01 ? "cups" : "cup"}`;
  }
  // Tablespoons when the amount lands on a whole or half tablespoon.
  const tbsp = tsp / 3;
  if (tsp >= 3 && Math.abs(Math.round(tbsp * 2) / 2 - tbsp) < 0.05) return `${frac(tbsp)} tbsp`;
  return `${frac(tsp)} tsp`;
}
function formatWeight(oz: number): string {
  if (oz >= 16) return `${frac(oz / 16)} lb`;
  return `${frac(oz)} oz`;
}
function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function format(fam: string, total: number): string {
  switch (fam) {
    case "volume": return formatVolume(total);
    case "weight": return formatWeight(total);
    case "clove": {
      const n = Math.ceil(total);
      return n >= 8 ? `${n} cloves (${plural(Math.ceil(n / 10), "head", "heads")})` : plural(n, "clove", "cloves");
    }
    case "bunch": return plural(Math.ceil(total), "bunch", "bunches");
    case "can": return plural(Math.ceil(total), "can", "cans");
    case "stalk": return plural(Math.ceil(total), "stalk", "stalks");
    case "in": return `${frac(total)} in piece`;
    case "each": return String(Math.ceil(total));
    default: return "";
  }
}

export function combine(recipes: ShopRecipe[]): Section[] {
  const map = new Map<string, { item: string; section: string; fam: string; total: number; usedIn: string[] }>();
  for (const r of recipes) {
    for (const s of r.shop) {
      const fam = family(s.unit);
      const key = `${s.item.toLowerCase()}|${fam}`;
      const base = s.qty === undefined ? 0 : s.qty * (VOLUME[s.unit!] ?? WEIGHT[s.unit!] ?? 1);
      const e = map.get(key) ?? { item: s.item, section: s.section, fam, total: 0, usedIn: [] };
      e.total += base;
      if (!e.usedIn.includes(r.name)) e.usedIn.push(r.name);
      map.set(key, e);
    }
  }
  // An item listed without an amount (e.g. "Hot sauce") joins a measured line of the same item.
  for (const [key, e] of map) {
    if (e.fam !== "none") continue;
    const other = [...map.values()].find((o) => o !== e && o.item.toLowerCase() === e.item.toLowerCase());
    if (other) {
      for (const u of e.usedIn) if (!other.usedIn.includes(u)) other.usedIn.push(u);
      map.delete(key);
    }
  }
  const sections: Section[] = ORDER.map((id) => ({ id, label: SECTION_LABELS[id], rows: [] }));
  for (const e of map.values()) {
    const sec = sections.find((s) => s.id === e.section) ?? sections[sections.length - 1];
    sec.rows.push({ item: e.item, amount: format(e.fam, e.total), usedIn: e.usedIn });
  }
  for (const s of sections) s.rows.sort((a, b) => a.item.localeCompare(b.item));
  return sections.filter((s) => s.rows.length);
}

export function asText(sections: Section[], recipeNames: string[]): string {
  const out = [`Shopping list: ${recipeNames.join(", ")}`, ""];
  for (const s of sections) {
    out.push(s.label);
    for (const r of s.rows) out.push(`- ${r.item}${r.amount ? `: ${r.amount}` : ""}`);
    out.push("");
  }
  return out.join("\n").trim();
}

// Selected recipes, kept in the browser so the selection survives moving between pages.
const KEY = "crustycrab.selection";
export function readSelection(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
export function writeSelection(slugs: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(slugs)); } catch { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent("selection-change", { detail: slugs }));
}
export function toggleSelection(slug: string): string[] {
  const cur = readSelection();
  const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug];
  writeSelection(next);
  return next;
}
