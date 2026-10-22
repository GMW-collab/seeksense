import { html, raw, type Renderable, type SafeHtml } from '../lib/html.ts';
import { isPending, type Fact } from '../lib/verify.ts';
import { site } from '../config/site.ts';
import { themeBySlug, type Article, type Service } from '../lib/content.ts';
import type { BuildContext } from '../lib/context.ts';

export interface Crumb {
  label: string;
  href: string;
}

export function breadcrumbs(trail: Crumb[], current: string): SafeHtml {
  return html`<nav class="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      ${trail.map((c) => html`<li><a href="${c.href}">${c.label}</a></li>`)}
      <li><span aria-current="page">${current}</span></li>
    </ol>
  </nav>`;
}

export function pageHead(opts: {
  title: Renderable;
  lede?: Renderable;
  eyebrow?: string;
  trail?: Crumb[];
  current?: string;
  extra?: Renderable;
}): SafeHtml {
  return html`<header class="page-head">
    <div class="wrap">
      ${opts.current ? breadcrumbs(opts.trail ?? [], opts.current) : ''}
      ${opts.eyebrow ? html`<span class="eyebrow eyebrow--rule">${opts.eyebrow}</span>` : ''}
      <h1>${opts.title}</h1>
      ${opts.lede ? html`<p class="lede">${opts.lede}</p>` : ''} ${opts.extra ?? ''}
    </div>
  </header>`;
}

export const arrow = raw('<span class="arrow" aria-hidden="true">&rarr;</span>');

export function statusLabel(service: Service): Renderable {
  if (service.status === 'live') return null;
  return html`<span class="status status--proposed">Not yet taking bookings</span>`;
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function articleMeta(article: Article): SafeHtml {
  return html`<ul class="meta">
    ${article.published
      ? html`<li>Published <time datetime="${article.published}">${formatDate(article.published)}</time></li>`
      : html`<li><span class="status status--proposed">Draft awaiting clinical review</span></li>`}
    ${article.reviewed
      ? html`<li>Reviewed <time datetime="${article.reviewed}">${formatDate(article.reviewed)}</time></li>`
      : ''}
    <li>${article.readingMinutes} min read</li>
  </ul>`;
}

export function articleItem(article: Article, headingLevel: 2 | 3 = 3): SafeHtml {
  const theme = themeBySlug(article.theme);
  const heading =
    headingLevel === 2
      ? html`<h2 class="h3-like"><a href="/resources/${article.slug}/">${article.title}</a></h2>`
      : html`<h3><a href="/resources/${article.slug}/">${article.title}</a></h3>`;
  return html`<li class="article-item">
    <span class="article-item__theme">${theme.title}</span>
    ${heading}
    <p>${article.summary}</p>
    ${articleMeta(article)}
  </li>`;
}

export function articleList(articles: Article[], cols: 2 | 3 = 2, headingLevel: 2 | 3 = 3): Renderable {
  if (articles.length === 0) {
    return html`<div class="callout callout--quiet">
      <p>
        New articles are being written and reviewed. In the meantime, the NHS website has reliable information on
        <a href="https://www.nhs.uk/mental-health/" rel="noopener noreferrer"
          >mental health<span class="visually-hidden"> (external site)</span></a
        >.
      </p>
    </div>`;
  }
  return html`<ul class="article-list ${cols === 3 ? 'article-list--3' : ''}">
    ${articles.map((a) => articleItem(a, headingLevel))}
  </ul>`;
}

export function serviceRows(ctx: BuildContext, services: Service[], headingLevel: 2 | 3 = 2): Renderable {
  if (services.length === 0) {
    return html`<div class="callout callout--quiet">
      <p>Our services are being finalised. You are welcome to <a href="/contact/">get in touch</a> in the meantime.</p>
    </div>`;
  }
  return html`<ul class="service-list">
    ${services.map((s) => {
      const h =
        headingLevel === 2
          ? html`<h2><a href="/services/${s.slug}/">${s.title}</a></h2>`
          : html`<h3><a href="/services/${s.slug}/">${s.title}</a></h3>`;
      return html`<li>
        <div>${h}</div>
        <div>
          <p>${s.summary}</p>
          ${ctx.settings.env !== 'production' && s.status !== 'live'
            ? html`<p class="status-row">${statusLabel(s)}</p>`
            : ''}
        </div>
        <a class="link-arrow" href="/services/${s.slug}/" aria-label="About ${s.title}">More ${arrow}</a>
      </li>`;
    })}
  </ul>`;
}

/** Only verified facts appear in structured data; pending ones are omitted. */
export function verified(value: Fact | null | undefined): string | undefined {
  if (value === null || value === undefined || isPending(value)) return undefined;
  return value;
}

export function organisationLd(ctx: BuildContext): object {
  const email = verified(site.contact.email);
  const legalName = verified(site.company.legalName);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: ctx.url('/'),
    logo: ctx.url('/apple-touch-icon.png'),
    ...(legalName ? { legalName } : {}),
    ...(email ? { email } : {}),
    ...(site.social.links.length ? { sameAs: site.social.links.map((l) => l.href) } : {}),
  };
}

export function breadcrumbLd(ctx: BuildContext, trail: Crumb[], current: { label: string; path: string }): object {
  const items = [{ label: 'Home', href: '/' }, ...trail, { label: current.label, href: current.path }];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: ctx.url(c.href),
    })),
  };
}

export function nextStep(opts: {
  title: string;
  body: Renderable;
  href: string;
  label: string;
  secondary?: { href: string; label: string };
}): SafeHtml {
  return html`<section class="section section--band section--tight" aria-labelledby="next-step">
    <div class="wrap split">
      <div>
        <span class="eyebrow eyebrow--rule">Next step</span>
        <h2 id="next-step">${opts.title}</h2>
      </div>
      <div>
        <p class="lede">${opts.body}</p>
        <div class="actions">
          <a class="button" href="${opts.href}">${opts.label} ${arrow}</a>
          ${opts.secondary
            ? html`<a class="link-arrow" href="${opts.secondary.href}">${opts.secondary.label} ${arrow}</a>`
            : ''}
        </div>
      </div>
    </div>
  </section>`;
}
