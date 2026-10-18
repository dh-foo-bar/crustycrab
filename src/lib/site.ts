// Links that respect the GitHub Pages base path ("/crustycrab").
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
export const url = (path = "/") => `${BASE}${path.startsWith("/") ? path : `/${path}`}`;

// Fallback glow colors when a recipe doesn't set its own: drawn from
// ingredients typical of the cuisine. Order: main, secondary, accent.
const CUISINE_GLOW: Record<string, [string, string, string]> = {
  italian: ["#d83a26", "#f2902e", "#3f7f3b"],
  korean: ["#c7321f", "#e59a3b", "#d9c7a1"],
  thai: ["#d93b2b", "#7fb53a", "#f0c23b"],
  mexican: ["#b8401f", "#3f9a4a", "#f2b23e"],
  indian: ["#e0a22a", "#c8452b", "#5a8f3c"],
  greek: ["#f2d04a", "#4f8a4b", "#e8e2d0"],
  french: ["#7a2a3a", "#d79a4a", "#5e7d4a"],
  japanese: ["#c94a2c", "#6f8f3a", "#e9d8b0"],
  chinese: ["#c4321f", "#e2a13a", "#7a3b1f"],
};
const DEFAULT_GLOW: [string, string, string] = ["#e0823a", "#c4452b", "#6d8a3e"];

export function glowFor(recipe: { cuisine: string; glow?: string[] }): [string, string, string] {
  if (recipe.glow?.length === 3) return recipe.glow as [string, string, string];
  const key = recipe.cuisine.toLowerCase().split(/[\s-]/)[0];
  return CUISINE_GLOW[key] ?? DEFAULT_GLOW;
}

export const glowStyle = (g: [string, string, string]) => `--g1:${g[0]};--g2:${g[1]};--g3:${g[2]}`;

// Wraps each "## Heading" and the content under it in <section class="sec sec-<heading>">,
// so recipe pages can lay out Ingredients, Steps and Notes as separate panels
// while the Markdown stays plain.
export function sectionize(html: string): string {
  return html
    .split(/(?=<h2[\s>])/)
    .map((chunk) => {
      const m = chunk.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/);
      if (!m) return chunk;
      const key = m[1].replace(/<[^>]+>/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return `<section class="sec sec-${key}">${chunk}</section>`;
    })
    .join("");
}

export const PROTEINS = [
  ["chicken", "Chicken"],
  ["turkey", "Turkey"],
  ["beef", "Beef"],
  ["vegetarian", "Vegetarian"],
] as const;
