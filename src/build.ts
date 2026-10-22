// Static site build. Usage: node src/build.ts  (SITE_ENV=production for a launch build)

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSettings, type BuildSettings } from './config/env.ts';
import { loadArticles, loadServices } from './lib/content.ts';
import { createContext } from './lib/context.ts';
import { register } from './lib/verify.ts';
import { headersFile } from '../server/security.ts';
import type { Page } from './pages/types.ts';
import { homePage } from './pages/home.ts';
import { approachPage } from './pages/approach.ts';
import { servicePage, servicesIndexPage } from './pages/services.ts';
import { aboutPage } from './pages/about.ts';
import { articlePage, resourcesIndexPage, themePages } from './pages/resources.ts';
import { findSupportPage } from './pages/find-support.ts';
import { contactPage, contactStatusPages } from './pages/contact.ts';
import { urgentHelpPage } from './pages/urgent-help.ts';
import { policyPages } from './pages/policies.ts';
import { futurePage } from './pages/future.ts';
import { notFoundPage, styleguidePage, verificationPage } from './pages/utility.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

export interface BuildResult {
  outDir: string;
  pages: Array<{ path: string; file: string; inSitemap: boolean }>;
  pending: ReturnType<typeof register.summary>;
}

export class UnverifiedContentError extends Error {
  readonly items: ReturnType<typeof register.summary>;
  constructor(items: ReturnType<typeof register.summary>) {
    super(
      `Production build blocked: ${items.length} unverified item(s).\n` +
        items.map((i) => `  - [${i.owner}] ${i.label}  (${i.pages.join(', ')})`).join('\n') +
        '\nConfirm each item in src/config/site.ts or the content files, then rebuild.',
    );
    this.items = items;
  }
}

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function hash(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 10);
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function outputFile(outDir: string, path: string): string {
  return path.endsWith('/') ? join(outDir, path, 'index.html') : join(outDir, path);
}

export function build(settings: BuildSettings, outDir = join(ROOT, 'dist')): BuildResult {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // Static assets
  cpSync(join(ROOT, 'public'), outDir, { recursive: true });
  const css = minifyCss(readFileSync(join(ROOT, 'src/styles/main.css'), 'utf8'));
  mkdirSync(join(outDir, 'css'), { recursive: true });
  writeFileSync(join(outDir, 'css/main.css'), css);

  const hashes = new Map<string, string>();
  for (const file of walk(outDir)) {
    const rel = `/${relative(outDir, file).split('\\').join('/')}`;
    if (/\.(css|js)$/.test(rel)) hashes.set(rel, hash(readFileSync(file)));
  }

  const services = loadServices();
  const articles = loadArticles();
  const ctx = createContext(settings, services, articles, hashes);
  const isProd = settings.env === 'production';

  const pages: Page[] = [
    homePage,
    approachPage,
    servicesIndexPage,
    ...ctx.publishedServices().map(servicePage),
    aboutPage,
    resourcesIndexPage,
    ...themePages(ctx),
    ...ctx.publishedArticles().map(articlePage),
    findSupportPage,
    contactPage,
    ...contactStatusPages,
    urgentHelpPage,
    ...policyPages,
    notFoundPage,
    ...(settings.publishFutureSection ? [futurePage] : []),
    ...(isProd ? [] : [styleguidePage]),
  ];

  const seen = new Set<string>();
  const written: BuildResult['pages'] = [];
  const renderPage = (page: Page) => {
    if (seen.has(page.path)) throw new Error(`Duplicate page path ${page.path}`);
    seen.add(page.path);
    register.setPage(page.path);
    const htmlOut = page.render(ctx);
    const file = outputFile(outDir, page.path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, htmlOut);
    written.push({ path: page.path, file, inSitemap: !page.excludeFromSitemap });
  };

  register.reset();
  pages.forEach(renderPage);
  const pending = register.summary();

  if (settings.strict && pending.length > 0) {
    rmSync(outDir, { recursive: true, force: true });
    throw new UnverifiedContentError(pending);
  }
  if (!isProd) renderPage(verificationPage);

  // Sitemap and robots
  const urls = written.filter((p) => p.inSitemap).map((p) => `  <url><loc>${ctx.url(p.path)}</loc></url>`);
  writeFileSync(
    join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
  );
  writeFileSync(
    join(outDir, 'robots.txt'),
    isProd
      ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${ctx.url('/sitemap.xml')}\n`
      : '# Preview build: not for indexing\nUser-agent: *\nDisallow: /\n',
  );
  writeFileSync(join(outDir, '_headers'), headersFile());
  writeFileSync(
    join(outDir, 'build.json'),
    JSON.stringify(
      { env: settings.env, builtAt: new Date().toISOString(), pages: written.length, pending: pending.length },
      null,
      2,
    ),
  );

  return { outDir, pages: written, pending };
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const settings = readSettings();
  try {
    const result = build(settings);
    const label = settings.env === 'production' ? 'production' : 'preview';
    console.log(`Built ${result.pages.length} pages (${label}) into ${relative(process.cwd(), result.outDir) || '.'}`);
    if (result.pending.length) {
      console.log(
        `${result.pending.length} item(s) still need confirming before launch. See /_verification/ in the preview.`,
      );
    }
    if (!existsSync(join(result.outDir, 'index.html'))) throw new Error('Home page missing from build');
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
