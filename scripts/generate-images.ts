// Builds the favicon, touch icon and Open Graph image from the supplied logo
// (public/brand/seeksense-logo.png). The logo pixels are used as supplied; the
// icons are a square crop of its ear-and-question-mark symbol.
// Run after changing the logo: node scripts/generate-images.ts
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const font = (f: string) => `data:font/woff;base64,${readFileSync(`${root}public/fonts/${f}`).toString('base64')}`;
const logo = `data:image/png;base64,${readFileSync(`${root}public/brand/seeksense-logo.png`).toString('base64')}`;
const art = `data:image/svg+xml;base64,${readFileSync(`${root}public/art/terrain-hero.svg`).toString('base64')}`;

// The ear symbol sits at x≈531–576 of the 592×117 logo.
const EAR = { x: 504, y: 0, size: 100 };

const og = `<!doctype html><html><head><style>
@font-face{font-family:N;src:url(${font('Newsreader.woff')})}
@font-face{font-family:H;src:url(${font('HankenGrotesk.woff')})}
body{margin:0;width:1200px;height:630px;background:#f5f1e8;display:grid;grid-template-columns:7fr 4fr;font-family:H}
.t{padding:72px 64px;display:flex;flex-direction:column;justify-content:space-between}
.l{height:64px;width:auto;mix-blend-mode:multiply;align-self:flex-start}
h1{font-family:N;font-weight:400;font-size:66px;line-height:1.05;letter-spacing:-.02em;margin:0;color:#1c2620}
p{font-size:24px;color:#5e5647;margin:0}
.a{background:url(${art}) center/cover;border-left:1px solid #cfc5b4}
</style></head><body><div class="t"><img class="l" src="${logo}" alt="">
<h1>Help to make sense of what you are going through.</h1>
<p>Talking therapy &middot; Assessment &middot; Guidance</p></div><div class="a"></div></body></html>`;

const icon = (px: number) => `<!doctype html><html><body style="margin:0;width:${px}px;height:${px}px;background:#fff;overflow:hidden">
<div style="width:${px}px;height:${px}px;background:url(${logo}) no-repeat;background-size:${(592 / EAR.size) * px}px auto;
background-position:-${(EAR.x / EAR.size) * px}px ${(((EAR.size - 117) / 2) / EAR.size) * px}px"></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(og);
await page.waitForTimeout(300);
await page.screenshot({ path: `${root}public/og-image.png` });
for (const [px, file] of [
  [180, 'apple-touch-icon.png'],
  [32, 'favicon-32.png'],
] as const) {
  await page.setViewportSize({ width: px, height: px });
  await page.setContent(icon(px));
  await page.waitForTimeout(100);
  await page.screenshot({ path: `${root}public/${file}` });
}
await browser.close();
console.log('Wrote og-image.png, apple-touch-icon.png and favicon-32.png');
