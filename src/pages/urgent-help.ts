import { html } from '../lib/html.ts';
import { layout } from '../components/layout.ts';
import { breadcrumbLd, formatDate, pageHead } from '../components/parts.ts';
import { site, urgentHelp } from '../config/site.ts';
import type { Page } from './types.ts';

export const urgentHelpPage: Page = {
  path: '/urgent-help/',
  render(ctx) {
    const main = html`
      ${pageHead({
        current: 'Urgent help',
        title: 'Getting help now',
        lede: `${site.name} is not an emergency service. If you need help today, these services are available.`,
      })}
      <section class="section section--tight">
        <div class="wrap">
          <div class="emergency">
            <h2>${urgentHelp.emergency.label}: <a href="tel:999">call 999</a> or go to A&amp;E.</h2>
            <p>
              This includes if someone has seriously harmed themselves, taken an overdose, or cannot keep themselves
              safe.
            </p>
          </div>

          <h2>Urgent help and someone to talk to</h2>
          <ul class="help-lines mt-6">
            ${urgentHelp.lines.map(
              (l) =>
                html`<li>
                  <h3>${l.name}</h3>
                  <p>${l.detail}</p>
                  ${'tel' in l
                    ? html`<a class="help-action" href="tel:${l.tel}">${l.action}</a>`
                    : html`<a class="help-action" href="sms:${l.sms}?&amp;body=${l.smsBody}">${l.action}</a>`}
                </li>`,
            )}
          </ul>
        </div>
      </section>

      <section class="section section--tight" aria-labelledby="more">
        <div class="wrap split">
          <div><h2 id="more">Other routes</h2></div>
          <div class="prose">
            <p>
              <strong>Your GP surgery</strong> can offer an urgent appointment. Out of hours, NHS 111 can direct you to
              the right service.
            </p>
            <p>
              <strong>Children and young people</strong> under 19 can call Childline free on
              <a href="tel:08001111">0800 1111</a>.
            </p>
            <p>
              <strong>Local crisis services</strong> can be found using the
              <a href="https://hubofhope.co.uk/" rel="noopener noreferrer"
                >Hub of Hope<span class="visually-hidden"> (external site)</span></a
              >
              directory.
            </p>
            <p>
              <strong>If you are worried about someone else</strong>, the same services can help you decide what to do.
              If you think they are in immediate danger, call 999.
            </p>
            <p class="small muted">
              Information checked against NHS and national sources on ${formatDate(urgentHelp.checked)}. Services
              outside the UK will differ.
            </p>
          </div>
        </div>
      </section>
    `;
    return layout(
      ctx,
      {
        path: '/urgent-help/',
        title: 'Urgent mental health help',
        description:
          'How to get urgent mental health help in the UK: 999, NHS 111 option 2, Lifeline, Samaritans and SHOUT.',
        hideUrgentStrip: true,
        jsonLd: [breadcrumbLd(ctx, [], { label: 'Urgent help', path: '/urgent-help/' })],
      },
      main,
    );
  },
};
