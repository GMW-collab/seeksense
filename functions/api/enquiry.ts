// Cloudflare Pages Function: POST /api/enquiry
// The same behaviour as server/server.ts, for hosting on Cloudflare Pages.
// Configure in the Pages project settings (as encrypted variables):
//   MAIL_PROVIDER=postmark, POSTMARK_SERVER_TOKEN, ENQUIRY_FROM, ENQUIRY_TO
// With no provider configured, enquiries are refused with 503 and visitors are
// shown the email fallback. Enquiry content is never logged.

import { validateEnquiry } from '../../server/validation.ts';
import { PostmarkMailer, type Mailer } from '../../server/mailer.ts';
import { RateLimiter } from '../../server/rate-limit.ts';
import { SECURITY_HEADERS } from '../../server/security.ts';

export interface Env {
  MAIL_PROVIDER?: string;
  POSTMARK_SERVER_TOKEN?: string;
  ENQUIRY_FROM?: string;
  ENQUIRY_TO?: string;
}

/** The subset of the Pages Function context this handler uses. */
export interface PagesContext {
  request: Request;
  env: Env;
}

const MAX_BODY_BYTES = 16 * 1024;
// Per isolate only. Pair with a Cloudflare WAF rate-limiting rule on /api/enquiry.
const limiter = new RateLimiter(5, 10 * 60 * 1000);

export function mailerFromBindings(env: Env): Mailer | null {
  const provider = (env.MAIL_PROVIDER ?? '').trim().toLowerCase();
  if (provider !== 'postmark') return null;
  if (!env.POSTMARK_SERVER_TOKEN || !env.ENQUIRY_FROM || !env.ENQUIRY_TO) return null;
  return new PostmarkMailer({ token: env.POSTMARK_SERVER_TOKEN, from: env.ENQUIRY_FROM, to: env.ENQUIRY_TO });
}

function headers(extra: Record<string, string> = {}): Headers {
  return new Headers({ ...SECURITY_HEADERS, 'Cache-Control': 'no-store', ...extra });
}

function json(status: number, body: object, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: headers({ 'Content-Type': 'application/json; charset=utf-8', ...extra }),
  });
}

function redirect(request: Request, path: string): Response {
  return new Response(null, { status: 303, headers: headers({ Location: new URL(path, request.url).toString() }) });
}

async function readBody(request: Request): Promise<string> {
  const declared = Number(request.headers.get('Content-Length') ?? '0');
  if (declared > MAX_BODY_BYTES) throw new RangeError('Body too large');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) throw new RangeError('Body too large');
  return text;
}

function parse(contentType: string, raw: string): Record<string, unknown> {
  if (contentType.startsWith('application/json')) {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
      throw new SyntaxError('Expected object');
    return parsed as Record<string, unknown>;
  }
  if (contentType.startsWith('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
  throw new TypeError('Unsupported content type');
}

export async function handleEnquiry(
  { request, env }: PagesContext,
  deps: { mailer?: Mailer | null; limiter?: RateLimiter; log?: (line: string) => void } = {},
): Promise<Response> {
  const log = deps.log ?? ((line: string) => console.log(line));
  const wantsJson = (request.headers.get('Accept') ?? '').includes('application/json');
  const fail = (status: number, body: object, page: string, extra?: Record<string, string>) =>
    wantsJson ? json(status, body, extra) : redirect(request, page);

  if (request.method !== 'POST') return json(405, { ok: false }, { Allow: 'POST' });

  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json(403, { ok: false });

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!(deps.limiter ?? limiter).allow(ip)) {
    return fail(429, { ok: false, reason: 'rate_limited' }, '/contact/unavailable/', { 'Retry-After': '600' });
  }

  const mailer = deps.mailer === undefined ? mailerFromBindings(env) : deps.mailer;
  if (!mailer) return fail(503, { ok: false, reason: 'unavailable' }, '/contact/unavailable/');

  let input: Record<string, unknown>;
  try {
    input = parse(request.headers.get('Content-Type') ?? '', await readBody(request));
  } catch (err) {
    const status = err instanceof RangeError ? 413 : err instanceof TypeError ? 415 : 400;
    return fail(status, { ok: false }, '/contact/problem/');
  }

  const result = validateEnquiry(input);
  if (result.spam) {
    log('enquiry: discarded (spam checks)');
    return wantsJson ? json(200, { ok: true }) : redirect(request, '/contact/received/');
  }
  if (!result.ok) return fail(400, { ok: false, errors: result.errors }, '/contact/problem/');

  try {
    await mailer.send(result.enquiry);
  } catch (err) {
    log(`enquiry: delivery failed (${err instanceof Error ? err.message : 'unknown error'})`);
    return fail(503, { ok: false, reason: 'delivery_failed' }, '/contact/unavailable/');
  }
  log('enquiry: delivered');
  return wantsJson ? json(200, { ok: true }) : redirect(request, '/contact/received/');
}

export const onRequest = (context: PagesContext): Promise<Response> => handleEnquiry(context);
