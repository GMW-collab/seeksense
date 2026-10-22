import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, plainText } from '../src/lib/markdown.ts';
import { register } from '../src/lib/verify.ts';
import { escapeHtml, html } from '../src/lib/html.ts';
import { loadArticles, loadServices } from '../src/lib/content.ts';

test('html template escapes interpolated values', () => {
  const evil = '<img src=x onerror=alert(1)>';
  assert.equal(html`<p>${evil}</p>`.value, `<p>${escapeHtml(evil)}</p>`);
});

test('markdown escapes raw HTML and strips javascript: links', () => {
  const out = renderMarkdown('<script>alert(1)</script>\n\n[x](javascript:alert(1))');
  assert.ok(!out.includes('<script>'));
  assert.ok(!out.includes('javascript:'));
});

test('external links get rel=noopener and a screen-reader note', () => {
  const out = renderMarkdown('[NHS](https://www.nhs.uk/)');
  assert.match(out, /rel="noopener noreferrer"/);
  assert.match(out, /external site/);
});

test('verify markers render as marked placeholders and are registered', () => {
  register.reset();
  register.setPage('/t/');
  const out = renderMarkdown('Fee: [[verify: Session fee | £[amount] per session]].');
  assert.match(out, /<mark class="verify"[^>]*>£\[amount\] per session/);
  assert.equal(register.summary()[0]?.label, 'Session fee');
  assert.equal(plainText('Fee: [[verify: Session fee | £[amount]]]'), 'Fee: £[amount]');
});

test('content files load and validate', () => {
  const services = loadServices();
  const articles = loadArticles();
  assert.ok(services.length >= 5);
  assert.ok(articles.length >= 5);
  const slugs = new Set(articles.map((a) => a.slug));
  for (const a of articles) {
    for (const r of a.related) assert.ok(slugs.has(r), `${a.slug} relates to missing ${r}`);
    for (const ref of a.references) assert.match(ref.url, /^https:\/\//);
  }
});

test('no service is marked live while it contains unverified facts', () => {
  for (const s of loadServices()) {
    if (s.status !== 'live') continue;
    const text = JSON.stringify(s.atAGlance) + s.bodyMarkdown + s.notProvided.join();
    assert.ok(!text.includes('[[verify'), `${s.slug} is live but has unverified content`);
  }
});

test('copy avoids prohibited wellness cliches and outcome promises', () => {
  const banned = [
    /unlock your potential/i,
    /best self/i,
    /guarantee/i,
    /cure[sd]?\b/i,
    /proven to/i,
    /evidence-based/i,
  ];
  const all = [
    ...loadServices().map((s) => s.bodyMarkdown + s.summary),
    ...loadArticles().map((a) => a.bodyMarkdown + a.summary),
  ];
  for (const text of all) for (const re of banned) assert.ok(!re.test(text), `found ${re}`);
});
