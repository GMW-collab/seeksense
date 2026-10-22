// Fixed-window in-memory rate limiter, shared by the Node server and the
// Cloudflare Pages Function. In Workers, memory is per isolate, so this is a
// first line of defence only; add a Cloudflare WAF rate-limiting rule too.

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
