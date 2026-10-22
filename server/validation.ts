// Enquiry validation shared by the server (authoritative) and the page
// templates (field limits and options). Keep this file free of Node-only APIs.

export const LIMITS = {
  name: 100,
  email: 254,
  phone: 30,
  message: 1000,
} as const;

export const ENQUIRY_INTERESTS = [
  { value: 'initial-consultation', label: 'An initial consultation' },
  { value: 'therapy', label: 'Talking therapy' },
  { value: 'assessment', label: 'An assessment' },
  { value: 'signposting', label: 'Help finding the right support' },
  { value: 'other', label: 'Something else' },
] as const;

export type Interest = (typeof ENQUIRY_INTERESTS)[number]['value'];

export interface Enquiry {
  name: string;
  email: string;
  phone: string;
  interest: Interest;
  message: string;
}

export type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'interest' | 'message' | 'consent', string>>;

export type ValidationResult =
  | { ok: true; enquiry: Enquiry; spam: false }
  | { ok: false; errors: FieldErrors; spam: false }
  | { ok: false; errors: FieldErrors; spam: true };

/** Minimum time (ms) between page load and submission for a human. */
export const MIN_FILL_MS = 2500;

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE = /^[+()0-9\s-]{7,30}$/;
// Characters that have no place in these fields and can enable header or markup injection.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFC')
    .trim()
    .slice(0, max * 2);
}

export function validateEnquiry(input: Record<string, unknown>, now = Date.now()): ValidationResult {
  // Honeypot and timing checks: treat as spam, but respond as if successful
  // so automated senders learn nothing.
  const honeypot = clean(input.website, 200);
  const started = Number(input.started);
  if (honeypot !== '') return { ok: false, errors: {}, spam: true };
  if (Number.isFinite(started) && started > 0 && now - started < MIN_FILL_MS)
    return { ok: false, errors: {}, spam: true };

  const errors: FieldErrors = {};
  const name = clean(input.name, LIMITS.name);
  const email = clean(input.email, LIMITS.email).toLowerCase();
  const phone = clean(input.phone, LIMITS.phone);
  const interest = clean(input.interest, 40);
  const message = clean(input.message, LIMITS.message);
  const consent = input.consent === 'yes' || input.consent === true;

  if (!name) errors.name = 'Enter your name';
  else if (name.length > LIMITS.name) errors.name = `Name must be ${LIMITS.name} characters or fewer`;
  else if (CONTROL.test(name) || /[\r\n<>]/.test(name)) errors.name = 'Name contains characters we cannot accept';

  if (!email) errors.email = 'Enter your email address';
  else if (email.length > LIMITS.email || !EMAIL.test(email) || CONTROL.test(email))
    errors.email = 'Enter an email address in the correct format, like name@example.com';

  if (phone && !PHONE.test(phone)) errors.phone = 'Enter a phone number using digits, spaces and + only';

  if (!ENQUIRY_INTERESTS.some((i) => i.value === interest)) errors.interest = 'Choose what you are interested in';

  if (message.length > LIMITS.message) errors.message = `Message must be ${LIMITS.message} characters or fewer`;
  else if (CONTROL.test(message.replace(/[\r\n\t]/g, '')))
    errors.message = 'Message contains characters we cannot accept';

  if (!consent) errors.consent = 'Confirm you have read the privacy notice';

  if (Object.keys(errors).length > 0) return { ok: false, errors, spam: false };
  return { ok: true, spam: false, enquiry: { name, email, phone, interest: interest as Interest, message } };
}
