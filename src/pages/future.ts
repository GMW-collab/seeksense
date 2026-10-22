// Future directions (including any interest in psychedelic-assisted
// treatment). This page is NOT generated unless PUBLISH_FUTURE_SECTION=true,
// and even then it is always noindex and carries no enquiry route. It must
// not be published until the legal, regulatory and clinical requirements in
// docs/REGULATORY-NOTES.md have been met and signed off.

import { html } from '../lib/html.ts';
import { layout } from '../components/layout.ts';
import { pageHead } from '../components/parts.ts';
import { fact, pending } from '../lib/verify.ts';
import { site } from '../config/site.ts';
import type { Page } from './types.ts';

export const futurePage: Page = {
  path: '/future/',
  excludeFromSitemap: true,
  render(ctx) {
    const main = html`
      ${pageHead({
        current: 'Future directions',
        title: 'Future directions',
        lede: 'Areas we are following with interest. None of them is a service we offer.',
        extra: html`<p class="future-flag mt-6">Information only &middot; Not available</p>`,
      })}
      <section class="section section--tight">
        <div class="wrap narrow prose">
          <h2>Psychedelic-assisted therapy research</h2>
          <p>
            There is ongoing clinical research into whether certain psychedelic substances, given in controlled medical
            settings alongside psychological support, could help some people with particular mental health conditions.
            This research is at an early stage, results are mixed, and important questions about safety and suitability
            remain.
          </p>
          <p>
            In the UK, the substances being studied are controlled drugs. They are not approved treatments, and they
            cannot lawfully be supplied outside licensed research or clinical settings.
          </p>
          <h2>Our position</h2>
          <ul>
            <li>${site.name} does not offer, supply, prescribe or arrange psychedelic substances or treatment.</li>
            <li>We cannot advise whether such treatment might be suitable for anyone.</li>
            <li>
              We would only ever consider involvement, such as psychological support within an approved research study,
              where every legal, regulatory, ethical and clinical requirement had been met.
            </li>
          </ul>
          <p>
            ${fact(
              pending(
                'Legal, regulatory and clinical sign-off for publishing this page (see docs/REGULATORY-NOTES.md)',
                'This page has not been approved for publication.',
                'regulatory',
              ),
            )}
          </p>
          <p class="notice">
            We are unable to respond to individual enquiries about psychedelic treatment. If you are interested in
            taking part in research, speak to your GP or look for studies approved by an NHS research ethics committee.
          </p>
        </div>
      </section>
    `;
    return layout(
      ctx,
      {
        path: '/future/',
        title: 'Future directions',
        description: 'Areas of research SeekSense follows with interest. Not services we offer.',
        noindex: true,
      },
      main,
    );
  },
};
