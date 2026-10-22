import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleEnquiry, mailerFromBindings } from '../functions/api/enquiry.ts';
import { RateLimiter } from '../server/rate-limit.ts';
import type { Enquiry } from '../server/validation.ts';

const URL_ = 'https://seeksense.pages.dev/api/enquiry';
const valid = {
  name: 'Sam Patel',
  email: 'sam@example.org',
  interest: 'therapy',
  message: 'PRIVATE-MARKER',
  consent: 'yes',
  website: '',
  started: String(Date.now() - 10_000),
};

function req(body: object | string, headers: Record<string, string> = {}, method = 'POST') {
  const isString = typeof body === 'string';
  return new Request(URL_, {
    method,
    headers: {
      'Content-Type': isString ? 'application/x-www-form-urlencoded' : 'application/json',
      Accept: isString ? 'text/html' : 'application/json',
      'CF-Connecting-IP': '203.0.113.9',
      ...headers,
    },
    body: method === 'POST' ? (isString ? body : JSON.stringify(body)) : undefined,
  });
}

function deps(sent: Enquiry[] = [], logs: string[] = []) {
  return {
    mailer: { name: 't', send: async (e: Enquiry) => void sent.push(e) },
    limiter: new RateLimiter(50, 60_000),
    log: (l: string) => logs.push(l),
  };
}

test('delivers a valid enquiry with security headers and no content in logs', async () => {
  const sent: Enquiry[] = [];
  const logs: string[] = [];
  const res = await handleEnquiry({ request: req(valid), env: {} }, deps(sent, logs));
  assert.equal(res.status, 200);
  assert.equal(sent.length, 1);
  assert.match(res.headers.get('Content-Security-Policy') ?? '', /default-src 'self'/);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.ok(!logs.join().includes('PRIVATE-MARKER') && !logs.join().includes('sam@'));
});

test('no-JavaScript posts redirect to absolute status URLs', async () => {
  const ok = await handleEnquiry(
    { request: req(new URLSearchParams({ ...valid, started: '' }).toString()), env: {} },
    deps(),
  );
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get('Location'), 'https://seeksense.pages.dev/contact/received/');
  const bad = await handleEnquiry({ request: req('name='), env: {} }, deps());
  assert.equal(bad.headers.get('Location'), 'https://seeksense.pages.dev/contact/problem/');
});

test('validation errors, cross-origin, oversized and wrong method are rejected', async () => {
  const d = deps();
  assert.equal((await handleEnquiry({ request: req({ ...valid, email: 'x' }), env: {} }, d)).status, 400);
  assert.equal(
    (await handleEnquiry({ request: req(valid, { Origin: 'https://evil.example' }), env: {} }, d)).status,
    403,
  );
  assert.equal(
    (await handleEnquiry({ request: req({ ...valid, message: 'x'.repeat(20_000) }), env: {} }, d)).status,
    413,
  );
  assert.equal((await handleEnquiry({ request: req({}, {}, 'GET'), env: {} }, d)).status, 405);
});

test('honeypot is silently discarded', async () => {
  const sent: Enquiry[] = [];
  const res = await handleEnquiry({ request: req({ ...valid, website: 'x' }), env: {} }, deps(sent));
  assert.equal(res.status, 200);
  assert.equal(sent.length, 0);
});

test('rate limits by connecting IP', async () => {
  const d = { ...deps(), limiter: new RateLimiter(1, 60_000) };
  await handleEnquiry({ request: req(valid), env: {} }, d);
  assert.equal((await handleEnquiry({ request: req(valid), env: {} }, d)).status, 429);
});

test('without mail bindings the endpoint reports unavailable', async () => {
  assert.equal(mailerFromBindings({}), null);
  assert.equal(mailerFromBindings({ MAIL_PROVIDER: 'postmark' }), null);
  assert.ok(
    mailerFromBindings({
      MAIL_PROVIDER: 'postmark',
      POSTMARK_SERVER_TOKEN: 't',
      ENQUIRY_FROM: 'a@b.co',
      ENQUIRY_TO: 'c@d.co',
    }),
  );
  const res = await handleEnquiry(
    { request: req(valid), env: {} },
    { limiter: new RateLimiter(5, 60_000), log: () => {} },
  );
  assert.equal(res.status, 503);
});
