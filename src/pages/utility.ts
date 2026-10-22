import { html } from '../lib/html.ts';
import { layout } from '../components/layout.ts';
import { arrow, pageHead } from '../components/parts.ts';
import { register } from '../lib/verify.ts';
import type { Page } from './types.ts';

export const notFoundPage: Page = {
  path: '/404.html',
  excludeFromSitemap: true,
  render(ctx) {
    const main = html`<section class="not-found">
      <div class="wrap narrow">
        <img class="not-found__art" src="/art/terrain-small.svg" alt="" width="128" height="128" />
        <span class="eyebrow eyebrow--rule">Page not found</span>
        <h1>We could not find that page.</h1>
        <p class="lede">It may have moved, or the address may be slightly different. These might help:</p>
        <ul class="check-list">
          <li><a href="/">Home</a></li>
          <li><a href="/services/">Services</a></li>
          <li><a href="/resources/">Resources</a></li>
          <li><a href="/contact/">Contact</a></li>
        </ul>
        <p class="mt-6">If you need help now, please see <a href="/urgent-help/">urgent help</a>.</p>
      </div>
    </section>`;
    return layout(
      ctx,
      { path: '/404.html', title: 'Page not found', description: 'This page could not be found.', noindex: true },
      main,
    );
  },
};

/** Preview-only living style guide. */
export const styleguidePage: Page = {
  path: '/styleguide/',
  excludeFromSitemap: true,
  render(ctx) {
    const swatches = [
      ['--ivory', 'Ivory', 'Page background'],
      ['--paper', 'Paper', 'Raised surfaces'],
      ['--stone-200', 'Stone', 'Bands and rules'],
      ['--stone-600', 'Stone dark', 'Muted text (6.4:1)'],
      ['--ink', 'Ink', 'Body text (13.8:1)'],
      ['--forest', 'Forest', 'Links, buttons (8.6:1)'],
      ['--forest-900', 'Deep forest', 'Footer'],
      ['--sage', 'Sage', 'Decorative only'],
      ['--sage-100', 'Sage tint', 'Selected and success states'],
      ['--clay', 'Clay', 'Accent and focus (4.9:1)'],
      ['--danger', 'Error', 'Validation (5.8:1)'],
    ];
    const main = html`
      ${pageHead({ title: 'Design system', lede: 'Tokens and components used across the site. Preview builds only.' })}
      <section class="section section--tight">
        <div class="wrap stack">
          <h2>Colour</h2>
          <ul class="swatches">
            ${swatches.map(
              ([v, name, use]) =>
                html`<li>
                  <span class="swatch" data-swatch="${v}"></span><strong>${name}</strong><br /><span class="small muted"
                    >${v} &middot; ${use}</span
                  >
                </li>`,
            )}
          </ul>
          <h2 class="mt-7">Type</h2>
          <p class="eyebrow">Eyebrow label</p>
          <p class="sg-h1">Display heading, Newsreader</p>
          <h2>Section heading</h2>
          <h3>Sub-heading, Hanken Grotesk</h3>
          <p class="lede">Lede paragraph for introductions.</p>
          <p>Body text. <a href="#">An inline link</a>, <strong>strong text</strong> and <em>emphasis</em>.</p>
          <div class="prose prose--serif">
            <p>Long-form article text is set in Newsreader for comfortable reading.</p>
          </div>

          <h2 class="mt-7">Buttons and links</h2>
          <div class="actions">
            <a class="button" href="#">Primary action ${arrow}</a>
            <a class="button button--quiet" href="#">Secondary action</a>
            <button class="button" type="button" disabled>Disabled</button>
            <a class="link-arrow" href="#">Text link ${arrow}</a>
          </div>

          <h2 class="mt-7">Status and callouts</h2>
          <p>
            <span class="status status--proposed">Not yet taking bookings</span>
            <span class="status status--live">Taking enquiries</span>
          </p>
          <div class="callout">
            <h3>Callout</h3>
            <p>Neutral information.</p>
          </div>
          <div class="callout callout--clay">
            <h3>Important limit</h3>
            <p>Used for what a service does not provide.</p>
          </div>
          <div class="form-status form-status--success">
            <h2>Success state</h2>
            <p>Confirmation message.</p>
          </div>
          <div class="form-status form-status--error">
            <h2>Error summary</h2>
            <ul>
              <li><a href="#">Field error link</a></li>
            </ul>
          </div>

          <h2 class="mt-7">Form fields</h2>
          <form class="form" action="#">
            <div class="field">
              <label for="sg-a">Text input</label>
              <p class="hint">Hint text</p>
              <input id="sg-a" type="text" />
            </div>
            <div class="field field--error">
              <label for="sg-b">With an error</label
              ><input id="sg-b" type="text" aria-invalid="true" aria-describedby="sg-b-e" />
              <p class="field__error" id="sg-b-e">Describe how to fix the problem</p>
            </div>
            <div class="field">
              <label for="sg-c">Select</label
              ><select id="sg-c">
                <option>Option</option>
              </select>
            </div>
            <div class="checkbox"><input id="sg-d" type="checkbox" /><label for="sg-d">Checkbox</label></div>
          </form>
          <p class="mt-7"><mark class="verify">Unverified placeholder</mark> marks content awaiting confirmation.</p>
        </div>
      </section>
    `;
    return layout(
      ctx,
      { path: '/styleguide/', title: 'Design system', description: 'Design system reference.', noindex: true },
      main,
    );
  },
};

/** Preview-only register of everything awaiting confirmation. Rendered last. */
export const verificationPage: Page = {
  path: '/_verification/',
  excludeFromSitemap: true,
  render(ctx) {
    const items = register.summary();
    const owners = [...new Set(items.map((i) => i.owner))];
    const main = html`
      ${pageHead({
        title: 'Awaiting confirmation',
        lede: `${items.length} items must be confirmed before this site can be built for production. Each appears as highlighted text on the pages listed.`,
      })}
      <section class="section section--tight">
        <div class="wrap stack">
          ${owners.map(
            (owner) =>
              html`<h2 class="mt-7">${owner[0]?.toUpperCase()}${owner.slice(1)}</h2>
                <dl class="glance">
                  ${items
                    .filter((i) => i.owner === owner)
                    .map(
                      (i) =>
                        html`<div>
                          <dt>${i.label}</dt>
                          <dd>${i.pages.map((p, n) => html`${n ? ', ' : ''}<a href="${p}">${p}</a>`)}</dd>
                        </div>`,
                    )}
                </dl>`,
          )}
          <p class="mt-7"><a class="link-arrow" href="/">Back to the site ${arrow}</a></p>
        </div>
      </section>
    `;
    return layout(
      ctx,
      { path: '/_verification/', title: 'Awaiting confirmation', description: 'Verification register.', noindex: true },
      main,
    );
  },
};
