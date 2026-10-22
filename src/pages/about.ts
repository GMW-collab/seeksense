import { html } from '../lib/html.ts';
import { layout } from '../components/layout.ts';
import { breadcrumbLd, nextStep, pageHead } from '../components/parts.ts';
import { fact, pending } from '../lib/verify.ts';
import { site } from '../config/site.ts';
import type { Page } from './types.ts';

export const aboutPage: Page = {
  path: '/about/',
  render(ctx) {
    const p = site.practitioner;
    const main = html`
      ${pageHead({
        current: 'About',
        eyebrow: 'About',
        title: 'The people behind SeekSense',
        lede: 'Who you will be working with, how they are trained and registered, and how the practice is run.',
      })}

      <section class="section" aria-labelledby="practitioner">
        <div class="wrap split">
          <div>
            <div class="portrait">
              <img src="/art/terrain-small.svg" alt="" width="320" height="400" />
              <span class="portrait__label"
                >${fact(
                  pending(
                    'Professional portrait photograph (natural light, not a stock image)',
                    'Photograph to follow',
                    'founder',
                  ),
                )}</span
              >
            </div>
          </div>
          <div>
            <span class="eyebrow eyebrow--rule">Founder and lead practitioner</span>
            <h2 id="practitioner">${fact(p.name)}</h2>
            <p class="lede">${fact(p.role)}</p>
            <div class="prose">
              <p>
                ${fact(
                  pending(
                    'Practitioner biography in their own words (background, why they do this work, areas of interest)',
                    'A short, personal introduction in the practitioner’s own words: their background, what drew them to this work and the kinds of difficulty they most often help with.',
                    'practitioner',
                  ),
                )}
              </p>
              <p>
                ${fact(
                  pending(
                    'Practitioner’s description of their therapeutic approach',
                    'How they work in sessions, and the approaches they draw on, described in plain English.',
                    'practitioner',
                  ),
                )}
              </p>
            </div>
            <h3 class="mt-7">Training, registration and accountability</h3>
            <dl class="glance">
              <div>
                <dt>Registration</dt>
                <dd>${fact(p.registration)}</dd>
              </div>
              <div>
                <dt>Qualifications</dt>
                <dd>${fact(p.qualifications)}</dd>
              </div>
              <div>
                <dt>Areas of experience</dt>
                <dd>${fact(pending('Areas of professional experience', '[Areas of experience]', 'practitioner'))}</dd>
              </div>
              <div>
                <dt>Memberships</dt>
                <dd>${fact(pending('Professional memberships', '[Professional memberships]', 'practitioner'))}</dd>
              </div>
              <div>
                <dt>Supervision</dt>
                <dd>${fact(p.supervision)}</dd>
              </div>
              <div>
                <dt>Insurance</dt>
                <dd>${fact(p.insurance)}</dd>
              </div>
            </dl>
            <p class="small muted mt-6">
              You can check a practitioner’s registration on their register’s public website. We encourage you to do so.
            </p>
          </div>
        </div>
      </section>

      <section class="section section--band" aria-labelledby="company">
        <div class="wrap split">
          <div><h2 id="company">The practice</h2></div>
          <div class="prose">
            <p>
              ${site.name} is the trading name of ${fact(site.company.legalName)}, a company registered in
              ${fact(site.company.country)} (${fact(site.company.number)}). We are registered with the Information
              Commissioner’s Office (${fact(site.company.icoRegistration)}).
            </p>
            <p>${fact(site.service.cqc)}.</p>
            <p>
              We started ${site.name} to offer mental health support that is unhurried, professionally grounded and
              honest about its limits. We are a small practice, and we intend to stay careful as we grow.
            </p>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="others">
        <div class="wrap split">
          <div><h2 id="others">Working with other professionals</h2></div>
          <div class="prose">
            <p>
              Over time we may work alongside other appropriately qualified and registered practitioners. Anyone who
              provides a service under the ${site.name} name will be listed here, with their registration, before they
              see anyone.
            </p>
            <p>We do not currently have formal partnerships with other organisations.</p>
          </div>
        </div>
      </section>

      ${nextStep({
        title: 'Questions about training or approach?',
        body: 'Ask anything that would help you decide. It is a normal, sensible thing to do.',
        href: '/contact/',
        label: 'Get in touch',
      })}
    `;
    return layout(
      ctx,
      {
        path: '/about/',
        section: 'about',
        title: 'About',
        description:
          'Meet the SeekSense practitioner: training, professional registration, supervision and how the practice is run.',
        jsonLd: [breadcrumbLd(ctx, [], { label: 'About', path: '/about/' })],
      },
      main,
    );
  },
};
