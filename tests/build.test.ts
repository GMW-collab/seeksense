import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { build, UnverifiedContentError } from '../src/build.ts';
import type { BuildSettings } from '../src/config/env.ts';

const base: BuildSettings = {
  env: 'preview',
  siteUrl: 'https://seeksense.co',
  publishFutureSection: false,
  bookingUrl: null,
  strict: false,
};

function out(): string {
  return mkdtempSync(join(tmpdir(), 'seeksense-'));
}

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
  });
}

function resolves(dir: string, href: string): boolean {
  const path = href.split('#')[0]!.split('?')[0]!;
  if (path === '') return true;
  const target = join(dir, path);
  return (existsSync(target) && statSync(target).isFile()) || existsSync(join(target, 'index.html'));
}

const preview = build(base, out());

test('preview build: every internal link and asset resolves', () => {
  const broken: string[] = [];
  for (const file of htmlFiles(preview.outDir)) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      if (m[1]!.startsWith('/api/')) continue;
      if (!resolves(preview.outDir, m[1]!)) broken.push(`${relative(preview.outDir, file)} -> ${m[1]}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('preview build: same-page anchors exist', () => {
  for (const file of htmlFiles(preview.outDir)) {
    const html = readFileSync(file, 'utf8');
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const m of html.matchAll(/href="#([^"]+)"/g))
      assert.ok(ids.has(m[1]), `${relative(preview.outDir, file)}: #${m[1]}`);
  }
});

test('every page has essential metadata and one h1', () => {
  for (const file of htmlFiles(preview.outDir)) {
    const html = readFileSync(file, 'utf8');
    const name = relative(preview.outDir, file);
    assert.match(html, /<html lang="en-GB">/, name);
    assert.match(html, /<title>[^<]{5,}<\/title>/, name);
    assert.match(html, /<meta name="description" content="[^"]{10,}"/, name);
    assert.match(html, /<link rel="canonical" href="https:\/\/seeksense\.co\//, name);
    assert.match(html, /<meta property="og:image"/, name);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${name} h1 count`);
    assert.match(html, /<main id="main"/, name);
  }
});

test('markup is CSP-compatible: no inline scripts, styles or event handlers', () => {
  for (const file of htmlFiles(preview.outDir)) {
    const html = readFileSync(file, 'utf8');
    const name = relative(preview.outDir, file);
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g))
      assert.match(m[1]!, /application\/ld\+json/, name);
    assert.ok(!/\sstyle="/.test(html), `${name} has inline style`);
    assert.ok(!/\son[a-z]+="/i.test(html), `${name} has inline handler`);
    assert.ok(!/<style[\s>]/.test(html), `${name} has style element`);
  }
});

test('accessibility basics: images have alt, form controls have labels, ids are unique', () => {
  for (const file of htmlFiles(preview.outDir)) {
    const html = readFileSync(file, 'utf8');
    const name = relative(preview.outDir, file);
    for (const m of html.matchAll(/<img\b[^>]*>/g)) assert.match(m[0], /\salt="/, `${name}: ${m[0]}`);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${name} duplicate ids`);
    for (const m of html.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
      if (/type="hidden"/.test(m[2]!)) continue;
      const id = /\sid="([^"]+)"/.exec(m[2]!)?.[1];
      assert.ok(id && html.includes(`for="${id}"`), `${name}: unlabelled ${m[0]}`);
    }
  }
});

test('preview is not indexable and lists items awaiting verification', () => {
  assert.match(readFileSync(join(preview.outDir, 'robots.txt'), 'utf8'), /Disallow: \//);
  assert.match(readFileSync(join(preview.outDir, 'index.html'), 'utf8'), /noindex/);
  assert.ok(preview.pending.length > 0);
  assert.ok(existsSync(join(preview.outDir, '_verification/index.html')));
  const sitemap = readFileSync(join(preview.outDir, 'sitemap.xml'), 'utf8');
  assert.ok(
    !sitemap.includes('_verification') && !sitemap.includes('styleguide') && !sitemap.includes('/contact/received/'),
  );
});

test('future section is absent unless explicitly enabled, and never indexed', () => {
  assert.ok(!existsSync(join(preview.outDir, 'future')));
  const all = htmlFiles(preview.outDir)
    .map((f) => readFileSync(f, 'utf8'))
    .join('');
  assert.ok(!all.includes('href="/future/"'), 'nothing links to the future section');
  const withFuture = build({ ...base, publishFutureSection: true }, out());
  const page = readFileSync(join(withFuture.outDir, 'future/index.html'), 'utf8');
  assert.match(page, /noindex/);
  assert.match(page, /Not available/);
  assert.ok(!page.includes('data-enquiry-form'));
  assert.ok(!readFileSync(join(withFuture.outDir, 'sitemap.xml'), 'utf8').includes('/future/'));
});

test('strict production build refuses to publish unverified content', () => {
  assert.throws(() => build({ ...base, env: 'production', strict: true }, out()), UnverifiedContentError);
});

test('production output hides proposed services, unapproved articles and preview tools', () => {
  const prod = build({ ...base, env: 'production', strict: false }, out());
  const dir = prod.outDir;
  assert.ok(!existsSync(join(dir, 'services/talking-therapy')), 'proposed service hidden');
  assert.ok(!existsSync(join(dir, 'resources/choosing-a-therapist')), 'unapproved article hidden');
  assert.ok(!existsSync(join(dir, 'styleguide')) && !existsSync(join(dir, '_verification')));
  const home = readFileSync(join(dir, 'index.html'), 'utf8');
  assert.ok(!home.includes('Preview build'));
  assert.ok(!home.includes('href="/services/talking-therapy/"'));
  assert.match(home, /index, follow/);
  assert.match(readFileSync(join(dir, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/seeksense\.co\/sitemap\.xml/);
});

test('structured data never contains placeholder values', () => {
  for (const file of htmlFiles(preview.outDir)) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const json = m[1]!.trim();
      JSON.parse(json);
      assert.ok(
        !/\[[A-Z][^\]]*\]|00000000|Z0000000|hello@seeksense/.test(json),
        `${relative(preview.outDir, file)}: ${json}`,
      );
    }
  }
});
