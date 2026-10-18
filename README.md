# CrustyCrab

Recipe site built with [Astro](https://astro.build) and published to GitHub Pages at https://dh-foo-bar.github.io/crustycrab/.

Pushes to `main` build and deploy the site through GitHub Actions. Recipe pages print as a single letter-size page. Selecting recipes on the site combines their ingredients into one shopping list.

## Adding a recipe

Add a Markdown file to `recipes/`. The file name is the URL slug. Front matter is validated at build time against the schema in `src/content.config.ts`.

```markdown
---
title: Gochujang Chicken
short: Gochujang Chicken    # optional; name used on the shopping list
cuisine: Korean
protein: chicken            # chicken | turkey | beef | pork | lamb | vegetarian
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
shop:                       # optional; what to buy for one batch
  - { item: Chicken breast, qty: 1.5, unit: lb, section: meat }
  - { item: Garlic, qty: 3, unit: clove, section: produce }
  - { item: Soy sauce, qty: 2, unit: tbsp, section: pantry }
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

### Shopping data

Recipes without `shop` still publish but can't be added to a shopping list. Each `shop` entry has an `item`, a `section` and, usually, a `qty` and `unit`.

- **Sections:** `produce`, `meat`, `dairy`, `frozen`, `pantry`, `spices`, `staples` (items most kitchens keep on hand).
- **Units:** `tsp`, `tbsp`, `cup`, `oz`, `lb`, `each`, `clove`, `bunch`, `can`, `in` (piece of ginger), `stalk`.
- Use the same item name and unit as other recipes so amounts combine. Volumes and weights convert between units; counted items round up to whole units.

## Development

```sh
npm install
npm run dev      # local server
npm run build    # output in dist/
```
