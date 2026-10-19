// Generative particle-physics line art. Each recipe gets its own composition, seeded
// from its slug, so no two cards look alike. Three modes share one palette:
//   atom        an exact atom, scaled up so its orbits sweep past the edges
//   trajectory  a zoomed-in view of a particle's path: fragments of huge orbits and a
//               wandering, smoothed track that crosses the whole card
//   chamber     bubble-chamber tracks: a decaying spiral and long, gentle curves
// Lines are hairline; color comes from soft blue and orange auras and gradient strokes.

const BLUE = "#7cc4ff";
const ORANGE = "#ff9a52";
const LINE = "220 235 255";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => Math.round(n * 10) / 10;
type Pt = [number, number];

// Smooth curve through points (Catmull-Rom converted to cubic Béziers).
function smooth(p: Pt[]): string {
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

type Variant = "tile" | "hero" | "home";
type Mode = "atom" | "trajectory" | "chamber";

const SIZES: Record<Variant, { w: number; h: number; k: number }> = {
  tile: { w: 400, h: 260, k: 1 },
  hero: { w: 560, h: 440, k: 1.35 },
  home: { w: 720, h: 560, k: 1.6 },
};

export function artMode(slug: string): Mode {
  const x = rng(hash(`mode:${slug}`))();
  return x < 0.3 ? "atom" : x < 0.68 ? "trajectory" : "chamber";
}

export function atomArt(seedKey: string, variant: Variant = "tile"): string {
  const seed = hash(`${seedKey}:${variant}`);
  const r = rng(seed);
  const { w, h, k } = SIZES[variant];
  const id = `a${seed.toString(36)}`;
  const animate = variant !== "tile";
  const mode: Mode = variant === "home" ? "atom" : artMode(seedKey);
  const sw = (n: number) => f(n * (variant === "tile" ? 1 : 1.25));

  const warm = r() < 0.5;
  const c1 = warm ? ORANGE : BLUE;
  const c2 = warm ? BLUE : ORANGE;

  const defs: string[] = [
    `<radialGradient id="${id}-a1"><stop offset="0" stop-color="${c1}" stop-opacity=".42"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="${id}-a2"><stop offset="0" stop-color="${c2}" stop-opacity=".3"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="${id}-n"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${c1}" stop-opacity=".55"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="${id}-eb"><stop offset="0" stop-color="${BLUE}" stop-opacity=".9"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="${id}-eo"><stop offset="0" stop-color="${ORANGE}" stop-opacity=".9"/><stop offset="1" stop-color="${ORANGE}" stop-opacity="0"/></radialGradient>`,
    `<linearGradient id="${id}-lg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="0"><stop offset="0" stop-color="${c2}" stop-opacity="0"/><stop offset=".25" stop-color="${c2}"/><stop offset=".6" stop-color="#e8f1ff"/><stop offset="1" stop-color="${c1}"/></linearGradient>`,
  ];
  const back: string[] = [];
  const lines: string[] = [];
  const front: string[] = [];

  // Auras spread across the whole width
  back.push(`<circle cx="${f(w * (0.12 + 0.3 * r()))}" cy="${f(h * (0.3 + 0.4 * r()))}" r="${f(w * 0.48)}" fill="url(#${id}-a1)"/>`);
  back.push(`<circle cx="${f(w * (0.58 + 0.32 * r()))}" cy="${f(h * (0.25 + 0.5 * r()))}" r="${f(w * 0.42)}" fill="url(#${id}-a2)"/>`);

  // Dust
  const nP = Math.round((12 + r() * 10) * k);
  for (let i = 0; i < nP; i++) {
    back.push(`<circle cx="${f(r() * w)}" cy="${f(r() * h)}" r="${f(0.5 + r() * 0.8)}" fill="#fff" opacity="${f(0.1 + r() * 0.35)}"/>`);
  }

  const glowDot = (x: number, y: number, blue: boolean, size = 1) => {
    front.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(9 * size * (variant === "tile" ? 1 : 1.35))}" fill="url(#${id}-${blue ? "eb" : "eo"})"/>`);
    front.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.9 * size * (variant === "tile" ? 1 : 1.3))}" fill="${blue ? BLUE : ORANGE}"/>`);
  };

  // A wandering particle track across the full width, with a faint offset echo
  const track = (opts: { echo?: boolean; trail?: boolean; flow?: boolean; y0?: number; amp?: number }) => {
    const steps = 7 + Math.floor(r() * 4);
    const amp = (opts.amp ?? 0.22) * h;
    // Keep tracks inside the band that stays visible after cropping and the fade
    const lo = h * 0.2, hi = h * (variant === "tile" ? 0.66 : 0.8);
    let y = opts.y0 ?? lo + (hi - lo) * r();
    let vy = (r() - 0.5) * amp * 0.6;
    const pts: Pt[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = -20 + ((w + 40) * i) / steps + (i && i < steps ? (r() - 0.5) * (w / steps) * 0.5 : 0);
      pts.push([x, y]);
      vy = vy * 0.55 + (r() - 0.5) * amp;
      y = Math.min(hi, Math.max(lo, y + vy));
    }
    const d = smooth(pts);
    lines.push(`<path d="${d}" fill="none" stroke="url(#${id}-lg)" stroke-opacity=".7" stroke-width="${sw(1.1)}" stroke-linecap="round"/>`);
    if (opts.echo) {
      const off = 3 + r() * 5;
      lines.push(`<path d="${d}" transform="translate(${f(r() * 6 - 3)} ${f(off)})" fill="none" stroke="rgb(${LINE})" stroke-opacity=".16" stroke-width="${sw(0.6)}" stroke-dasharray="2 6"/>`);
    }
    if (opts.flow && animate) {
      lines.push(`<path class="flow" d="${d}" pathLength="1000" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="${sw(1.4)}" stroke-linecap="round" style="--d:${Math.round(9 + r() * 6)}s"/>`);
    }
    if (opts.trail) {
      // The particle itself, partway along, with a short dotted wake behind it
      const i = Math.floor(steps * (0.45 + 0.35 * r()));
      const [px, py] = pts[i];
      const [qx, qy] = pts[i - 1];
      for (let j = 1; j <= 5; j++) {
        const t = j / 6;
        lines.push(`<circle cx="${f(px + (qx - px) * t)}" cy="${f(py + (qy - py) * t)}" r="${f(1.1 - t * 0.6)}" fill="#fff" opacity="${f(0.5 - t * 0.4)}"/>`);
      }
      glowDot(px, py, r() < 0.5, 0.9);
      return { pts, px, py };
    }
    return { pts, px: pts[0][0], py: pts[0][1] };
  };

  // A fragment of an enormous orbit: center off-canvas so only an arc crosses the card
  const arc = (dashed = false) => {
    const below = r() < 0.5;
    const cx = w * (-0.3 + 1.6 * r());
    const cy = below ? h * (1.05 + r() * 0.6) : -h * (0.1 + r() * 0.6);
    const rx = w * (0.75 + r() * 0.8);
    const ry = rx * (0.32 + r() * 0.35);
    const rot = (r() - 0.5) * 40;
    lines.push(`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})" fill="none" stroke="${dashed ? BLUE : `rgb(${LINE})`}" stroke-opacity="${f(dashed ? 0.35 : 0.13 + r() * 0.14)}" stroke-width="${sw(0.8)}"${dashed ? ` stroke-dasharray="1.5 5"` : ""}/>`);
  };

  if (mode === "atom") {
    // An exact atom, large enough that its orbits run past the edges
    const cx = w * (0.38 + 0.26 * r());
    const cy = h * (0.4 + (variant === "tile" ? 0.1 : 0.14) * r());
    const base = variant === "home" ? h * 0.42 : h * (0.5 + 0.18 * r());
    const n = 3 + Math.floor(r() * 2);
    const start = r() * 180;
    const dashed = Math.floor(r() * n);
    const electrons = new Set([Math.floor(r() * n), Math.floor(r() * n)]);
    for (let i = 0; i < n; i++) {
      const rx = base * (0.62 + i * 0.36) * (0.92 + 0.16 * r());
      const ry = rx * (0.18 + 0.2 * r());
      const ang = start + i * (180 / n) + (r() - 0.5) * 20;
      const g = [`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${i === dashed ? BLUE : `rgb(${LINE})`}" stroke-opacity="${f(i === dashed ? 0.38 : 0.16 + r() * 0.16)}" stroke-width="${sw(0.85)}"${i === dashed ? ` stroke-dasharray="1.5 5"` : ""}/>`];
      if (electrons.has(i)) {
        const th = r() * Math.PI * 2;
        const ex = cx + rx * Math.cos(th), ey = cy + ry * Math.sin(th);
        const blue = r() < 0.5;
        g.push(`<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(variant === "tile" ? 9 : 13)}" fill="url(#${id}-${blue ? "eb" : "eo"})"/><circle cx="${f(ex)}" cy="${f(ey)}" r="${variant === "tile" ? 1.9 : 2.6}" fill="${blue ? BLUE : ORANGE}"/>`);
      }
      const spin = animate ? ` class="orbit" style="--o:${f(cx)}px ${f(cy)}px;--d:${Math.round(110 + r() * 120)}s;--dir:${r() < 0.5 ? "normal" : "reverse"}"` : "";
      lines.push(`<g transform="rotate(${f(ang)} ${f(cx)} ${f(cy)})"><g${spin}>${g.join("")}</g></g>`);
    }
    front.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(base * 0.3)}" fill="url(#${id}-n)"/>`);
    const nr = variant === "tile" ? 2.3 : 3.2;
    for (let i = 0, nN = 5 + Math.floor(r() * 5); i < nN; i++) {
      const a = r() * Math.PI * 2, d = r() * nr * 1.9;
      front.push(`<circle cx="${f(cx + d * Math.cos(a))}" cy="${f(cy + d * Math.sin(a))}" r="${nr}" fill="${i % 2 ? BLUE : ORANGE}" fill-opacity=".85"/>`);
    }
    if (variant === "home" || r() < 0.5) track({ echo: true, flow: true, amp: 0.16 });
  } else if (mode === "trajectory") {
    const nArcs = 2 + Math.floor(r() * 2);
    for (let i = 0; i < nArcs; i++) arc(i === 0 && r() < 0.6);
    const t = track({ echo: true, trail: true, flow: true });
    // A scattering event: short divergent tracks branching off the main path
    if (r() < 0.6) {
      const [sx, sy] = t.pts[Math.floor(t.pts.length * (0.25 + 0.3 * r()))];
      for (let j = 0, nb = 2 + Math.floor(r() * 2); j < nb; j++) {
        const a = (r() - 0.5) * Math.PI * 1.4;
        const len = 30 + r() * 60;
        const bend = (r() - 0.5) * 40;
        const ex = sx + Math.cos(a) * len, ey = sy + Math.sin(a) * len;
        const mx = (sx + ex) / 2 - Math.sin(a) * bend, my = (sy + ey) / 2 + Math.cos(a) * bend;
        lines.push(`<path d="M${f(sx)} ${f(sy)} Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}" fill="none" stroke="${j % 2 ? BLUE : ORANGE}" stroke-opacity=".45" stroke-width="${sw(0.7)}" stroke-linecap="round"/>`);
      }
    }
    if (r() < 0.5) track({ amp: 0.12 });
  } else {
    // Bubble-chamber tracks: a charged particle spiralling down as it loses energy
    const nS = 1 + (r() < 0.45 ? 1 : 0);
    for (let s = 0; s < nS; s++) {
      const cx = w * (0.22 + 0.56 * r());
      const cy = h * (0.32 + (variant === "tile" ? 0.2 : 0.3) * r());
      const r0 = h * (0.26 + 0.18 * r()) * (s ? 0.6 : 1);
      const dir = r() < 0.5 ? 1 : -1;
      const th0 = r() * Math.PI * 2;
      const pts: Pt[] = [];
      for (let th = 0; th < Math.PI * 4.2; th += 0.18) {
        const rr = r0 * Math.exp(-0.2 * th);
        pts.push([cx + rr * Math.cos(th0 + dir * th), cy + rr * Math.sin(th0 + dir * th) * 0.86]);
      }
      // A long incoming tail that meets the spiral's outer end
      const [sx, sy] = pts[0];
      const tailX = sx < w / 2 ? -30 : w + 30;
      const tail = smooth([[tailX, sy + (r() - 0.5) * h * 0.5], [(tailX + sx) / 2, sy + (r() - 0.5) * h * 0.25], [sx, sy]]);
      lines.push(`<path d="${tail}" fill="none" stroke="url(#${id}-lg)" stroke-opacity=".55" stroke-width="${sw(1)}"/>`);
      lines.push(`<path d="${smooth(pts)}" fill="none" stroke="${s ? c2 : c1}" stroke-opacity=".55" stroke-width="${sw(0.9)}" stroke-linecap="round"/>`);
      const [ex, ey] = pts[pts.length - 1];
      glowDot(ex, ey, (s ? c2 : c1) === BLUE, 0.8);
    }
    // Long, gently curved tracks of faster particles crossing the chamber
    for (let i = 0, nT = 2 + Math.floor(r() * 2); i < nT; i++) {
      const y1 = h * (0.15 + 0.55 * r()), y2 = h * (0.15 + 0.55 * r());
      const my = (y1 + y2) / 2 + (r() - 0.5) * h * 0.5;
      lines.push(`<path d="M-20 ${f(y1)} Q${f(w * (0.3 + 0.4 * r()))} ${f(my)} ${w + 20} ${f(y2)}" fill="none" stroke="rgb(${LINE})" stroke-opacity="${f(0.12 + r() * 0.14)}" stroke-width="${sw(0.7)}"${i === 0 ? ` stroke-dasharray="1 4"` : ""}/>`);
    }
    if (r() < 0.5) arc();
  }

  return `<svg class="art art-${variant}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>${defs.join("")}</defs>${back.join("")}${lines.join("")}${front.join("")}</svg>`;
}

// Two-letter, periodic-table style symbols for recipes ("Gochujang Chicken" -> "Gc"),
// unique across the collection. Pass titles in display order.
const SKIP = /^(with|and|over|the|of|a|in|on|for|e|en|au|al)$/i;
export function elementSymbols(titles: string[]): Map<string, string> {
  const used = new Set<string>();
  const out = new Map<string, string>();
  for (const title of titles) {
    const words = title.replace(/\(.*?\)/g, "").split(/[\s-]+/).filter((w) => w && !SKIP.test(w)).map((w) => w.replace(/[^\p{L}]/gu, ""));
    const first = (words[0] || "X")[0].toUpperCase();
    const seconds = [
      ...words.slice(1).map((w) => w[0]),
      ...(words[0] ?? "").slice(1),
      ...words.slice(1).flatMap((w) => [...w.slice(1)]),
    ].filter(Boolean).map((c) => c.toLowerCase());
    let sym = first + (seconds[0] ?? "");
    for (const c of seconds) {
      if (!used.has(first + c)) { sym = first + c; break; }
    }
    used.add(sym);
    out.set(title, sym);
  }
  return out;
}
