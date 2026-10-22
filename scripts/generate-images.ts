// Renders the Open Graph image and touch icon from local assets with Playwright.
// Run after changing the brand: node scripts/generate-images.ts
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const font = (f: string) => `data:font/woff;base64,${readFileSync(`${root}public/fonts/${f}`).toString('base64')}`;
const art = `data:image/svg+xml;base64,${readFileSync(`${root}public/art/terrain-hero.svg`).toString('base64')}`;
const mark = readFileSync(`${root}public/favicon.svg`, 'utf8');

const og = `<!doctype html><html><head><style>
@font-face{font-family:N;src:url(${font('Newsreader.woff')})}
@font-face{font-family:H;src:url(${font('HankenGrotesk.woff')})}
body{margin:0;width:1200px;height:630px;background:#f5f1e8;display:grid;grid-template-columns:7fr 4fr;font-family:H}
.t{padding:72px 64px;display:flex;flex-direction:column;justify-content:space-between}
.w{display:flex;gap:14px;align-items:center;font-family:N;font-size:40px;color:#1c2620}
.w svg{width:52px;height:52px}
h1{font-family:N;font-weight:400;font-size:70px;line-height:1.04;letter-spacing:-.02em;margin:0;color:#1c2620}
p{font-size:24px;color:#5e5647;margin:0}
.a{background:url(${art}) center/cover;border-left:1px solid #cfc5b4}
</style></head><body><div class="t"><div class="w">${mark}SeekSense</div>
<h1>Help to make sense of what you are going through.</h1>
<p>Talking therapy &middot; Assessment &middot; Guidance</p></div><div class="a"></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(og);
await page.waitForTimeout(300);
await page.screenshot({ path: `${root}public/og-image.png` });
await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(
  `<body style="margin:0;background:#f5f1e8;display:grid;place-items:center;height:180px">${mark.replace('<svg ', '<svg width="150" height="150" ')}</body>`,
);
await page.screenshot({ path: `${root}public/apple-touch-icon.png` });
await browser.close();
console.log('Wrote public/og-image.png and public/apple-touch-icon.png');
