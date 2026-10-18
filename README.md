# CrustyCrab

Recipe site built with [Astro](https://astro.build) and published to GitHub Pages at https://dh-foo-bar.github.io/crustycrab/.

Pushes to `main` build and deploy the site through GitHub Actions. Recipe pages print as a single letter-size page.

## Adding a recipe

Add a Markdown file to `recipes/`. The file name is the URL slug. Front matter is validated at build time against the schema in `src/content.config.ts`.

```markdown
---
title: Gochujang Chicken
date: 2026-10-14
cuisine: Korean
protein: chicken            # chicken | turkey | beef | vegetarian
protein_detail: Chicken breast
servings: 4
time_total: 40 min
time_active: 25 min         # optional
kcal: 600                   # per serving
protein_g: 45
carbs_g: 60
fat_g: 18
summary: One sentence shown on the card and under the title.
glow: ["#c7321f", "#e59a3b", "#d9c7a1"]   # optional; defaults by cuisine
---

## Ingredients

### Optional group

- Ingredient

## Steps

1. **Step name.** Instructions.

## Notes

- Note.
```

`## Ingredients`, `## Steps` and `## Notes` are laid out as separate panels, so keep those headings.

## Development

```sh
npm install
npm run dev      # local server
npm run build    # output in dist/
```
