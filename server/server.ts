// Minimal production server: serves the static build and handles enquiries.
// No dependencies. Run behind HTTPS (a platform load balancer or reverse proxy).
//
//   node server/server.ts            (serves ./dist on PORT, default 8080)

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECURITY_HEADERS } from './security.ts';
import { validateEnquiry } from './validation.ts';
import { mailerFromEnv, type Mailer } from './mailer.ts';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon',
};

const MAX_BODY_BYTES = 16 * 1024;

export interface ServerOptions {
  root: string;
  mailer: Mailer | null;
  trustProxy?: boolean;
  /** Requests allowed per IP per window on the enquiry endpoint. */
  rateLimit?: { max: number; windowMs: number };
  log?: (line: string) => void;
}

/** Fixed-window in-memory rate limiter. Stores only a hash-free IP key and a count, briefly. */
export class RateLimiter {
  private readonly hits = new Map<string, { count: number; reset: number }>();
  private readonly max: number;
  private readonly windowMs: number;
  constructor(max: number, windowMs: number) {
    this.max = max;
    this.windowMs = windowMs;
  }
  allow(key: string, now = Date.now()): boolean {
    const entry = this.hits.get(key);
    if (!entry || entry.reset <= now) {
      this.hits.set(key, { count: 1, reset: now + this.windowMs });
      this.sweep(now);
      return true;
    }
    entry.count += 1;
    return entry.count <= this.max;
  }
  private sweep(now: number): void {
    if (this.hits.size < 5000) return;
    for (const [k, v] of this.hits) if (v.reset <= now) this.hits.delete(k);
  }
}

function clientIp(req: IncomingMessage, trustProxy: boolean): string {
  if (trustProxy) {
    const fwd = req.headers['x-forwarded-for'];
    const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.socket.remoteAddress ?? 'unknown';
}

function setSecurityHeaders(res: ServerResponse): void {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
}

function sendJson(res: ServerResponse, status: number, body: object): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function redirect(res: ServerResponse, location: string): void {
  res.statusCode = 303;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new RangeError('Body too large');
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function parseBody(contentType: string, raw: string): Record<string, unknown> {
  if (contentType.startsWith('application/json')) {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
      throw new SyntaxError('Expected object');
    return parsed as Record<string, unknown>;
  }
  if (contentType.startsWith('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  throw new TypeError('Unsupported content type');
}

/** Same-origin check: browsers send Origin on POST; reject cross-site posts. */
function sameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin) return true; // non-browser clients; still rate limited and validated
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function handleEnquiry(req: IncomingMessage, res: ServerResponse, opts: ServerOptions, limiter: RateLimiter) {
  const wantsJson = (req.headers.accept ?? '').includes('application/json');
  const fail = (status: number, body: object, page: string) =>
    wantsJson ? sendJson(res, status, body) : redirect(res, page);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { ok: false });
  }
  if (!sameOrigin(req)) return sendJson(res, 403, { ok: false });
  if (!limiter.allow(clientIp(req, Boolean(opts.trustProxy)))) {
    res.setHeader('Retry-After', '600');
    return fail(429, { ok: false, reason: 'rate_limited' }, '/contact/unavailable/');
  }
  if (!opts.mailer) return fail(503, { ok: false, reason: 'unavailable' }, '/contact/unavailable/');

  let input: Record<string, unknown>;
  try {
    input = parseBody(String(req.headers['content-type'] ?? ''), await readBody(req));
  } catch (err) {
    const status = err instanceof RangeError ? 413 : err instanceof TypeError ? 415 : 400;
    return fail(status, { ok: false }, '/contact/problem/');
  }

  const result = validateEnquiry(input);
  if (result.spam) {
    // Pretend success so automated senders learn nothing. Nothing is sent or stored.
    opts.log?.('enquiry: discarded (spam checks)');
    return wantsJson ? sendJson(res, 200, { ok: true }) : redirect(res, '/contact/received/');
  }
  if (!result.ok) return fail(400, { ok: false, errors: result.errors }, '/contact/problem/');

  try {
    await opts.mailer.send(result.enquiry);
  } catch (err) {
    // Log the failure only, never the enquiry content.
    opts.log?.(`enquiry: delivery failed (${err instanceof Error ? err.message : 'unknown error'})`);
    return fail(503, { ok: false, reason: 'delivery_failed' }, '/contact/unavailable/');
  }
  opts.log?.('enquiry: delivered');
  return wantsJson ? sendJson(res, 200, { ok: true }) : redirect(res, '/contact/received/');
}

function serveStatic(req: IncomingMessage, res: ServerResponse, root: string): void {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    return void res.end();
  }
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    res.statusCode = 400;
    return void res.end();
  }
  if (pathname.includes('\0')) {
    res.statusCode = 400;
    return void res.end();
  }
  const rootAbs = resolve(root);
  let file = resolve(join(rootAbs, normalize(pathname)));
  if (file !== rootAbs && !file.startsWith(rootAbs + sep)) {
    res.statusCode = 403;
    return void res.end();
  }
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!pathname.endsWith('/')) return redirect(res, `${pathname}/`);
    file = join(file, 'index.html');
  }
  const base = file.slice(rootAbs.length);
  const hidden =
    base.split(sep).some((part) => part.startsWith('.')) || base === `${sep}_headers` || base === `${sep}build.json`;
  if (hidden || !existsSync(file) || !statSync(file).isFile()) {
    const notFound = join(rootAbs, '404.html');
    res.statusCode = 404;
    res.setHeader('Content-Type', MIME['.html'] as string);
    return void res.end(existsSync(notFound) ? readFileSync(notFound) : 'Not found');
  }
  const ext = extname(file);
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
  const versioned = /[?&]v=/.test(req.url ?? '');
  res.setHeader(
    'Cache-Control',
    ext === '.html'
      ? 'no-cache'
      : versioned || file.includes(`${sep}fonts${sep}`)
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600',
  );
  if (req.method === 'HEAD') return void res.end();
  createReadStream(file).pipe(res);
}

export function createAppServer(opts: ServerOptions): Server {
  const limiter = new RateLimiter(opts.rateLimit?.max ?? 5, opts.rateLimit?.windowMs ?? 10 * 60 * 1000);
  return createServer((req, res) => {
    setSecurityHeaders(res);
    const path = (req.url ?? '/').split('?')[0] ?? '/';
    if (path === '/api/enquiry') {
      handleEnquiry(req, res, opts, limiter).catch(() => {
        if (!res.headersSent) sendJson(res, 500, { ok: false });
      });
      return;
    }
    if (path === '/healthz') return sendJson(res, 200, { ok: true });
    serveStatic(req, res, opts.root);
  });
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = resolve(process.env.SITE_ROOT ?? fileURLToPath(new URL('../dist', import.meta.url)));
  if (!existsSync(join(root, 'index.html'))) {
    console.error(`No build found in ${root}. Run "npm run build" first.`);
    process.exit(1);
  }
  const mailer = mailerFromEnv();
  const port = Number(process.env.PORT ?? 8080);
  const log = (line: string) => console.log(`${new Date().toISOString()} ${line}`);
  createAppServer({ root, mailer, trustProxy: process.env.TRUST_PROXY === 'true', log }).listen(port, () => {
    log(`SeekSense listening on http://localhost:${port} (enquiries: ${mailer ? mailer.name : 'disabled'})`);
  });
}
