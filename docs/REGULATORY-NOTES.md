# Regulatory and legal notes (UK)

These notes identify issues to put to qualified advisers. **They are not legal or regulatory advice.** Sources were checked on 22 October 2026. Items marked **Confirm** need sign-off from a solicitor, data protection adviser, clinical lead or the relevant regulator.

## 1. CQC registration: depends on who delivers the service

Under the Health and Social Care Act 2008 (Regulated Activities) Regulations 2014, Schedule 1, paragraph 4, *treatment of disease, disorder or injury* is a regulated activity when it is provided by, or under the supervision of, a **"health care professional"** (or a team that includes one), or a **social worker** where the treatment is for a mental disorder. ([legislation.gov.uk](https://www.legislation.gov.uk/uksi/2014/2936/schedule/1/paragraph/4))

The paragraph 4 definition of "health care professional" lists, among others, medical practitioners, nurses, midwives and paramedics. **Practitioner psychologists are not listed**, and neither are counsellors or psychotherapists.

- If services are delivered only by counsellors, psychotherapists or practitioner psychologists, talking therapy may fall outside CQC scope. **Confirm.**
- If the founder or any team member is a doctor, nurse, social worker or other listed professional, registration is likely to be needed. **Confirm before any service starts.** Providing a regulated activity without registration is an offence.
- The company's registered SIC code is 86220 (*specialist medical practice activities*). That classification does not decide CQC scope, but it suggests a medical model of service. Make sure it matches how services will actually be delivered. **Confirm.**
- Assessment may engage other regulated activities, such as *diagnostic and screening procedures*, depending on what it involves. **Confirm** the assessment model against CQC's scope guidance.
- The website shows the CQC position as a pending fact (`site.service.cqc`). Replace it with either the registration details or a plain statement that registration is not required, once confirmed.

## 2. Professional titles and registers

- HCPC protects nine psychologist titles, including *practitioner psychologist*, *registered psychologist*, *clinical psychologist* and *counselling psychologist*. The plain title *psychologist* is not protected. Neither are *counsellor* and *psychotherapist*. ([HCPC](https://www.hcpc-uk.org/news-and-events/blog/2023/understanding-the-regulation-of-psychologists/))
- The NHS advises people to check that a private therapist belongs to a Professional Standards Authority accredited register. ([NHS](https://www.nhs.uk/tests-and-treatments/talking-therapies/))
- **Action:** use a protected title on the site only if the practitioner holds that registration. Publish register names and numbers so visitors can check them.

## 3. Data protection (UK GDPR, Data Protection Act 2018, PECR)

- **ICO fee:** organisations processing personal data usually need to pay the data protection fee. The ICO number is a pending fact shown in the footer. **Confirm.**
- **Special category data:** clinical records, and any enquiry that reveals health information, involve health data. That requires an Article 9 condition in addition to an Article 6 lawful basis. The usual route for care is Article 9(2)(h), with the DPA 2018 Schedule 1 health or social care condition. **Confirm** with a data protection adviser.
- **Data minimisation, built in:**
  - The enquiry form collects only name, email, an optional phone number, a service category and an optional short message, and asks people not to include health details.
  - There are no cookies, analytics or third-party embeds.
  - The "Find support" guide runs entirely in the browser.
  - Enquiry content is never logged, never put in URLs, and never sent to AI or marketing tools.
  - Email notifications use a generic subject line.
- **Processors:** the hosting provider and the email delivery provider are processors. Data processing agreements, UK or adequate data residency, and naming them in the privacy notice are all required before enquiries are switched on.
- **DPIA:** a data protection impact assessment is advisable before clinical record-keeping or online booking starts.
- **Retention:** set and publish retention periods for enquiries and for clinical records.
- **Cookies (PECR):** no consent banner is needed while the site sets no cookies. If analytics are added later, check current ICO guidance first. The Data (Use and Access) Act 2025 changed some consent rules, so **confirm** what applies at that point.

## 4. Advertising standards

- The CAP Code (enforced by the ASA) requires objective claims, especially health claims, to be substantiated. The copy avoids efficacy claims, outcome promises, testimonials and "evidence-based" as a marketing label. Automated tests guard against some of these phrases.
- Never publish testimonials or reviews unless they are genuine, consented and representative.

## 5. Psychedelic-assisted treatment (future section)

- Substances such as psilocybin are controlled drugs under the Misuse of Drugs Act 1971. They are listed in Schedule 1 of the Misuse of Drugs Regulations 2001, so research use generally requires a Home Office licence. They are not licensed medicines in the UK, and prescription-only medicines may not be advertised to the public. **Confirm** the current position with a regulatory solicitor, because rescheduling has been under discussion.
- The site's `/future/` page is **not built** unless `PUBLISH_FUTURE_SECTION=true`. Even then it:
  - is set to noindex and left out of the sitemap
  - is not linked from anywhere
  - has no enquiry route
  - states plainly that nothing is offered
  - carries a pending sign-off item that blocks production builds.
- Any future research involvement would need sponsor arrangements, ethics approval (for example from an NHS Research Ethics Committee), clinician oversight and informed-consent processes, all in place before any public-facing content changes.

## 6. Safeguarding

- Name a safeguarding lead, record their training level, adopt a written policy and record local authority safeguarding contacts. All of these are pending facts on `/safeguarding/`.
- Professional bodies set safeguarding expectations for their members. Align the policy with the practitioner's register.

## 7. Crisis signposting

The urgent help numbers were checked against NHS and national sources on 22 October 2026:

- 999
- NHS 111 option 2 (England, Scotland and Wales)
- Lifeline 0808 808 8000 (Northern Ireland)
- Samaritans 116 123
- SHOUT 85258
- Childline 0800 1111 (under 19s)

They are kept in one place, `src/config/site.ts`. **Re-check at least every six months**, and update the `checked` date.
