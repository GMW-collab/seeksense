import { html, raw } from '../lib/html.ts';
import { layout } from '../components/layout.ts';
import { arrow, breadcrumbLd, nextStep, pageHead, serviceRows, statusLabel } from '../components/parts.ts';
import { renderInline, plainText } from '../lib/markdown.ts';
import type { BuildContext } from '../lib/context.ts';
import type { Service } from '../lib/content.ts';
import type { Page } from './types.ts';

export const servicesIndexPage: Page = {
  path: '/services/',
  render(ctx) {
    const services = ctx.publishedServices();
    const main = html`
      ${pageHead({
        current: 'Services',
        eyebrow: 'Services',
        title: 'Ways we can help',
        lede: 'Talking therapy, assessment and help finding the right support. If you are unsure which fits, an initial consultation is the place to start.',
      })}
      <section class="section section--tight">
        <div class="wrap">${serviceRows(ctx, services, 2)}</div>
      </section>
      <section class="section section--tight" aria-labelledby="difference">
        <div class="wrap split">
          <div><h2 id="difference">Not sure of the difference?</h2></div>
          <div class="prose">
            <p>
              <strong>Therapy</strong> is about change: regular sessions to work on what is troubling you.
              <strong>Assessment</strong> is about understanding: a structured look at what is going on, usually with a
              written summary. <strong>Signposting</strong> is about direction: finding the service most likely to help,
              which may not be us.
            </p>
            <p><a class="link-arrow" href="/find-support/">Use our guide to finding support ${arrow}</a></p>
          </div>
        </div>
      </section>
    `;
    return layout(
      ctx,
      {
        path: '/services/',
        section: 'services',
        title: 'Services',
        description:
          'Talking therapy, mental health assessment, initial consultations and help finding the right support.',
        jsonLd: [breadcrumbLd(ctx, [], { label: 'Services', path: '/services/' })],
      },
      main,
    );
  },
};

function related(ctx: BuildContext, service: Service) {
  const items = service.related
    .map((slug) => ctx.publishedServices().find((s) => s.slug === slug))
    .filter((s): s is Service => Boolean(s));
  if (items.length === 0) return '';
  return html`<section class="section section--tight" aria-labelledby="related">
    <div class="wrap">
      <h2 id="related">Related services</h2>
      ${serviceRows(ctx, items, 3)}
    </div>
  </section>`;
}

export function servicePage(service: Service): Page {
  const path = `/services/${service.slug}/`;
  return {
    path,
    render(ctx) {
      const main = html`
        ${pageHead({
          trail: [{ label: 'Services', href: '/services/' }],
          current: service.shortTitle,
          eyebrow: 'Service',
          title: service.title,
          lede: service.summary,
          extra: ctx.settings.env !== 'production' ? html`<p class="status-row">${statusLabel(service)}</p>` : '',
        })}
        <section class="section section--tight">
          <div class="wrap split">
            <aside class="service-aside" aria-labelledby="glance">
              <h2 id="glance" class="eyebrow">At a glance</h2>
              <dl class="glance">
                ${service.atAGlance.map(
                  (row) =>
                    html`<div>
                      <dt>${row.label}</dt>
                      <dd>${raw(renderInline(row.value))}</dd>
                    </div>`,
                )}
              </dl>
              <div class="actions">
                <a class="button" href="/contact/">Enquire about this ${arrow}</a>
              </div>
            </aside>
            <div>
              ${service.suitableFor.length
                ? html`<h2>Who it may suit</h2>
                    <ul class="check-list">
                      ${service.suitableFor.map((x) => html`<li>${raw(renderInline(x))}</li>`)}
                    </ul>`
                : ''}
              <div class="prose mt-7">${raw(service.bodyHtml())}</div>
              ${service.notProvided.length
                ? html`<div class="callout callout--clay mt-7">
                    <h2>What this service does not provide</h2>
                    <ul class="not-list">
                      ${service.notProvided.map((x) => html`<li>${raw(renderInline(x))}</li>`)}
                    </ul>
                  </div>`
                : ''}
              <p class="notice">
                If you are in crisis or worried about your immediate safety, please do not wait for an appointment. See
                <a href="/urgent-help/">urgent help</a>.
              </p>
            </div>
          </div>
        </section>
        ${related(ctx, service)}
        ${nextStep({
          title: 'Have a question first?',
          body: 'You are welcome to ask about anything on this page before deciding. A brief enquiry is enough.',
          href: `/contact/`,
          label: 'Make an enquiry',
        })}
      `;
      return layout(
        ctx,
        {
          path,
          section: 'services',
          title: service.title,
          description: plainText(service.description),
          jsonLd: [breadcrumbLd(ctx, [{ label: 'Services', href: '/services/' }], { label: service.shortTitle, path })],
        },
        main,
      );
    },
  };
}
