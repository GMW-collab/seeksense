# Editorial guide

## Voice

Intelligent, compassionate, grounded and plain. Write as a thoughtful practitioner talking to an intelligent adult who may be anxious.

- Use short paragraphs and descriptive headings. Say "we" and "you".
- Do **not** promise outcomes, claim superiority, or describe anything as "evidence-based" as a marketing label. Cite sources for clinical claims instead.
- Avoid clichés: no "journey", "unlock your potential", "best self", "safe space" as a slogan, or "holistic" without meaning.
- Never invent testimonials, statistics or credentials.
- Always make clear what something is *not*: not crisis care, not a diagnosis, not individual advice.

## Adding an article

Create `src/content/articles/<url-slug>.md`:

```yaml
---
title: "Plain, specific title"          # quote it if it contains a colon
summary: One sentence for listings.
description: 150 characters or so for search results.
theme: navigating-support               # see THEMES in src/lib/content.ts
approved: false                         # true only after clinical review
published: 2026-11-01                   # set on approval
reviewed: 2026-11-01
nextReview: 2027-11-01
related: [choosing-a-therapist]
references:
  - title: Page title
    publisher: NHS
    url: https://www.nhs.uk/...
---

Body in Markdown. Use ## for section headings (the page owns the h1).
```

Raw HTML is escaped. For a fact that is not yet confirmed, write `[[verify: What needs confirming | placeholder text]]`. Add an owner if useful: `[[verify:clinical: ... | ...]]`.

## Adding or launching a service

Copy an existing file in `src/content/services/`. Keep `status: proposed` until every `[[verify]]` marker has been replaced with confirmed text and the service is genuinely taking clients. Then set `status: live`.

## Review cycle

Before launch, each article needs review by the named clinical reviewer, and again by its `nextReview` date. Check external links and the urgent help numbers (`src/config/site.ts`) at the same time.
