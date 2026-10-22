import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnquiry, MIN_FILL_MS } from '../server/validation.ts';

const good = {
  name: 'Alex Morgan',
  email: 'Alex@Example.org',
  phone: '',
  interest: 'therapy',
  message: 'Weekday evenings suit me.',
  consent: 'yes',
  website: '',
  started: '',
};

test('accepts a valid enquiry and normalises email', () => {
  const r = validateEnquiry(good);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.enquiry.email, 'alex@example.org');
});

test('requires name, email, interest and consent', () => {
  const r = validateEnquiry({});
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ['consent', 'email', 'interest', 'name']);
});

test('rejects malformed email and unknown interest', () => {
  const r = validateEnquiry({ ...good, email: 'not-an-email', interest: 'psychedelics' });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.ok(r.errors.email);
    assert.ok(r.errors.interest);
  }
});

test('rejects header-injection and markup characters in name', () => {
  for (const name of ['Alex\r\nBcc: x@y.z', 'Alex <script>']) {
    const r = validateEnquiry({ ...good, name });
    assert.equal(r.ok, false, name);
  }
});

test('enforces message length limit', () => {
  const r = validateEnquiry({ ...good, message: 'x'.repeat(1001) });
  assert.equal(r.ok, false);
});

test('validates optional phone format', () => {
  assert.equal(validateEnquiry({ ...good, phone: '+44 20 7946 0000' }).ok, true);
  assert.equal(validateEnquiry({ ...good, phone: 'call me' }).ok, false);
});

test('flags honeypot and too-fast submissions as spam', () => {
  assert.equal(validateEnquiry({ ...good, website: 'http://spam' }).spam, true);
  const now = 1_000_000;
  assert.equal(validateEnquiry({ ...good, started: String(now - 500) }, now).spam, true);
  assert.equal(validateEnquiry({ ...good, started: String(now - MIN_FILL_MS - 1) }, now).ok, true);
});

test('consent must be explicit', () => {
  assert.equal(validateEnquiry({ ...good, consent: 'on' }).ok, false);
  assert.equal(validateEnquiry({ ...good, consent: true }).ok, true);
});
