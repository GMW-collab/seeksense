// Captures screenshots of key pages at mobile and desktop widths for review.
// Usage: node tests/browser/screens.ts <outDir>
import { chromium } from 'playwright';
import { build } from '../../src/build.ts';
import { readSettings } from '../../src/config/env.ts';
import { createAppServer } from '../../server/server.ts';
import type { AddressInfo } from 'node:net';

const out = process.argv[2] ?? 'test-results/screens';
const pages = (
  process.argv[3] ??
  '/,/services/talking-therapy/,/find-support/,/contact/,/resources/choosing-a-therapist/,/urgent-help/,/about/,/approach/'
).split(',');
const result = build({ ...readSettings(), env: 'preview', strict: false });
const server = createAppServer({ root: result.outDir, mailer: null });
await new Promise<void>((r) => server.listen(0, r));
const port = (server.address() as AddressInfo).port;
const browser = await chromium.launch();
for (const [label, width, height] of [
  ['mobile', 390, 844],
  ['desktop', 1366, 900],
] as const) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  for (const p of pages) {
    await page.goto(`http://localhost:${port}${p}`, { waitUntil: 'networkidle' });
    const name = p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '_');
    await page.screenshot({ path: `${out}/${label}-${name}.png`, fullPage: true });
  }
  await page.close();
}
await browser.close();
server.close();
console.log(`Screenshots in ${out}`);
