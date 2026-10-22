import { html, raw } from '../lib/html.ts';
import { layout } from '../components/layout.ts';
import { articleList, articleMeta, breadcrumbLd, nextStep, pageHead } from '../components/parts.ts';
import { renderInline, slugify } from '../lib/markdown.ts';
import { THEMES, themeBySlug, type Article, type Theme } from '../lib/content.ts';
import { fact, pending } from '../lib/verify.ts';
import { site } from '../config/site.ts';
import type { BuildContext } from '../lib/context.ts';
import type { Page } from './types.ts';

function themesWithArticles(ctx: BuildContext): Theme[] {
  const used = new Set(ctx.publishedArticles().map((a) => a.theme));
  return THEMES.filter((t) => used.has(t.slug));
}

function themeNav(ctx: BuildContext, current: string | null) {
  const themes = themesWithArticles(ctx);
  if (themes.length < 2) return '';
  return html`<nav class="theme-nav mt-6" aria-label="Resource themes">
    <ul>
      <li><a href="/resources/" ${current === null ? raw('aria-current="page"') : ''}>All</a></li>
      ${themes.map(
        (t) =>
          html`<li>
            <a href="/resources/themes/${t.slug}/" ${current === t.slug ? raw('aria-current="page"') : ''}
              >${t.title}</a
            >
          </li>`,
      )}
    </ul>
  </nav>`;
}

export const resourcesIndexPage: Page = {
  path: '/resources/',
  render(ctx) {
    const main = html`
      ${pageHead({
        current: 'Resources',
        eyebrow: 'Resources',
        title: 'Resources and insights',
        lede: 'Clear, carefully sourced information about mental health, psychological approaches and finding support in the UK.',
        extra: themeNav(ctx, null),
      })}
      <section class="section section--tight">
        <div class="wrap">${articleList(ctx.publishedArticles(), 2, 2)}</div>
      </section>
      <section class="section section--tight">
        <div class="wrap narrow">
          <p class="small muted">
            Our articles are general information, not advice about your individual circumstances. Each shows when it was
            last reviewed and the sources it draws on.
          </p>
        </div>
      </section>
    `;
    return layout(
      ctx,
      {
        path: '/resources/',
        section: 'resources',
        title: 'Resources and insights',
        description:
          'Plain-English articles on mental health support, talking therapies and assessments in the UK, with sources.',
        jsonLd: [breadcrumbLd(ctx, [], { label: 'Resources', path: '/resources/' })],
      },
      main,
    );
  },
};

export function themePages(ctx: BuildContext): Page[] {
  return themesWithArticles(ctx).map((theme) => {
    const path = `/resources/themes/${theme.slug}/`;
    return {
      path,
      render(c) {
        const articles = c.publishedArticles().filter((a) => a.theme === theme.slug);
        const main = html`
          ${pageHead({
            trail: [{ label: 'Resources', href: '/resources/' }],
            current: theme.title,
            eyebrow: 'Resources',
            title: theme.title,
            lede: theme.description,
            extra: themeNav(c, theme.slug),
          })}
          <section class="section section--tight">
            <div class="wrap">${articleList(articles, 2, 2)}</div>
          </section>
        `;
        return layout(
          c,
          {
            path,
            section: 'resources',
            title: `${theme.title}: resources`,
            description: theme.description,
            jsonLd: [breadcrumbLd(c, [{ label: 'Resources', href: '/resources/' }], { label: theme.title, path })],
          },
          main,
        );
      },
    };
  });
}

function toc(article: Article) {
  const headings = [...article.bodyMarkdown.matchAll(/^##\s+(.+)$/gm)].map((m) => (m[1] ?? '').trim());
  if (headings.length < 3) return '';
  return html`<nav aria-labelledby="toc-title">
    <h2 id="toc-title">On this page</h2>
    <ol>
      ${headings.map((h) => {
        const inline = renderInline(h);
        return html`<li><a href="#${slugify(inline)}">${raw(inline)}</a></li>`;
      })}
    </ol>
  </nav>`;
}

export function articlePage(article: Article): Page {
  const path = `/resources/${article.slug}/`;
  return {
    path,
    render(ctx) {
      const theme = themeBySlug(article.theme);
      const related = article.related
        .map((slug) => ctx.publishedArticles().find((a) => a.slug === slug))
        .filter((a): a is Article => Boolean(a));
      const reviewer = pending(
        'Named clinical reviewer for published articles',
        '[Reviewer name and title]',
        'clinical',
      );
      const main = html`
        ${pageHead({
          trail: [
            { label: 'Resources', href: '/resources/' },
            { label: theme.title, href: `/resources/themes/${theme.slug}/` },
          ],
          current: article.title,
          eyebrow: theme.title,
          title: article.title,
          lede: article.summary,
          extra: html`<div class="mt-6">${articleMeta(article)}</div>`,
        })}
        <section class="section section--tight">
          <div class="wrap article-layout">
            <article class="prose prose--serif" aria-labelledby="article-body-start">
              <span id="article-body-start" class="visually-hidden">${article.title}</span>
              ${raw(article.bodyHtml())}
              ${article.references.length
                ? html`<h2>Sources</h2>
                    <ol class="references">
                      ${article.references.map(
                        (r) =>
                          html`<li>
                            ${r.publisher}.
                            <a href="${r.url}" rel="noopener noreferrer"
                              >${r.title}<span class="visually-hidden"> (external site)</span></a
                            >
                          </li>`,
                      )}
                    </ol>`
                : ''}
              <div class="notice">
                <p>
                  Written by ${site.name}. Clinically reviewed by ${fact(reviewer)}.
                  ${article.nextReview ? html`Next review due ${article.nextReview}.` : ''}
                </p>
                <p class="mb-0">
                  This article is general information, not advice about your circumstances. If you are worried about
                  your mental health, speak to your GP or a qualified practitioner. If you need help now, see
                  <a href="/urgent-help/">urgent help</a>.
                </p>
              </div>
            </article>
            <aside class="article-aside">${toc(article)}</aside>
          </div>
        </section>
        ${related.length
          ? html`<section class="section section--tight" aria-labelledby="related-reading">
              <div class="wrap">
                <h2 id="related-reading">Related reading</h2>
                ${articleList(related, 2)}
              </div>
            </section>`
          : ''}
        ${nextStep({
          title: 'Would it help to talk it through?',
          body: 'If something here resonates, an initial consultation is a calm way to explore what might help.',
          href: '/contact/',
          label: 'Make an enquiry',
          secondary: { href: '/find-support/', label: 'Find the right support' },
        })}
      `;
      const author = { '@type': 'Organization', name: site.name, url: ctx.url('/') };
      return layout(
        ctx,
        {
          path,
          section: 'resources',
          title: article.title,
          description: article.description,
          ogType: 'article',
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: article.title,
              description: article.description,
              mainEntityOfPage: ctx.url(path),
              author,
              publisher: author,
              ...(article.published ? { datePublished: article.published } : {}),
              ...(article.reviewed ? { dateModified: article.reviewed } : {}),
              citation: article.references.map((r) => r.url),
            },
            breadcrumbLd(
              ctx,
              [
                { label: 'Resources', href: '/resources/' },
                { label: theme.title, href: `/resources/themes/${theme.slug}/` },
              ],
              { label: article.title, path },
            ),
          ],
        },
        main,
      );
    },
  };
}
