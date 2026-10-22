import { html, type SafeHtml } from '../lib/html.ts';
import { layout } from '../components/layout.ts';
import { arrow, breadcrumbLd, pageHead } from '../components/parts.ts';
import type { BuildContext } from '../lib/context.ts';
import type { Page } from './types.ts';

// An informational guide, not an assessment. Nothing selected is stored,
// sent, logged or put in the URL: the form has no action, and the script
// only shows and hides content that is already on the page.

interface Option {
  id: string;
  label: string;
  hint?: string;
  result: (ctx: BuildContext) => { title: string; body: SafeHtml };
}

const link = (href: string | null, label: string, fallback = '/contact/') =>
  html`<a class="link-arrow" href="${href ?? fallback}">${label} ${arrow}</a>`;

const OPTIONS: Option[] = [
  {
    id: 'urgent',
    label: 'I am worried about my safety, or someone else’s, right now',
    result: () => ({
      title: 'Please get help now',
      body: html`<div class="emergency">
          <h2>If a life is at risk, call 999 or go to A&amp;E.</h2>
          <p>
            For urgent mental health help in England, Scotland or Wales, call
            <a href="tel:111">111 and choose option 2</a>. In Northern Ireland, call
            <a href="tel:08088088000">Lifeline on 0808 808 8000</a>. Samaritans are available any time on
            <a href="tel:116123">116 123</a>.
          </p>
        </div>
        <p>${link('/urgent-help/', 'More urgent help options')}</p>
        <p class="small muted">We are not a crisis service, so please do not wait for a reply from us.</p>`,
    }),
  },
  {
    id: 'talk',
    label: 'Something has been weighing on me and I would like to talk it through regularly',
    hint: 'For example stress, low mood, worry, a loss or a big change',
    result: (ctx) => ({
      title: 'Talking therapy may be worth exploring',
      body: html`<p>
          Regular sessions give you space to understand what is happening and work on what you would like to change. An
          initial consultation is a good way to see whether it feels right.
        </p>
        <p>
          You may also be able to refer yourself to NHS Talking Therapies for problems such as anxiety and depression,
          without seeing your GP first.
        </p>
        <p>${link(ctx.serviceHref('talking-therapy'), 'About talking therapy')}</p>`,
    }),
  },
  {
    id: 'understand',
    label: 'I want to understand what is going on before deciding anything',
    hint: 'You would value a clear picture, perhaps in writing',
    result: (ctx) => ({
      title: 'An assessment may help',
      body: html`<p>
          A structured assessment looks carefully at what you are experiencing and what might help, and usually ends
          with a written summary. It is worth asking in advance whether it can include a diagnosis, if that matters to
          you.
        </p>
        <p>${link(ctx.serviceHref('mental-health-assessment'), 'About assessment')}</p>
        <p>
          ${link(
            '/resources/understanding-mental-health-assessment/',
            'Read: understanding a mental health assessment',
          )}
        </p>`,
    }),
  },
  {
    id: 'navigate',
    label: 'I have been trying to find help and the options are confusing',
    hint: 'NHS, private, charities, specialists',
    result: (ctx) => ({
      title: 'Help finding the right support',
      body: html`<p>
          Sometimes the most useful step is working out where to go. We can talk through your options, including NHS and
          charity services, and be honest if another service would suit you better.
        </p>
        <p>${link(ctx.serviceHref('signposting'), 'About finding the right support')}</p>
        <p>${link('/resources/therapy-assessment-or-signposting/', 'Read: therapy, assessment or signposting?')}</p>`,
    }),
  },
  {
    id: 'unsure',
    label: 'I am not sure. I just know things do not feel right',
    result: (ctx) => ({
      title: 'Start with a conversation',
      body: html`<p>
          You do not need to know what you need. An initial consultation is designed for exactly this: we listen, and
          then give you our honest view of the options.
        </p>
        <p>
          It is also worth speaking to your GP, particularly if you have physical symptoms or things have changed
          quickly.
        </p>
        <p>${link(ctx.serviceHref('initial-consultation'), 'About the initial consultation')}</p>`,
    }),
  },
  {
    id: 'someone-else',
    label: 'I am looking for information for someone else',
    hint: 'A partner, friend or family member',
    result: (ctx) => ({
      title: 'Supporting someone else',
      body: html`<p>
          Our resources explain the main kinds of support and how to reach them, which can make it easier to talk
          options through together. Any decision to seek help is theirs to make, unless their safety is at risk.
        </p>
        <p>${link('/resources/', 'Browse resources')}</p>
        <p>${link(ctx.serviceHref('signposting'), 'Help finding the right support')}</p>`,
    }),
  },
];

export const findSupportPage: Page = {
  path: '/find-support/',
  render(ctx) {
    const results = OPTIONS.map((o) => ({ id: o.id, label: o.label, ...o.result(ctx) }));
    const main = html`
      ${pageHead({
        current: 'Find support',
        eyebrow: 'Find support',
        title: 'Finding the right kind of support',
        lede: 'A short guide to the options. Choose the description that feels closest and we will suggest where to look.',
      })}
      <section class="section section--tight">
        <div class="wrap split">
          <div>
            <div class="callout callout--quiet">
              <h2>Before you start</h2>
              <p>
                This is a guide, not an assessment. It cannot tell you what is wrong or what treatment you need. Only a
                conversation with a qualified professional can do that.
              </p>
              <p>Nothing you select here is stored or sent anywhere.</p>
            </div>
          </div>
          <div>
            <form class="finder" data-finder novalidate>
              <fieldset>
                <legend>Which of these sounds most like where you are?</legend>
                <div class="choice-list">
                  ${OPTIONS.map(
                    (o) =>
                      html`<div class="choice">
                        <input type="radio" name="situation" id="opt-${o.id}" value="${o.id}" />
                        <label for="opt-${o.id}"
                          ><span
                            >${o.label}${o.hint ? html`<span class="choice__hint">${o.hint}</span>` : ''}</span
                          ></label
                        >
                      </div>`,
                  )}
                </div>
              </fieldset>
              <div class="finder-result" data-finder-result hidden tabindex="-1" aria-live="polite"></div>
            </form>

            <div class="finder-noscript-results" data-finder-templates>
              <h2 class="mt-7">Suggestions for each situation</h2>
              ${results.map(
                (r) =>
                  html`<section id="result-${r.id}" data-result="${r.id}" aria-labelledby="result-${r.id}-title">
                    <p class="eyebrow">${r.label}</p>
                    <h3 id="result-${r.id}-title">${r.title}</h3>
                    ${r.body}
                  </section>`,
              )}
            </div>
          </div>
        </div>
      </section>
    `;
    return layout(
      ctx,
      {
        path: '/find-support/',
        section: 'find-support',
        title: 'Find the right support',
        description:
          'A short, private guide to the kinds of mental health support available, from talking therapy to assessment and NHS services.',
        scripts: ['/js/finder.js'],
        jsonLd: [breadcrumbLd(ctx, [], { label: 'Find support', path: '/find-support/' })],
      },
      main,
    );
  },
};
