// "Pending" facts: anything the founder, a practitioner or an adviser must
// confirm before launch. They render as clearly marked placeholders in
// preview builds and make production builds fail, so an unverified claim
// can never reach the live site by accident.

import { html, type SafeHtml } from './html.ts';

export interface Pending {
  readonly pending: true;
  /** What needs confirming, e.g. "Practitioner's professional registration". */
  readonly label: string;
  /** Suggested wording shown in preview builds only. */
  readonly placeholder: string;
  /** Who can confirm it. */
  readonly owner: 'founder' | 'practitioner' | 'legal' | 'clinical' | 'regulatory' | 'privacy';
}

export type Fact = string | Pending;

export function pending(label: string, placeholder: string, owner: Pending['owner'] = 'founder'): Pending {
  return { pending: true, label, placeholder, owner };
}

export function isPending(value: unknown): value is Pending {
  return typeof value === 'object' && value !== null && (value as Pending).pending === true;
}

export interface PendingUse {
  label: string;
  owner: Pending['owner'];
  page: string;
}

/** Collects every pending fact rendered during a build. */
export class VerificationRegister {
  private readonly uses: PendingUse[] = [];
  private page = '(unknown)';

  reset(): void {
    this.uses.length = 0;
    this.page = '(unknown)';
  }

  setPage(path: string): void {
    this.page = path;
  }

  record(p: Pick<Pending, 'label' | 'owner'>): void {
    this.uses.push({ label: p.label, owner: p.owner, page: this.page });
  }

  all(): PendingUse[] {
    return [...this.uses];
  }

  /** Unique items with the pages they appear on. */
  summary(): Array<{ label: string; owner: string; pages: string[] }> {
    const map = new Map<string, { label: string; owner: string; pages: Set<string> }>();
    for (const u of this.uses) {
      const key = `${u.owner}::${u.label}`;
      const entry = map.get(key) ?? { label: u.label, owner: u.owner, pages: new Set<string>() };
      entry.pages.add(u.page);
      map.set(key, entry);
    }
    return [...map.values()]
      .map((e) => ({ label: e.label, owner: e.owner, pages: [...e.pages].sort() }))
      .sort((a, b) => a.owner.localeCompare(b.owner) || a.label.localeCompare(b.label));
  }
}

export const register = new VerificationRegister();

/** Render a fact. Pending facts become a visible, labelled marker. */
export function fact(value: Fact): SafeHtml {
  if (!isPending(value)) return html`${value}`;
  register.record(value);
  return html`<mark class="verify" data-verify="${value.label}" title="To confirm before launch: ${value.label}"
    >${value.placeholder || `[To confirm: ${value.label}]`}<span class="visually-hidden">
      (to be confirmed before launch: ${value.label})</span
    ></mark
  >`;
}

/** Plain-text version of a fact, for metadata. Pending facts are recorded. */
export function factText(value: Fact): string {
  if (!isPending(value)) return value;
  register.record(value);
  return value.placeholder || `[To confirm: ${value.label}]`;
}

// Inline syntax for Markdown content: [[verify: Label | placeholder text]]
// An optional owner can be given: [[verify:clinical: Label | placeholder]]
// Placeholders may contain single-level [brackets], e.g. "£[amount]".
export const INLINE_VERIFY_SOURCE = String.raw`\[\[verify(?::(founder|practitioner|legal|clinical|regulatory|privacy))?:\s*([^|\]]+?)\s*\|\s*((?:[^\[\]]|\[[^\[\]]*\])+?)\s*\]\]`;
const INLINE = new RegExp(INLINE_VERIFY_SOURCE, 'g');

export function expandInlineVerify(markdown: string): string {
  return markdown.replace(INLINE, (_m, owner: Pending['owner'] | undefined, label: string, placeholder: string) =>
    fact(pending(label, placeholder, owner ?? 'founder')).value.replace(/\n\s*/g, ' '),
  );
}

export function hasInlineVerify(text: string): boolean {
  INLINE.lastIndex = 0;
  return INLINE.test(text);
}
