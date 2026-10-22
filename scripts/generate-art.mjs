// Generates the contour-line artwork used across the site.
// The motif is a topographic map: terrain you can learn to read, a way of
// finding bearings. It is generated (not stock), so there are no licensing
// questions. Run once; the output SVGs are committed in public/art/.
//
// Usage: D3_PATH=/path/to/node_modules node scripts/generate-art.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const base = process.env.D3_PATH ?? 'node_modules';
const { contours } = require(join(base, 'd3-contour'));
const { geoPath } = require(join(base, 'd3-geo'));

// Deterministic pseudo-random + value noise, so output is reproducible.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeNoise(seed) {
  const rand = mulberry32(seed);
  const size = 256;
  const perm = Array.from({ length: size }, (_, i) => i).sort(() => rand() - 0.5);
  const vals = Array.from({ length: size }, () => rand());
  const lattice = (x, y) => vals[(perm[x & 255] + y) & 255];
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x),
      yi = Math.floor(y);
    const xf = smooth(x - xi),
      yf = smooth(y - yi);
    const a = lattice(xi, yi),
      b = lattice(xi + 1, yi);
    const c = lattice(xi, yi + 1),
      d = lattice(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}
function field(w, h, seed, scale) {
  const n = makeNoise(seed);
  const values = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0,
        amp = 1,
        freq = scale;
      for (let o = 0; o < 3; o++) {
        v += amp * n(x * freq, y * freq);
        amp *= 0.5;
        freq *= 2;
      }
      // a gentle rise towards one side gives the terrain direction
      values[y * w + x] = v + (x / w) * 0.35;
    }
  }
  return values;
}

function render({ name, w, h, seed, scale, levels, stroke, accent, accentEvery, width }) {
  const values = field(w, h, seed, scale);
  const min = Math.min(...values),
    max = Math.max(...values);
  const thresholds = Array.from({ length: levels }, (_, i) => min + ((i + 1) * (max - min)) / (levels + 1));
  const path = geoPath();
  const paths = contours()
    .size([w, h])
    .smooth(true)
    .thresholds(thresholds)(values)
    .map((c, i) => {
      const d = path(c);
      if (!d) return '';
      const isAccent = accent && accentEvery && i % accentEvery === accentEvery - 1;
      return `<path d="${d.replace(/(\d+\.\d)\d+/g, '$1')}" stroke="${isAccent ? accent : stroke}" stroke-width="${isAccent ? width * 1.35 : width}"/>`;
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" fill="none" stroke-linejoin="round" aria-hidden="true">${paths}</svg>\n`;
  const out = join('public', 'art');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `${name}.svg`), svg);
  console.log(`${name}.svg  ${(svg.length / 1024).toFixed(1)} KB`);
}

render({
  name: 'terrain-hero',
  w: 110,
  h: 140,
  seed: 11,
  scale: 0.026,
  levels: 14,
  stroke: '#9fb3a2',
  accent: '#2f4a3a',
  accentEvery: 7,
  width: 0.3,
});
render({
  name: 'terrain-band',
  w: 240,
  h: 45,
  seed: 4,
  scale: 0.04,
  levels: 10,
  stroke: '#3e5c4b',
  accent: '#8fa593',
  accentEvery: 4,
  width: 0.4,
});
render({
  name: 'terrain-small',
  w: 80,
  h: 80,
  seed: 27,
  scale: 0.06,
  levels: 9,
  stroke: '#b9af9f',
  accent: '#2f4a3a',
  accentEvery: 4,
  width: 0.5,
});
