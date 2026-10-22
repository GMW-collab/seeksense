import { html } from '../lib/html.ts';
import { layout } from '../components/layout.ts';
import { arrow, articleList, organisationLd, serviceRows } from '../components/parts.ts';
import { fact } from '../lib/verify.ts';
import { site } from '../config/site.ts';
import type { BuildContext } from '../lib/context.ts';
import type { Page } from './types.ts';

function pathways(ctx: BuildContext) {
  const therapy = ctx.serviceHref('talking-therapy');
  const assessment = ctx.serviceHref('mental-health-assessment');
  const items = [
    therapy && { href: therapy, title: 'I would like to talk to someone regularly', hint: 'Talking therapy' },
    assessment && {
      href: assessment,
      title: 'I want to understand what is going on',
      hint: 'Mental health assessment',
    },
    { href: '/find-support/', title: 'I am not sure what I need', hint: 'A short guide to the options' },
    { href: '/resources/', title: 'I would rather read first', hint: 'Articles and guides' },
  ].filter((x): x is { href: string; title: string; hint: string } => Boolean(x));
  return html`<ol class="pathways" aria-label="Ways to start">
    ${items.map(
      (p, i) =>
        html`<li>
          <a href="${p.href}"
            ><span class="pathways__num" aria-hidden="true">0${i + 1}</span
            ><span class="pathways__title">${p.title}<span class="pathways__hint">${p.hint}</span></span
            >${arrow}</a
          >
        </li>`,
    )}
  </ol>`;
}

export const homePage: Page = {
  path: '/',
  render(ctx) {
    const articles = ctx.publishedArticles().slice(0, 3);
    const main = html`
      <section class="hero" aria-labelledby="hero-title">
        <div class="wrap hero__grid">
          <div>
            <span class="eyebrow eyebrow--rule">Talking therapy &middot; Assessment &middot; Guidance</span>
            <h1 id="hero-title">Help to make sense of what you are going through.</h1>
            <p class="lede">
              ${site.name} offers talking therapy, mental health assessment and practical help finding the right
              support, for ${fact(site.service.audience)} ${fact(site.service.area)}. We start by listening, and we are
              honest about what is likely to help.
            </p>
            <h2 class="eyebrow" id="start">Where would you like to start?</h2>
            ${pathways(ctx)}
            <div class="actions">
              <a class="button" href="/contact/">Arrange an initial conversation ${arrow}</a>
              <a class="link-arrow" href="/approach/">How we work ${arrow}</a>
            </div>
          </div>
          <figure class="hero__figure">
            <div class="hero__art">
              <img src="/art/terrain-hero.svg" alt="" width="440" height="560" fetchpriority="low" />
            </div>
            <figcaption class="figcaption">Contour lines turn difficult ground into something you can read.</figcaption>
          </figure>
        </div>
      </section>

      <section class="section" aria-labelledby="approach-title">
        <div class="wrap split">
          <div>
            <span class="eyebrow eyebrow--rule">Our approach</span>
            <h2 id="approach-title">Careful listening first. Then an honest view of what might help.</h2>
          </div>
          <div>
            <p class="lede">
              People seek support for many reasons, and rarely for just one. We take time to understand your situation
              before suggesting anything, and we explain our thinking so you can make your own decisions.
            </p>
            <ul class="principles mt-7">
              <li>
                <h3>Listening before advising</h3>
                <p>Your account of what is happening is the starting point, not a box to tick.</p>
              </li>
              <li>
                <h3>Choices you understand</h3>
                <p>We explain options, costs and limits plainly, so you can decide with confidence.</p>
              </li>
              <li>
                <h3>Clear professional boundaries</h3>
                <p>Confidentiality, supervision and safeguarding are in place and explained from the start.</p>
              </li>
              <li>
                <h3>Honest about fit</h3>
                <p>If another service would suit you better, we will say so and help you reach it.</p>
              </li>
            </ul>
            <p class="mt-6"><a class="link-arrow" href="/approach/">Read about our approach ${arrow}</a></p>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="services-title">
        <div class="wrap">
          <span class="eyebrow eyebrow--rule">Services</span>
          <h2 id="services-title">Ways we can help</h2>
          <p class="lede">Each service page explains who it may suit, what it involves and what it does not offer.</p>
          <div class="mt-6">${serviceRows(ctx, ctx.publishedServices(), 3)}</div>
        </div>
      </section>

      <section class="section section--band" aria-labelledby="next-title">
        <div class="wrap">
          <span class="eyebrow eyebrow--rule">What happens next</span>
          <h2 id="next-title">Getting started is simple, and there is no commitment.</h2>
          <ol class="steps mt-7">
            <li>
              <h3>Send a short enquiry</h3>
              <p>Just your name, how to reach you and what you are interested in. No health details are needed.</p>
            </li>
            <li>
              <h3>We arrange a first conversation</h3>
              <p>${fact(site.contact.responseTime)}, to find a time for an initial consultation.</p>
            </li>
            <li>
              <h3>You decide what happens next</h3>
              <p>We share our honest view of what might help. Whether and how to continue is up to you.</p>
            </li>
          </ol>
          <div class="actions">
            <a class="button" href="/contact/">Make an enquiry ${arrow}</a>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="who-title">
        <div class="wrap split">
          <div>
            <span class="eyebrow eyebrow--rule">Who you will work with</span>
            <h2 id="who-title">${fact(site.practitioner.name)}</h2>
            <p class="muted">${fact(site.practitioner.role)}</p>
          </div>
          <div>
            <dl class="glance">
              <div>
                <dt>Registration</dt>
                <dd>${fact(site.practitioner.registration)}</dd>
              </div>
              <div>
                <dt>Qualifications</dt>
                <dd>${fact(site.practitioner.qualifications)}</dd>
              </div>
              <div>
                <dt>Supervision</dt>
                <dd>${fact(site.practitioner.supervision)}</dd>
              </div>
            </dl>
            <p class="mt-6"><a class="link-arrow" href="/about/">About the practitioner ${arrow}</a></p>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="resources-title">
        <div class="wrap">
          <span class="eyebrow eyebrow--rule">Resources</span>
          <h2 id="resources-title">Clear information, carefully sourced</h2>
          <div class="mt-6">${articleList(articles, 3)}</div>
          <p class="mt-6"><a class="link-arrow" href="/resources/">All resources ${arrow}</a></p>
        </div>
      </section>
    `;
    return layout(
      ctx,
      {
        path: '/',
        title: 'Talking therapy, assessment and help finding support',
        description: site.defaultDescription,
        jsonLd: [
          organisationLd(ctx),
          { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: ctx.url('/') },
        ],
      },
      main,
    );
  },
};
