// Single source of truth for business facts and settings.
// Anything wrapped in pending() is NOT verified and blocks a production build.
// To verify a fact, replace pending(...) with the confirmed plain string.

import { pending, type Fact } from '../lib/verify.ts';

export const site = {
  name: 'SeekSense',
  tagline: 'Help to make sense of what you are going through',
  defaultDescription:
    'SeekSense offers talking therapy, mental health assessment and help finding the right support. Calm, unhurried and professionally grounded.',
  locale: 'en_GB',
  lang: 'en-GB',

  company: {
    // Confirmed by the founder, 22 Oct 2026, and matched to the Companies House
    // register: https://find-and-update.company-information.service.gov.uk/company/14114057
    legalName: 'SeekSense Ltd' as Fact,
    number: 'company number 14114057' as Fact,
    registeredOffice: '128 City Road, London, EC1V 2NX' as Fact,
    country: 'England and Wales' as Fact,
    // UK trade mark UK00003372433. The UKIPO register shows the owner as SeekSense Ltd (14114057),
    // as confirmed by the founder on 22 Oct 2026. Add "registered" and the ® symbol only once the
    // register shows the status as Registered.
    trademarkNotice: 'Seek Sense and the ear logo are trade marks of SeekSense Ltd.' as Fact,
    icoRegistration: pending('ICO data protection fee registration number', 'ICO reg. Z0000000', 'privacy') as Fact,
  },

  contact: {
    email: pending('Enquiries email address', 'hello@seeksense.co', 'founder') as Fact,
    /** Leave null if there is no staffed phone line. Never list an unmonitored number. */
    phone: null as Fact | null,
    responseTime: pending(
      'Typical reply time for enquiries',
      'We aim to reply within two working days',
      'founder',
    ) as Fact,
    hours: pending(
      'When enquiries are read',
      'Enquiries are read Monday to Friday, during office hours',
      'founder',
    ) as Fact,
  },

  service: {
    audience: pending('Who services are for (age range)', 'adults aged 18 and over', 'clinical') as Fact,
    area: pending(
      'Where services are offered',
      'across the UK online, and in person in [town or city]',
      'founder',
    ) as Fact,
    formats: pending('How sessions take place', 'online by secure video, or in person', 'founder') as Fact,
    cqc: pending(
      'CQC registration position (registered, or confirmed not required)',
      'Our regulatory position is being confirmed',
      'regulatory',
    ) as Fact,
  },

  practitioner: {
    name: pending('Founder / lead practitioner name', '[Practitioner name]', 'practitioner') as Fact,
    role: pending(
      'Professional title (protected titles only if registered)',
      '[Professional title]',
      'practitioner',
    ) as Fact,
    registration: pending(
      'Professional registration body and number (e.g. HCPC, or a PSA Accredited Register such as BACP or UKCP)',
      '[Registration body and number]',
      'practitioner',
    ) as Fact,
    qualifications: pending('Qualifications', '[Relevant qualifications]', 'practitioner') as Fact,
    insurance: pending(
      'Professional indemnity insurance in place',
      'Holds professional indemnity insurance',
      'practitioner',
    ) as Fact,
    supervision: pending(
      'Clinical supervision arrangement',
      'Receives regular clinical supervision',
      'clinical',
    ) as Fact,
  },

  social: {
    /** Only list accounts that exist and are approved. */
    links: [] as Array<{ label: string; href: string }>,
  },
} as const;

// UK urgent help. Checked against NHS and national sources on 22 October 2026:
// - NHS 111 option 2 (England, Scotland, Wales) and Lifeline NI: hubofhope.co.uk/need-help-now
// - Samaritans 116 123 and SHOUT 85258: Tees, Esk and Wear Valleys NHS FT crisis advice page
// Re-check these at least every six months (see docs/HANDOVER.md).
export const urgentHelp = {
  checked: '2026-10-22',
  emergency: { label: 'If a life is at risk now', action: 'Call 999 or go to A&E', tel: '999' },
  lines: [
    {
      name: 'NHS 111, option 2',
      detail: 'Urgent mental health help in England, Scotland and Wales, 24 hours a day.',
      action: 'Call 111 and choose option 2',
      tel: '111',
    },
    {
      name: 'Lifeline (Northern Ireland)',
      detail: 'Crisis support in Northern Ireland, 24 hours a day.',
      action: 'Call 0808 808 8000',
      tel: '08088088000',
    },
    {
      name: 'Samaritans',
      detail: 'Someone to talk to, any time, day or night. Free to call.',
      action: 'Call 116 123',
      tel: '116123',
    },
    {
      name: 'SHOUT',
      detail: 'Free, confidential text support, 24 hours a day.',
      action: 'Text SHOUT to 85258',
      sms: '85258',
      smsBody: 'SHOUT',
    },
  ],
} as const;
