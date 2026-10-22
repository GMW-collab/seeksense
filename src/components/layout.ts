import { html, raw, type Renderable, type SafeHtml } from '../lib/html.ts';
import { site, urgentHelp } from '../config/site.ts';
import { fact, factText } from '../lib/verify.ts';
import type { BuildContext } from '../lib/context.ts';

export interface PageMeta {
  /** Path beginning and ending with "/" (or a file like "/404.html"). */
  path: string;
  title: string;
  description: string;
  /** Section for navigation highlighting. */
  section?: NavKey;
  noindex?: boolean;
  ogType?: 'website' | 'article';
  jsonLd?: object[];
  /** Extra scripts (paths under /js/) this page needs. */
  scripts?: string[];
  /** Omit the reassurance strip (used on the urgent help page itself). */
  hideUrgentStrip?: boolean;
}

export type NavKey = 'approach' | 'services' | 'find-support' | 'resources' | 'about' | 'contact';

export const NAV: Array<{ key: NavKey; label: string; href: string }> = [
  { key: 'approach', label: 'Our approach', href: '/approach/' },
  { key: 'services', label: 'Services', href: '/services/' },
  { key: 'find-support', label: 'Find support', href: '/find-support/' },
  { key: 'resources', label: 'Resources', href: '/resources/' },
  { key: 'about', label: 'About', href: '/about/' },
  { key: 'contact', label: 'Contact', href: '/contact/' },
];

/** The Seek Sense logo exactly as supplied (trade mark UK00003372433 artwork). */
export const logo = (opts: { eager?: boolean } = {}) =>
  html`<img
    class="logo"
    src="/brand/seeksense-logo-transparent.png"
    alt="${site.name}"
    width="573"
    height="99"
    ${opts.eager ? raw('fetchpriority="high"') : raw('loading="lazy"')}
  />`;

function head(ctx: BuildContext, meta: PageMeta): SafeHtml {
  const url = ctx.url(meta.path);
  const fullTitle = meta.path === '/' ? `${site.name}: ${meta.title}` : `${meta.title} | ${site.name}`;
  const robots = meta.noindex || ctx.settings.env !== 'production' ? 'noindex, nofollow' : 'index, follow';
  const ld = (meta.jsonLd ?? []).map(
    (obj) =>
      html`<script type="application/ld+json">
        ${raw(JSON.stringify(obj).replace(/</g, '\\u003c'))}
      </script>`,
  );
  return html`<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${fullTitle}</title>
    <meta name="description" content="${meta.description}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${url}" />
    <meta name="theme-color" content="#f5f1e8" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <meta property="og:site_name" content="${site.name}" />
    <meta property="og:type" content="${meta.ogType ?? 'website'}" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="${site.locale}" />
    <meta property="og:image" content="${ctx.url('/og-image.png')}" />
    <meta property="og:image:alt" content="SeekSense: contour lines on a warm ivory background" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preload" href="/fonts/Newsreader.woff" as="font" type="font/woff" crossorigin />
    <link rel="stylesheet" href="${ctx.asset('/css/main.css')}" />
    <script src="${ctx.asset('/js/site.js')}" defer></script>
    ${(meta.scripts ?? []).map((s) => html`<script src="${ctx.asset(s)}" defer></script>`)} ${ld}
  </head>`;
}

function header(meta: PageMeta): SafeHtml {
  return html`<header class="site-header" data-header>
    <div class="wrap site-header__inner">
      <a class="wordmark" href="/" aria-label="${site.name}: home">${logo({ eager: true })}</a>
      <a class="urgent-link" href="/urgent-help/"
        ><span class="dot" aria-hidden="true"></span><span class="urgent-link__long">Need urgent help?</span
        ><span class="urgent-link__short">Urgent help</span></a
      >
      <a class="menu-toggle" href="#site-nav" aria-controls="site-nav" data-menu-toggle
        ><span class="menu-toggle__icon" aria-hidden="true"></span><span class="menu-toggle__label">Menu</span></a
      >
      <nav class="site-nav" id="site-nav" aria-label="Main">
        <ul>
          ${NAV.map(
            (item) =>
              html`<li>
                <a
                  href="${item.href}"
                  ${meta.section === item.key
                    ? raw(meta.path === item.href ? 'aria-current="page"' : 'aria-current="true"')
                    : ''}
                  >${item.label}</a
                >
              </li>`,
          )}
        </ul>
      </nav>
    </div>
  </header>`;
}

export function urgentStrip(): SafeHtml {
  const lines = urgentHelp.lines.filter((l) => l.name !== 'Lifeline (Northern Ireland)' && l.name !== 'SHOUT');
  return html`<aside class="urgent-strip" aria-labelledby="urgent-strip-title">
    <div class="wrap urgent-strip__inner">
      <div>
        <h2 id="urgent-strip-title">Need help now?</h2>
        <p>${site.name} is not an emergency service and messages are not monitored around the clock.</p>
      </div>
      <ul class="urgent-strip__lines">
        <li><strong>Life at risk</strong><a href="tel:999">Call 999</a></li>
        ${lines.map(
          (l) =>
            html`<li>
              <strong>${l.name}</strong
              ><a href="tel:${'tel' in l ? l.tel : ''}">${l.action.replace(' and choose', ', then')}</a>
            </li>`,
        )}
        <li><strong>More options</strong><a href="/urgent-help/">Urgent help page</a></li>
      </ul>
    </div>
  </aside>`;
}

function footer(ctx: BuildContext): SafeHtml {
  const services = ctx.publishedServices();
  return html`<footer class="site-footer">
    <div class="site-footer__band" aria-hidden="true"></div>
    <div class="wrap site-footer__grid">
      <div>
        <a class="wordmark wordmark--panel" href="/" aria-label="${site.name}: home">${logo()}</a>
        <p>Talking therapy, assessment and help finding the right support, offered ${fact(site.service.formats)}.</p>
        <p>Email <a href="mailto:${factText(site.contact.email)}">${fact(site.contact.email)}</a></p>
      </div>
      <nav aria-labelledby="footer-services">
        <h2 id="footer-services">Services</h2>
        <ul>
          ${services.map((s) => html`<li><a href="/services/${s.slug}/">${s.shortTitle}</a></li>`)}
          <li><a href="/find-support/">Find the right support</a></li>
        </ul>
      </nav>
      <nav aria-labelledby="footer-about">
        <h2 id="footer-about">About</h2>
        <ul>
          <li><a href="/approach/">Our approach</a></li>
          <li><a href="/about/">The practitioner</a></li>
          <li><a href="/resources/">Resources</a></li>
          <li><a href="/contact/">Contact</a></li>
        </ul>
      </nav>
      <nav aria-labelledby="footer-policies">
        <h2 id="footer-policies">Safety and policies</h2>
        <ul>
          <li><a href="/urgent-help/">Urgent help</a></li>
          <li><a href="/safeguarding/">Safeguarding</a></li>
          <li><a href="/complaints/">Feedback and complaints</a></li>
          <li><a href="/privacy/">Privacy notice</a></li>
          <li><a href="/cookies/">Cookies</a></li>
          <li><a href="/terms/">Terms and service limits</a></li>
          <li><a href="/accessibility/">Accessibility</a></li>
        </ul>
      </nav>
    </div>
    <div class="wrap site-footer__legal">
      <p>
        ${fact(site.company.legalName)} is registered in ${fact(site.company.country)}, ${fact(site.company.number)}.
        Registered office: ${fact(site.company.registeredOffice)}. ${fact(site.company.icoRegistration)}.
        ${fact(site.company.trademarkNotice)}
      </p>
      <p>
        The information on this website is general and is not a substitute for individual professional advice. &copy;
        ${new Date().getFullYear()} ${site.name}.
      </p>
    </div>
  </footer>`;
}

function previewBanner(ctx: BuildContext): Renderable {
  if (ctx.settings.env === 'production') return null;
  return html`<div class="preview-banner" role="note">
    <div class="wrap">
      <p>
        <strong>Preview build.</strong> Highlighted text is a placeholder that must be confirmed before launch.
        <a href="/_verification/">See everything that needs confirming</a>.
      </p>
    </div>
  </div>`;
}

export function layout(ctx: BuildContext, meta: PageMeta, main: Renderable): string {
  const body = html`<!doctype html>
    <html lang="${site.lang}">
      ${head(ctx, meta)}
      <body>
        <a class="skip-link" href="#main">Skip to main content</a>
        ${previewBanner(ctx)} ${header(meta)}
        <main id="main" tabindex="-1">${main}</main>
        ${meta.hideUrgentStrip ? '' : urgentStrip()} ${footer(ctx)}
      </body>
    </html>`;
  return body.value;
}
