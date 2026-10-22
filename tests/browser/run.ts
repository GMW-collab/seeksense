// Browser checks with Playwright (Chromium): layout at small widths, console
// and CSP errors, keyboard access, the mobile menu, the support guide and the
// enquiry form. Usage: npm run test:browser
import { chromium, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { build } from '../../src/build.ts';
import { createAppServer } from '../../server/server.ts';
import type { Enquiry } from '../../server/validation.ts';

const result = build(
  { env: 'preview', siteUrl: 'https://seeksense.co', publishFutureSection: false, bookingUrl: null, strict: false },
  mkdtempSync(join(tmpdir(), 'seeksense-browser-')),
);
const received: Enquiry[] = [];
const server = createAppServer({
  root: result.outDir,
  mailer: { name: 'test', send: async (e) => void received.push(e) },
});
await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
const browser = await chromium.launch();
let failures = 0;

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failures++;
    console.log(`FAIL ${name}\n     ${err instanceof Error ? err.message.split('\n').join('\n     ') : err}`);
  }
}

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

const paths = result.pages.map((p) => p.path).filter((p) => p.endsWith('/'));

await check(`no horizontal scrolling or console/CSP errors at 320px (${paths.length} pages)`, async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 640 } });
  const errors = watchErrors(page);
  const overflow: string[] = [];
  for (const p of paths) {
    await page.goto(origin + p, { waitUntil: 'networkidle' });
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (wide) overflow.push(p);
  }
  await page.close();
  assert.deepEqual(overflow, [], `pages overflow horizontally: ${overflow.join(', ')}`);
  assert.deepEqual(errors, [], 'console errors');
});

await check('first Tab focuses the skip link, which moves focus to main content', async () => {
  const page = await browser.newPage();
  await page.goto(`${origin}/approach/`);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Skip to main content');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'main');
  await page.close();
});

await check('mobile menu opens, closes with Escape and returns focus', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  await page.goto(`${origin}/`);
  const toggle = page.locator('[data-menu-toggle]');
  assert.equal(await page.locator('#site-nav').isVisible(), false);
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#site-nav').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-menu-toggle')), true);
  await page.close();
});

await check('mobile menu works without JavaScript', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${origin}/`);
  await page.locator('[data-menu-toggle]').click();
  assert.equal(await page.locator('#site-nav').isVisible(), true);
  await context.close();
});

await check('support guide shows a suggestion without changing the URL', async () => {
  const page = await browser.newPage();
  await page.goto(`${origin}/find-support/`);
  assert.equal(await page.locator('[data-finder-templates]').isVisible(), false);
  await page.locator('#opt-navigate').check();
  const result = page.locator('[data-finder-result]');
  await result.waitFor({ state: 'visible' });
  assert.match((await result.textContent()) ?? '', /Help finding the right support/);
  await page.keyboard.press('ArrowDown');
  assert.match((await result.textContent()) ?? '', /Start with a conversation/);
  assert.equal(new URL(page.url()).search, '');
  await page.close();
});

await check('enquiry form: accessible errors, then successful submission', async () => {
  const page = await browser.newPage();
  const errors = watchErrors(page);
  await page.goto(`${origin}/contact/`);
  await page.locator('[data-submit]').click();
  const summary = page.locator('[data-form-error]');
  await summary.waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-form-error')), true);
  assert.equal(await page.locator('#email').getAttribute('aria-invalid'), 'true');
  assert.match((await page.locator('#name-error').textContent()) ?? '', /Enter your name/);

  await page.fill('#name', 'Jo Test');
  await page.fill('#email', 'jo@example.org');
  await page.selectOption('#interest', 'signposting');
  await page.fill('#message', 'Mornings are best.');
  await page.check('#consent');
  await page.waitForTimeout(2700); // the server rejects instant (bot-like) submissions
  await page.locator('[data-submit]').click();
  const success = page.locator('[data-form-success]');
  await success.waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-enquiry-form]').isVisible(), false);
  assert.equal(received.at(-1)?.email, 'jo@example.org');
  assert.deepEqual(errors, []);
  await page.close();
});

await check('enquiry form posts and redirects without JavaScript', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${origin}/contact/`);
  await page.fill('#name', 'No Script');
  await page.fill('#email', 'noscript@example.org');
  await page.selectOption('#interest', 'other');
  await page.check('#consent');
  await page.locator('[data-submit]').click();
  await page.waitForURL('**/contact/received/');
  await context.close();
});

await check('reduced motion is respected', async () => {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto(`${origin}/`);
  const duration = await page.evaluate(() => getComputedStyle(document.querySelector('.button')!).transitionDuration);
  assert.ok(
    duration.split(',').every((d) => parseFloat(d) < 0.001),
    duration,
  );
  await page.close();
});

await browser.close();
server.close();
console.log(failures ? `\n${failures} browser check(s) failed` : '\nAll browser checks passed');
process.exit(failures ? 1 : 0);
