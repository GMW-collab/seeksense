import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { build } from '../src/build.ts';
import { createAppServer } from '../server/server.ts';
import { formatEnquiry, PostmarkMailer, type Mailer } from '../server/mailer.ts';
import type { Enquiry } from '../server/validation.ts';

const dir = build(
  { env: 'preview', siteUrl: 'https://seeksense.co', publishFutureSection: false, bookingUrl: null, strict: false },
  mkdtempSync(join(tmpdir(), 'seeksense-srv-')),
).outDir;

const sent: Enquiry[] = [];
const logs: string[] = [];
const mailer: Mailer = { name: 'test', send: async (e) => void sent.push(e) };

async function start(m: Mailer | null, max = 50) {
  const server = createAppServer({
    root: dir,
    mailer: m,
    rateLimit: { max, windowMs: 60_000 },
    log: (l) => logs.push(l),
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  after(() => server.close());
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

const valid = {
  name: 'Sam Patel',
  email: 'sam@example.org',
  interest: 'initial-consultation',
  message: 'Tuesdays are best. SECRET-MARKER',
  consent: 'yes',
  website: '',
  started: String(Date.now() - 10_000),
};

const post = (url: string, body: object, headers: Record<string, string> = {}) =>
  fetch(`${url}/api/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(body),
    redirect: 'manual',
  });

test('serves pages with security headers', async () => {
  const url = await start(mailer);
  const res = await fetch(`${url}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-security-policy') ?? '', /default-src 'self'/);
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(res.headers.get('strict-transport-security'));
});

test('returns the custom 404 page and blocks traversal and hidden files', async () => {
  const url = await start(mailer);
  const missing = await fetch(`${url}/no-such-page/`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /could not find that page/);
  for (const p of ['/..%2f..%2fetc/passwd', '/%2e%2e/package.json', '/_headers', '/build.json']) {
    const res = await fetch(`${url}${p}`);
    assert.ok([403, 404, 400].includes(res.status), `${p} -> ${res.status}`);
  }
});

test('accepts a valid enquiry without logging its content', async () => {
  const url = await start(mailer);
  const res = await post(url, valid);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(sent.at(-1)?.email, 'sam@example.org');
  assert.ok(!logs.join('\n').includes('SECRET-MARKER'));
  assert.ok(!logs.join('\n').includes('sam@example.org'));
});

test('returns field errors for invalid input', async () => {
  const url = await start(mailer);
  const res = await post(url, { ...valid, email: 'nope', consent: '' });
  assert.equal(res.status, 400);
  const body = (await res.json()) as { errors: Record<string, string> };
  assert.ok(body.errors.email && body.errors.consent);
});

test('silently discards honeypot submissions', async () => {
  const url = await start(mailer);
  const before = sent.length;
  const res = await post(url, { ...valid, website: 'spam' });
  assert.equal(res.status, 200);
  assert.equal(sent.length, before);
});

test('without JavaScript, form posts redirect to status pages', async () => {
  const url = await start(mailer);
  const ok = await fetch(`${url}/api/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...valid, started: '' }).toString(),
    redirect: 'manual',
  });
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get('location'), '/contact/received/');
  const bad = await fetch(`${url}/api/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'name=',
    redirect: 'manual',
  });
  assert.equal(bad.headers.get('location'), '/contact/problem/');
});

test('rejects cross-origin posts, oversized bodies and bad content types', async () => {
  const url = await start(mailer);
  assert.equal((await post(url, valid, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await post(url, { ...valid, message: 'x'.repeat(20_000) })).status, 413);
  const res = await fetch(`${url}/api/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain', Accept: 'application/json' },
    body: 'hello',
  });
  assert.equal(res.status, 415);
  assert.equal((await fetch(`${url}/api/enquiry`)).status, 405);
});

test('rate limits repeated submissions', async () => {
  const url = await start(mailer, 2);
  await post(url, valid);
  await post(url, valid);
  assert.equal((await post(url, valid)).status, 429);
});

test('reports unavailable when no mail provider is configured', async () => {
  const url = await start(null);
  assert.equal((await post(url, valid)).status, 503);
});

test('mail delivery failure does not leak details', async () => {
  const failing: Mailer = {
    name: 'failing',
    send: async () => {
      throw new Error('provider down');
    },
  };
  const url = await start(failing);
  const res = await post(url, valid);
  assert.equal(res.status, 503);
  assert.ok(!JSON.stringify(await res.json()).includes('provider'));
});

test('email subject contains no personal or health details', () => {
  const { subject, text } = formatEnquiry({
    name: 'A',
    email: 'a@b.co',
    phone: '',
    interest: 'assessment',
    message: 'm',
  });
  assert.equal(subject, 'New website enquiry');
  assert.match(text, /Interested in: An assessment/);
});

test('Postmark mailer sends the expected request without tracking', async () => {
  let captured: { url: string; init: RequestInit } | null = null;
  const fake = (async (u: string, init: RequestInit) => {
    captured = { url: u, init };
    return new Response('{}', { status: 200 });
  }) as unknown as typeof fetch;
  await new PostmarkMailer({ token: 't', from: 'f@x.co', to: 't@x.co', fetchImpl: fake }).send({
    name: 'A',
    email: 'a@b.co',
    phone: '',
    interest: 'other',
    message: '',
  });
  assert.ok(captured);
  const c = captured as { url: string; init: RequestInit };
  assert.equal(c.url, 'https://api.postmarkapp.com/email');
  const body = JSON.parse(String(c.init.body)) as Record<string, unknown>;
  assert.equal(body.TrackOpens, false);
  assert.equal(body.ReplyTo, 'a@b.co');
});
