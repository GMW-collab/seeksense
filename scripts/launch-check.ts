// Pre-launch gate: attempts a strict production build in a temporary folder
// and lists everything that still needs confirming, grouped by who owns it.
// Exit code 0 means the site can be built for production.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, UnverifiedContentError } from '../src/build.ts';
import { readSettings } from '../src/config/env.ts';

const dir = mkdtempSync(join(tmpdir(), 'seeksense-launch-'));
const settings = { ...readSettings(), env: 'production' as const, strict: true };
try {
  const result = build(settings, dir);
  const live = result.pages.filter((p) => p.path.startsWith('/services/') && p.path !== '/services/').length;
  console.log(`Launch check passed: ${result.pages.length} pages, ${live} live service page(s).`);
  if (live === 0) console.log('Note: no services are marked "status: live" yet, so none will be listed.');
} catch (err) {
  if (!(err instanceof UnverifiedContentError)) throw err;
  const byOwner = new Map<string, string[]>();
  for (const i of err.items) byOwner.set(i.owner, [...(byOwner.get(i.owner) ?? []), i.label]);
  console.log(`Launch check: ${err.items.length} item(s) must be confirmed before a production build.\n`);
  for (const [owner, labels] of byOwner) {
    console.log(`${owner.toUpperCase()} (${labels.length})`);
    for (const l of labels) console.log(`  - ${l}`);
    console.log('');
  }
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
