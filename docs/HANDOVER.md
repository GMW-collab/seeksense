# SeekSense website: handover

_Status, 22 October 2026: built and tested; **not ready to launch** until the verification items are confirmed. Nothing has been deployed, no DNS has been changed, and no paid services have been set up._

## 1. What has been built

- A complete website: 33 pages in the preview build. These are the core pages, 5 service pages, 5 draft articles with theme pages, 6 policy pages, enquiry status pages, a custom 404 page and preview-only tools.
- A design system: tokens, components, a self-hosted typeface pair and original generated artwork. It can be viewed at `/styleguide/` in preview builds.
- A **verification system.** Every unconfirmed fact (name, registration, fees, company details and so on) is a *pending* value. In preview it renders as a highlighted placeholder, and `/_verification/` lists them all. **Production builds fail while any pending value remains.**
- **Service and article gating.** Services marked `status: proposed` and articles without `approved: true` appear only in preview builds.
- An enquiry server with:
  - server-side validation
  - a honeypot and a timing check
  - same-origin enforcement, body-size limits and rate limiting
  - strict security headers, including a CSP with no third-party origins
  - a mail-provider integration boundary
  - working fallbacks when JavaScript is off or no provider is configured.
- A future-services area (`/future/`) that is off by default and cannot be indexed.
- Automated checks: type checking, ESLint, Prettier, 37 unit and integration tests, and 8 browser checks (Playwright).

## 2. Page structure

```
/                         Home: what, who, where to start
/approach/                Philosophy, principles, limits, safety
/services/                Index
  /initial-consultation/  ┐
  /talking-therapy/       │ Preview only until status: live
  /mental-health-assessment/
  /signposting/           │
  /psychoeducation/       ┘
/find-support/            Informational guide (not an assessment)
/resources/               Articles index (+ /resources/themes/<theme>/)
  /<article>/             Preview only until approved: true
/about/                   Practitioner profile and the practice
/contact/                 Enquiry form (+ /received/ /problem/ /unavailable/)
/urgent-help/             Crisis signposting (linked from every page header)
/privacy/ /cookies/ /safeguarding/ /complaints/ /terms/ /accessibility/
/404.html
/future/                  Only with PUBLISH_FUTURE_SECTION=true; always noindex
/styleguide/ /_verification/   Preview builds only
```

## 3. Key decisions

| Decision | Why |
| --- | --- |
| Static pages plus a tiny Node server, no framework or CMS | Fastest pages, best SEO and the smallest attack surface. The content is small and changes rarely. A CMS can come later (see section 8). |
| Content in Markdown files with validated front matter | One file per service or article. Edits are reviewable in Git, and the build fails with a clear message if a field is missing. |
| No cookies, analytics or embeds | Privacy by design for a mental health audience. No consent banner is needed. |
| "Urgent help" in every header, and a help strip on every page | People in distress should never have to hunt for it. |
| Find support is a client-side guide, not a questionnaire | Avoids implying assessment or diagnosis. Nothing is stored or sent. |
| Minimal enquiry form | No health details are requested. A generic email subject keeps inbox previews free of sensitive content. |
| Verification gate | Unverified claims about credentials, prices or availability cannot reach production by accident. |
| Newsreader + Hanken Grotesk, ivory, forest, sage and clay; contour-line motif | Editorial, warm and calm without wellness clichés. The contour lines stand for "reading difficult ground". All text colour pairs meet WCAG AA. |

## 4. Environment variables and accounts

See `.env.example`.

| Variable | Needed for |
| --- | --- |
| `SITE_ENV` | `production` for a launch build |
| `SITE_URL` | Canonical domain (default `https://seeksense.co`) |
| `PUBLISH_FUTURE_SECTION` | Keep `false` |
| `BOOKING_URL` | Optional link to an approved scheduling provider |
| `MAIL_PROVIDER`, `POSTMARK_SERVER_TOKEN`, `ENQUIRY_FROM`, `ENQUIRY_TO` | Turn on enquiry delivery (Postmark is implemented; others can be added in `server/mailer.ts`) |
| `PORT`, `TRUST_PROXY` | Server runtime |

**Accounts needed:**

- A hosting provider that runs Node 22, ideally with UK or EU hosting
- A transactional email provider, with a data processing agreement and a verified sending domain
- A domain/DNS provider (existing).

**Secrets:** keep them in the host's secret manager only. `.env` is ignored by Git.

## 5. Approvals outstanding

Run `npm run launch-check` for the live list. It currently shows 32 items in production scope, plus content inside the proposed services and draft articles. In summary:

- **Founder:** contact email, reply times, service area and format, portrait, complaint timescales, accessibility audit.
- **Practitioner:** name, title, registration, qualifications, memberships, experience, biography, approach, insurance; per-service details (length, fee, modality).
- **Clinical:** audience/age range, supervision, safeguarding lead and policy, assessment scope (including whether a diagnosis can be given), article clinical review and approval.
- **Legal and privacy:** lawful bases and Article 9 condition, client privacy notice and retention schedule, client terms, processors and DPAs, hosting logs, ICO registration, policy dates.
- **Regulatory:** CQC position (see `docs/REGULATORY-NOTES.md`), complaint routes.

**How to confirm an item:** replace `pending('…', '…')` in `src/config/site.ts` with the confirmed text, or replace a `[[verify: … | …]]` marker in a content file with the confirmed text. Then set a service to `status: live`, or an article to `approved: true` with `published` and `reviewed` dates.

## 6. Running and deploying

```bash
npm install                 # needs registry access
npm run dev                 # preview at http://localhost:4321 (enquiries accepted, not sent)
npm run check               # typecheck + lint + tests
npm run test:browser        # Playwright browser checks
npm run launch-check        # what still blocks production
npm run build:production    # fails until launch-check passes
npm start                   # serve ./dist with the enquiry endpoint
```

**Deployment (recommended):** build in CI with `SITE_ENV=production`, then run `node server/server.ts` behind the platform's HTTPS. Static-only hosts can serve `dist/`, and `dist/_headers` carries the security headers for Netlify or Cloudflare Pages. The `/api/enquiry` endpoint then needs the Node server or an equivalent function, or the contact page should fall back to email (the form already degrades to `/contact/unavailable/`).

**Before switching DNS:** deploy to a staging URL, run the browser checks against it, and check that HTTPS, headers and the enquiry flow all work end to end with a real test inbox.

**Rollback:** builds are immutable folders. Keep the previous `dist/` (or the previous release on the host) and switch back. If seeksense.co currently serves another site, record its URLs first and add redirects for any that matter.

## 7. Content needing founder or practitioner input

- Practitioner biography and approach, in their own words. These are the most important pieces of copy on the site.
- A real portrait photograph (natural light, not stock).
- Service details: length, fee, format, modality and assessment scope.
- Clinical review of the five draft articles. Then set `approved: true` with dates and name the reviewer.

## 8. Recommended next improvements (in priority order)

1. Confirm the verification items and the CQC position, then launch with only the services that are genuinely live.
2. Set up enquiry email (DPA in place) and test it end to end.
3. Commission an independent WCAG 2.2 AA audit, including screen reader testing, and update `/accessibility/`.
4. Add an approved online booking provider through `BOOKING_URL`, once its data protection terms have been reviewed.
5. Add a Git-based CMS (for example Decap or Tina) over the existing Markdown if non-technical editing becomes frequent. No content model change is needed.
6. Grow the resources section with a publication and review cycle (each article has a `nextReview` date).
7. Consider cookie-free analytics only if there is a clear question to answer. Update `/cookies/` first.
8. Add more practitioner profiles as the practice grows. Each should have a verified registration before going live.
