# Design system

A live reference is at `/styleguide/` in preview builds. The source is `src/styles/main.css` (tokens are on `:root`).

## Principles

The design is editorial rather than app-like. It relies on generous whitespace, hairline rules instead of card stacks, and a serif for voice with a humanist sans for clarity. Decoration has to mean something: the contour-line motif stands for reading difficult ground. There is a single accent colour, used sparingly.

## Colour (contrast measured against ivory #f5f1e8)

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| `--ink` | #1c2620 | Body text | 13.8:1 |
| `--forest` | #2d4a3b | Links, buttons | 8.6:1 |
| `--stone-600` | #5e5647 | Muted text | 6.4:1 |
| `--clay` | #a2532f | Accent, focus ring | 4.9:1 |
| `--danger` | #a23b2a | Errors | 5.8:1 |
| `--sage` | #8fa593 | Decorative only | 2.3:1 (never for text) |
| `--sage-on-dark` on `--forest-900` | #c9d4c6 / #1a2e24 | Footer text | 9.4:1 |

## Type

- **Newsreader** (variable, with optical size): headings, and article body text at about 1.12× size.
- **Hanken Grotesk**: interface and general body text.
- Fluid scale `--step--1` to `--step-5`, using `clamp()`. Measure is 66ch.

## Space and layout

- Space scale `--space-1` to `--space-9`, on a 4px base. `--gutter` is fluid.
- Max width is 76rem.
- `.split` gives a 5/7 grid on desktop and a single column on mobile.

## Components

These live in `main.css`:

- Buttons: primary and quiet
- `.link-arrow`
- `.pathways` (home starting points)
- `.principles` (numbered columns)
- `.steps`
- `.service-list`
- `.glance` (definition list)
- `.callout` (default, clay, quiet)
- `.status`
- `.help-lines` and `.emergency`
- Article list, article layout and table of contents
- Form fields, with hint, error, success and error-summary states
- `.choice` (large radio options)
- Header with mobile menu (works without JavaScript via `:target`)
- Footer
- `mark.verify`, for preview placeholders

## Interaction and accessibility

- Visible 3px clay focus ring on everything.
- Skip link.
- Every touch target is at least 44px.
- `prefers-reduced-motion` and `forced-colors` are supported.
- Error summaries take focus and link to their fields.
- Inline errors are tied to fields with `aria-describedby` and `aria-invalid`.
- The status regions for the support guide and the form are announced to screen readers.
