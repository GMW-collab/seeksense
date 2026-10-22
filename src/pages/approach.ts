import { html } from '../lib/html.ts';
import { layout } from '../components/layout.ts';
import { breadcrumbLd, nextStep, pageHead } from '../components/parts.ts';
import { fact } from '../lib/verify.ts';
import { site } from '../config/site.ts';
import type { Page } from './types.ts';

export const approachPage: Page = {
  path: '/approach/',
  render(ctx) {
    const main = html`
      ${pageHead({
        current: 'Our approach',
        eyebrow: 'Our approach',
        title: 'Understanding comes before advice.',
        lede: 'How we think about mental health, how we work with people, and the limits we hold ourselves to.',
      })}

      <section class="section" aria-labelledby="believe">
        <div class="wrap split">
          <div><h2 id="believe">What we believe</h2></div>
          <div class="prose">
            <p>
              Difficult feelings usually make sense once you understand the circumstances around them. Low mood,
              anxiety, anger and exhaustion are often reasonable responses to what someone has lived through, even when
              they have become hard to manage.
            </p>
            <p>
              So we try not to reduce people to a diagnosis or a questionnaire score. Those things can be useful, and
              sometimes they are essential. But they are one part of a wider picture that includes your history, your
              relationships, your work, your body and what matters to you.
            </p>
            <p>
              No single therapy or theory suits everyone. Our job is to understand your situation well enough to offer
              something that fits, and to tell you plainly when we think someone else could help more.
            </p>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="principles">
        <div class="wrap">
          <span class="eyebrow eyebrow--rule">Principles</span>
          <h2 id="principles">Six commitments that shape our work</h2>
          <ol class="principles principles--3 mt-7">
            <li>
              <h3>Listening first</h3>
              <p>We take time to understand what is going on before offering any view on it.</p>
            </li>
            <li>
              <h3>Working together</h3>
              <p>You are the expert on your own life. We bring professional knowledge and work it out with you.</p>
            </li>
            <li>
              <h3>Informed choice</h3>
              <p>We explain what we offer, what it costs and what to expect, so your decisions are your own.</p>
            </li>
            <li>
              <h3>Clear boundaries</h3>
              <p>
                Confidentiality, its limits and the shape of our professional relationship are explained from the start.
              </p>
            </li>
            <li>
              <h3>Evidence, used with judgement</h3>
              <p>
                We draw on established psychological approaches and research, applied thoughtfully to the person in
                front of us.
              </p>
            </li>
            <li>
              <h3>Knowing our limits</h3>
              <p>
                Some needs are better met elsewhere. When that is true, we say so and help you find the right place.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section class="section section--band" aria-labelledby="wont">
        <div class="wrap split split--even">
          <div>
            <h2 id="wont">What we will not do</h2>
            <p class="lede">Trust depends as much on what a service refuses to do as on what it offers.</p>
          </div>
          <ul class="not-list">
            <li>Promise particular outcomes, or suggest that any approach works for everyone.</li>
            <li>Keep you in therapy for longer than is useful to you.</li>
            <li>Diagnose, or advise on treatment, through this website.</li>
            <li>
              Present ourselves as a crisis service. We are not one, and we will always point you to those who are.
            </li>
            <li>
              Share what you tell us without your agreement, except in the rare situations set out in our privacy
              notice.
            </li>
          </ul>
        </div>
      </section>

      <section class="section" aria-labelledby="safety">
        <div class="wrap split">
          <div><h2 id="safety">How we keep the work safe</h2></div>
          <div class="prose">
            <p>
              <strong>Registration and accountability.</strong> ${fact(site.practitioner.registration)}. You can check
              this independently, and you can raise concerns with the register as well as with us.
            </p>
            <p>
              <strong>Supervision.</strong> ${fact(site.practitioner.supervision)}, as good professional practice
              requires.
            </p>
            <p>
              <strong>Safeguarding.</strong> We have a clear process for situations where someone may be at risk. It is
              described on our <a href="/safeguarding/">safeguarding page</a>.
            </p>
            <p><strong>Regulation.</strong> ${fact(site.service.cqc)}.</p>
          </div>
        </div>
      </section>

      ${nextStep({
        title: 'See whether we are the right fit',
        body: 'An initial consultation is a low-pressure way to meet, ask questions and hear our honest view of what might help.',
        href: '/contact/',
        label: 'Make an enquiry',
        secondary: { href: '/services/', label: 'View services' },
      })}
    `;
    return layout(
      ctx,
      {
        path: '/approach/',
        section: 'approach',
        title: 'Our approach',
        description:
          'How SeekSense approaches mental health support: listening first, informed choice, clear boundaries and evidence used with judgement.',
        jsonLd: [breadcrumbLd(ctx, [], { label: 'Our approach', path: '/approach/' })],
      },
      main,
    );
  },
};
