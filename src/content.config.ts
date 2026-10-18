import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const SECTIONS = ["produce", "meat", "dairy", "frozen", "pantry", "spices", "staples"] as const;
export const UNITS = ["tsp", "tbsp", "cup", "oz", "lb", "each", "clove", "bunch", "can", "in", "stalk"] as const;

// What to buy for one batch of the recipe. Use the same item names and units
// across recipes so the shopping list can combine them.
const shopItem = z.object({
  item: z.string(),
  qty: z.number().positive().optional(),
  unit: z.enum(UNITS).optional(),
  section: z.enum(SECTIONS),
});

// Every recipe in /recipes is checked against this schema at build time,
// so a missing or mistyped field fails the build instead of shipping a broken page.
const recipes = defineCollection({
  loader: glob({ pattern: "*.md", base: "./recipes" }),
  schema: z.object({
    title: z.string(),
    short: z.string().optional(),
    cuisine: z.string(),
    protein: z.enum(["chicken", "turkey", "beef", "vegetarian"]),
    protein_detail: z.string(),
    servings: z.number().int().positive(),
    time_total: z.string(),
    time_active: z.string().optional(),
    kcal: z.number().int().positive(),
    protein_g: z.number().nonnegative(),
    carbs_g: z.number().nonnegative(),
    fat_g: z.number().nonnegative(),
    summary: z.string(),
    glow: z.array(hex).length(3).optional(),
    shop: z.array(shopItem).min(1).optional(),
  }),
});

export const collections = { recipes };
