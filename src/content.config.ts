import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

// Every recipe in /recipes is checked against this schema at build time,
// so a missing or mistyped field fails the build instead of shipping a broken page.
const recipes = defineCollection({
  loader: glob({ pattern: "*.md", base: "./recipes" }),
  schema: z.object({
    title: z.string(),
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
  }),
});

export const collections = { recipes };
