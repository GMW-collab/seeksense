// Policy pages. These are carefully structured drafts: wording marked for
// verification must be confirmed by the founder and, where indicated, a
// qualified legal, privacy or clinical adviser before launch.

import { html, type Renderable } from '../lib/html.ts';
import { layout } from '../components/layout.ts';
import { breadcrumbLd, pageHead } from '../components/parts.ts';
import { fact, factText, pending } from '../lib/verify.ts';
import { site } from '../config/site.ts';
import type { Page } from './types.ts';

function policyPage(opts: {
  path: string;
  title: string;
  description: string;
  lede: string;
  body: () => Renderable;
}): Page {
  return {
    path: opts.path,
    render(ctx) {
      const main = html`
        ${pageHead({ current: opts.title, title: opts.title, lede: opts.lede })}
        <section class="section section--tight">
          <div class="wrap narrow prose">${opts.body()}</div>
        </section>
      `;
      return layout(
        ctx,
        {
          path: opts.path,
          title: opts.title,
          description: opts.description,
          jsonLd: [breadcrumbLd(ctx, [], { label: opts.title, path: opts.path })],
        },
        main,
      );
    },
  };
}

const lastUpdated = () =>
  html`<p class="small muted">Last updated: ${fact(pending('Policy effective dates', '[date approved]', 'legal'))}</p>`;

const email = () => html`<a href="mailto:${factText(site.contact.email)}">${fact(site.contact.email)}</a>`;

export const privacyPage = policyPage({
  path: '/privacy/',
  title: 'Privacy notice',
  description:
    'How SeekSense collects, uses, protects and keeps personal information, and your rights under UK data protection law.',
  lede: 'How we handle personal information, written to be read. We collect as little as we can and protect it carefully.',
  body: () => html`
    ${lastUpdated()}
    <h2>Who we are</h2>
    <p>
      ${fact(site.company.legalName)} (“${site.name}”, “we”) is the controller of the personal information described in
      this notice. ${fact(site.company.icoRegistration)}. You can contact us about privacy at ${email()}.
    </p>

    <h2>Visiting this website</h2>
    <p>
      We do not use cookies, advertising trackers or analytics on this website. Our hosting provider keeps short-lived
      technical logs (such as IP addresses and the pages requested) to keep the service secure and working.
      ${fact(
        pending(
          'Hosting provider name, location and log retention period',
          'These logs are kept for [period] by [hosting provider], in [location].',
          'privacy',
        ),
      )}
    </p>
    <p>Our “Find support” guide runs entirely in your browser. Nothing you select there is stored or sent to us.</p>

    <h2>When you send an enquiry</h2>
    <p>
      We ask only for what we need to reply: your name, email address, optionally a phone number, the kind of service
      you are interested in and an optional short message. We ask you not to include health details in an enquiry.
    </p>
    <p>
      We use this information to respond to you, on the basis of taking steps at your request before entering into a
      contract and our legitimate interest in answering enquiries.
      ${fact(
        pending(
          'Confirm lawful bases for enquiry data, and Article 9 condition if an enquiry reveals health information',
          '',
          'legal',
        ),
      )}
    </p>
    <p>
      Enquiries are delivered to us by email through
      ${fact(
        pending(
          'Email delivery provider (processor) and data processing agreement in place',
          '[email provider], who act on our instructions under a data processing agreement',
          'privacy',
        ),
      )}.
      We do not send enquiry information to marketing or artificial intelligence services.
    </p>

    <h2>If you become a client</h2>
    <p>
      Providing therapy or assessment involves keeping confidential clinical records, which contain health information.
      We will give you a separate, detailed client privacy notice before your first appointment, explaining what we
      record, why, how long we keep it and who can see it.
      ${fact(pending('Client privacy notice, record-keeping and retention schedule approved', '', 'legal'))}
    </p>

    <h2>How long we keep information</h2>
    <p>
      ${fact(
        pending(
          'Retention period for enquiries that do not lead to an appointment',
          'If an enquiry does not lead to an appointment, we delete it within [period].',
          'privacy',
        ),
      )}
    </p>

    <h2>Sharing</h2>
    <p>
      We do not sell personal information or share it for marketing. We share it only with service providers who help us
      run the practice under contract, where the law requires it, or where we believe someone is at serious risk of harm
      (see our <a href="/safeguarding/">safeguarding page</a>).
    </p>

    <h2>Keeping information secure</h2>
    <p>
      Information sent through our website is encrypted in transit. Access to enquiries and records is limited to the
      people who need it, protected by strong authentication.
    </p>

    <h2>Your rights</h2>
    <p>
      Under UK data protection law you have rights to access your information, to have it corrected or deleted, to
      restrict or object to how it is used, and to data portability. To use any of these rights, email ${email()}. We
      will respond within one month.
    </p>
    <p>
      If you are unhappy with how we have handled your information, please tell us. You can also complain to the
      Information Commissioner’s Office at
      <a href="https://ico.org.uk/make-a-complaint/" rel="noopener noreferrer"
        >ico.org.uk<span class="visually-hidden"> (external site)</span></a
      >.
    </p>
  `,
});

export const cookiesPage = policyPage({
  path: '/cookies/',
  title: 'Cookies',
  description: 'SeekSense does not use cookies, analytics or advertising trackers on this website.',
  lede: 'This website does not use cookies.',
  body: () => html`
    <p>
      We do not set cookies, and we do not use analytics, advertising or social media tracking on this website. That is
      why you have not been asked to accept or decline cookies.
    </p>
    <p>
      If we ever decide to measure how the site is used, we will choose a privacy-respecting, cookie-free tool, describe
      it here, and ask for your consent where the law requires it.
    </p>
    <p>
      We do not embed third-party content (such as videos) that loads automatically. If we add videos in future, they
      will load only when you choose to play them.
    </p>
  `,
});

export const safeguardingPage = policyPage({
  path: '/safeguarding/',
  title: 'Safeguarding',
  description: 'How SeekSense responds when someone may be at risk of harm, and the limits of confidentiality.',
  lede: 'How we respond if we believe someone may be at risk of serious harm.',
  body: () => html`
    ${lastUpdated()}
    <h2>Our commitment</h2>
    <p>
      Confidentiality is central to our work. There are, however, rare situations where keeping something confidential
      could put someone at serious risk. In those situations our responsibility to protect people comes first.
    </p>
    <h2>When we may need to share information</h2>
    <ul>
      <li>if we believe you, or someone else, is at serious and imminent risk of harm</li>
      <li>if we learn that a child or an adult at risk is being harmed, or is likely to be</li>
      <li>where the law requires us to share information, for example under a court order</li>
    </ul>
    <p>
      Wherever it is safe and possible, we will talk to you first and involve you in any decision. We share only what is
      necessary, with the people who need to know, such as your GP, emergency services or the local authority
      safeguarding team.
    </p>
    <h2>Who is responsible</h2>
    <p>
      Our safeguarding lead is
      ${fact(
        pending(
          'Named safeguarding lead and their safeguarding training level',
          '[name], trained to [level]',
          'clinical',
        ),
      )}.
      ${fact(pending('Safeguarding policy approved and local authority contacts recorded', '', 'clinical'))}
    </p>
    <h2>Children and young people</h2>
    <p>
      Our services are for ${fact(site.service.audience)}. If you are under 18 and need support, please speak to a
      trusted adult or your GP, or call Childline free on <a href="tel:08001111">0800 1111</a>.
    </p>
    <h2>If you are worried now</h2>
    <p>Please do not wait for us. See our <a href="/urgent-help/">urgent help page</a>.</p>
  `,
});

export const complaintsPage = policyPage({
  path: '/complaints/',
  title: 'Feedback and complaints',
  description: 'How to give feedback or make a complaint about SeekSense, and where to go if you are not satisfied.',
  lede: 'We want to hear when something has not been right, so we can put it right.',
  body: () => html`
    ${lastUpdated()}
    <h2>Raising a concern with us</h2>
    <p>
      You can raise a concern or complaint by emailing ${email()}, or by telling your practitioner directly. Making a
      complaint will never affect the care you receive.
    </p>
    <h2>What happens next</h2>
    <p>
      ${fact(
        pending(
          'Complaint acknowledgement and response timescales',
          'We will acknowledge your complaint within [number] working days and aim to respond in full within [number] working days.',
          'founder',
        ),
      )}
      If we need more time, we will explain why.
    </p>
    <h2>If you are not satisfied</h2>
    <p>
      You can raise concerns about a practitioner’s conduct with their professional register:
      ${fact(
        pending(
          'Professional body / register complaints route for each practitioner',
          '[register name and complaints link]',
          'practitioner',
        ),
      )}.
    </p>
    <p>${fact(pending('CQC or other regulator complaint route, if applicable', '', 'regulatory'))}</p>
    <p>
      Concerns about how we handle personal information can also be raised with the
      <a href="https://ico.org.uk/make-a-complaint/" rel="noopener noreferrer"
        >Information Commissioner’s Office<span class="visually-hidden"> (external site)</span></a
      >.
    </p>
  `,
});

export const termsPage = policyPage({
  path: '/terms/',
  title: 'Terms and service limits',
  description: 'The terms on which SeekSense provides services and this website, including what we do not provide.',
  lede: 'The important points about how our services and this website work.',
  body: () => html`
    ${lastUpdated()}
    <h2>Not an emergency service</h2>
    <p>
      ${site.name} provides planned, appointment-based support. We do not provide crisis or out-of-hours care, and
      messages are not monitored continuously. If you need help urgently, see our
      <a href="/urgent-help/">urgent help page</a>.
    </p>
    <h2>Information on this website</h2>
    <p>
      The content of this website is general information. It is not a diagnosis, a treatment recommendation or a
      substitute for advice about your individual circumstances.
    </p>
    <h2>Who our services are for</h2>
    <p>
      Our services are for ${fact(site.service.audience)}, ${fact(site.service.area)}. We may suggest another service if
      we believe it would meet your needs better or more safely.
    </p>
    <h2>Fees, cancellations and payment</h2>
    <p>
      ${fact(
        pending(
          'Client terms: fees, payment, cancellation and refund policy',
          'Fees, payment terms and our cancellation policy are confirmed in writing before your first appointment.',
          'legal',
        ),
      )}
    </p>
    <h2>Governing law</h2>
    <p>These terms are governed by the law of ${fact(site.company.country)}.</p>
  `,
});

export const accessibilityPage = policyPage({
  path: '/accessibility/',
  title: 'Accessibility',
  description: 'Our commitment to making the SeekSense website usable by everyone, and how to tell us about problems.',
  lede: 'We want everyone to be able to use this website comfortably.',
  body: () => html`
    <p>
      This website aims to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. It is designed to work
      with screen readers, keyboard-only navigation, browser zoom up to 400% and reduced-motion settings. Text and
      background colours meet AA contrast requirements.
    </p>
    <h2>Known limitations</h2>
    <p>
      ${fact(
        pending(
          'Results of an independent accessibility audit, with any known issues',
          'We are arranging an independent accessibility review and will list any known issues here.',
          'founder',
        ),
      )}
    </p>
    <h2>Adjustments to our services</h2>
    <p>
      If you need adjustments to take part in sessions, such as extra time, written summaries or a different format,
      please tell us. We will do our best to help.
    </p>
    <h2>Reporting a problem</h2>
    <p>If something on this website does not work for you, please email ${email()} and tell us what happened.</p>
  `,
});

export const policyPages: Page[] = [
  privacyPage,
  cookiesPage,
  safeguardingPage,
  complaintsPage,
  termsPage,
  accessibilityPage,
];
