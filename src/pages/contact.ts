import { html } from '../lib/html.ts';
import { layout } from '../components/layout.ts';
import { arrow, breadcrumbLd, pageHead } from '../components/parts.ts';
import { fact, factText } from '../lib/verify.ts';
import { site } from '../config/site.ts';
import { ENQUIRY_INTERESTS, LIMITS } from '../../server/validation.ts';
import type { Page } from './types.ts';

export const contactPage: Page = {
  path: '/contact/',
  render(ctx) {
    const booking = ctx.settings.bookingUrl;
    const main = html`
      ${pageHead({
        current: 'Contact',
        eyebrow: 'Contact',
        title: 'Arrange an initial conversation',
        lede: 'Send a short enquiry and we will be in touch to arrange a time. You do not need to explain your situation here.',
      })}
      <section class="section section--tight">
        <div class="wrap split">
          <div class="stack">
            <div class="callout callout--clay" role="note">
              <h2>This form is not for emergencies</h2>
              <p>
                Enquiries are not monitored around the clock. If you need help now, call 999, or 111 and choose option
                2. Samaritans are available any time on <a href="tel:116123">116 123</a>.
                <a href="/urgent-help/">More urgent help</a>.
              </p>
            </div>
            <h2 class="mt-7">What happens next</h2>
            <ol class="steps steps--stacked">
              <li>
                <h3>We read your enquiry</h3>
                <p>${fact(site.contact.hours)}.</p>
              </li>
              <li>
                <h3>We reply to arrange a time</h3>
                <p>${fact(site.contact.responseTime)}.</p>
              </li>
              <li>
                <h3>We meet for an initial consultation</h3>
                <p>There is no commitment beyond that first conversation.</p>
              </li>
            </ol>
            <p class="mt-7">
              Prefer email? Write to
              <a href="mailto:${factText(site.contact.email)}">${fact(site.contact.email)}</a>.
            </p>
            ${booking
              ? html`<p>
                  <a class="button button--quiet" href="${booking}" rel="noopener"
                    >Book an initial consultation online ${arrow}</a
                  >
                </p>`
              : ''}
          </div>

          <div>
            <form class="form" method="post" action="/api/enquiry" data-enquiry-form novalidate>
              <div class="form-status form-status--error" data-form-error hidden tabindex="-1" role="alert"></div>

              <div class="field" data-field="name">
                <label for="name">Your name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autocomplete="name"
                  required
                  maxlength="${LIMITS.name}"
                  aria-describedby="name-error"
                />
                <p class="field__error" id="name-error" data-error-for="name"></p>
              </div>

              <div class="field" data-field="email">
                <label for="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  maxlength="${LIMITS.email}"
                  aria-describedby="email-error"
                  spellcheck="false"
                />
                <p class="field__error" id="email-error" data-error-for="email"></p>
              </div>

              <div class="field" data-field="phone">
                <label for="phone">Phone number <span class="muted">(optional)</span></label>
                <p class="hint" id="phone-hint">Only if you would prefer a call back.</p>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autocomplete="tel"
                  maxlength="${LIMITS.phone}"
                  aria-describedby="phone-hint phone-error"
                />
                <p class="field__error" id="phone-error" data-error-for="phone"></p>
              </div>

              <div class="field" data-field="interest">
                <label for="interest">What are you interested in?</label>
                <select id="interest" name="interest" required aria-describedby="interest-error">
                  <option value="">Please choose</option>
                  ${ENQUIRY_INTERESTS.map((i) => html`<option value="${i.value}">${i.label}</option>`)}
                </select>
                <p class="field__error" id="interest-error" data-error-for="interest"></p>
              </div>

              <div class="field" data-field="message">
                <label for="message">Anything you would like us to know <span class="muted">(optional)</span></label>
                <p class="hint" id="message-hint">
                  A sentence or two is plenty, such as times that suit you. Please do not include health or medical
                  details; we will talk about those privately.
                </p>
                <textarea
                  id="message"
                  name="message"
                  rows="4"
                  maxlength="${LIMITS.message}"
                  aria-describedby="message-hint message-count message-error"
                  data-counted
                ></textarea>
                <p class="counter" id="message-count" data-counter-for="message" aria-live="polite"></p>
                <p class="field__error" id="message-error" data-error-for="message"></p>
              </div>

              <div class="field" data-field="consent">
                <div class="checkbox">
                  <input
                    id="consent"
                    name="consent"
                    type="checkbox"
                    value="yes"
                    required
                    aria-describedby="consent-error"
                  />
                  <label for="consent"
                    >I have read the <a href="/privacy/">privacy notice</a> and agree to ${site.name} using these
                    details to reply to my enquiry.</label
                  >
                </div>
                <p class="field__error" id="consent-error" data-error-for="consent"></p>
              </div>

              <div class="hp-field" aria-hidden="true">
                <label for="website">Leave this field empty</label>
                <input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
              </div>
              <input type="hidden" name="started" value="" data-started />

              <div>
                <button class="button" type="submit" data-submit>
                  <span data-submit-label>Send enquiry</span>
                  <span class="spinner" aria-hidden="true" hidden data-spinner></span>
                </button>
              </div>
              <p class="small muted">
                We keep enquiry details only as long as needed to respond. See our
                <a href="/privacy/">privacy notice</a>.
              </p>
            </form>

            <div class="form-status form-status--success" data-form-success hidden tabindex="-1">
              <h2>Thank you. Your enquiry has been sent.</h2>
              <p>${fact(site.contact.responseTime)}. If you do not hear from us, please check your spam folder.</p>
              <p>
                If things become urgent before then, please use the <a href="/urgent-help/">urgent help options</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    `;
    return layout(
      ctx,
      {
        path: '/contact/',
        section: 'contact',
        title: 'Contact',
        description: 'Send a short enquiry to arrange an initial conversation with SeekSense. Not for emergencies.',
        scripts: ['/js/enquiry.js'],
        jsonLd: [breadcrumbLd(ctx, [], { label: 'Contact', path: '/contact/' })],
      },
      main,
    );
  },
};

function statusPage(path: string, title: string, body: ReturnType<typeof html>): Page {
  return {
    path,
    excludeFromSitemap: true,
    render(ctx) {
      const main = html`
        ${pageHead({ trail: [{ label: 'Contact', href: '/contact/' }], current: title, title })}
        <section class="section section--tight"><div class="wrap narrow prose">${body}</div></section>
      `;
      return layout(ctx, { path, section: 'contact', title, description: title, noindex: true }, main);
    },
  };
}

export const contactStatusPages: Page[] = [
  statusPage(
    '/contact/received/',
    'Thank you, your enquiry has been sent',
    html`<p>${fact(site.contact.responseTime)}.</p>
      <p>If things become urgent before then, please use the <a href="/urgent-help/">urgent help options</a>.</p>
      <p><a class="link-arrow" href="/">Return to the home page ${arrow}</a></p>`,
  ),
  statusPage(
    '/contact/problem/',
    'We could not send your enquiry',
    html`<p>Something in the form needs checking. Please go back and make sure you have:</p>
      <ul>
        <li>entered your name and a valid email address</li>
        <li>chosen what you are interested in</li>
        <li>ticked the box to confirm you have read the privacy notice</li>
      </ul>
      <p><a class="link-arrow" href="/contact/">Back to the form ${arrow}</a></p>
      <p>Or email us at <a href="mailto:${factText(site.contact.email)}">${fact(site.contact.email)}</a>.</p>`,
  ),
  statusPage(
    '/contact/unavailable/',
    'Online enquiries are not available right now',
    html`<p>
        Please email us at <a href="mailto:${factText(site.contact.email)}">${fact(site.contact.email)}</a> instead.
        Your details have not been saved.
      </p>
      <p>If you need help now, please use the <a href="/urgent-help/">urgent help options</a>.</p>`,
  ),
];
