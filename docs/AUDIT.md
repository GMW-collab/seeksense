# Phase 1 audit

_22 October 2026_

## What could be inspected

| Source | Result |
| --- | --- |
| Live site, https://seeksense.co | **Not reachable from the build environment.** The site refuses automated access (robots rules), and the environment's network policy blocks the domain. Nothing about its current content, framework or hosting could be confirmed. |
| GitHub | The connected account has two repositories, `GMW-collab/harkhowal-site` and `GMW-collab/SpiritualKnowledge`. **Neither is SeekSense.** No SeekSense repository was found. |
| Search engines | No indexed pages for seeksense.co. Results for similar names belong to unrelated companies (See.Sense, a cycling-technology firm in Northern Ireland, and SearchSense AI). |
| Companies House (via search) | No match found for a "SeekSense" limited company. It may be registered under a different name, or too recently to be indexed. |
| Supplied material | The build brief only. It describes the intended services but gives no verified facts about the founder, registrations, location, prices or availability. |

## What this means

- **Retained:** nothing. There was no inspectable code, content or infrastructure to keep.
- **Replaced:** the whole site has been built new, in a fresh repository-ready project (`seeksense-website`).
- **Unknown, and blocking launch:** every business fact. Company details, practitioner identity and registration, services actually available, fees, location, response times and regulatory position. These are all modelled as *pending* facts (see `docs/HANDOVER.md`) and the production build refuses to run until each is confirmed.

## Environment constraints that shaped the build

- The npm and PyPI registries were blocked, so no new packages could be installed. The site is therefore built as a **dependency-light TypeScript static generator** (Node 22 runs TypeScript directly) with a **zero-dependency Node server**. Its only build-time libraries are `marked` and `js-yaml`. This turned out to suit a mental health site well: a very small attack and supply-chain surface, nothing to patch at runtime and fast pages.
- Fonts (Newsreader, Hanken Grotesk; SIL Open Font Licence) were obtained from the Google Fonts GitHub repository and **self-hosted**, so no visitor data goes to Google.
- No stock imagery could be licensed. The contour-line artwork is generated from code (`scripts/generate-art.mjs`), so there is no copyright risk. Commissioned photography is recommended later (see the handover).

## Questions for the founder

1. Is there an existing repository or hosting account for seeksense.co (for example Wix, Squarespace or WordPress)? If so, what should happen to its content and URLs?
2. What is the registered company name and number?
3. Who is the practitioner, what is their profession, and which register are they on?
4. Which services will be available at launch, and at what price?
