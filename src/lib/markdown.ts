// Markdown rendering for editorial content.
// Raw HTML in Markdown is escaped (editors cannot inject markup or scripts);
// the only extension is the [[verify: ...]] marker for unconfirmed facts.

import { Marked, type Tokens } from 'marked';
import { escapeHtml } from './html.ts';
import { expandInlineVerify, INLINE_VERIFY_SOURCE } from './verify.ts';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

const VERIFY_TOKEN = /@@VERIFY(\d+)@@/g;

function createMarked(): Marked {
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      html(token: Tokens.HTML | Tokens.Tag): string {
        return escapeHtml(token.text);
      },
      heading(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, token: Tokens.Heading): string {
        const text = this.parser.parseInline(token.tokens);
        // Content headings start at h2: the page template owns the h1.
        const level = Math.max(2, token.depth);
        return `<h${level} id="${slugify(text)}">${text}</h${level}>\n`;
      },
      link(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, token: Tokens.Link): string {
        const text = this.parser.parseInline(token.tokens);
        const href = token.href;
        if (/^(javascript|data|vbscript):/i.test(href)) return text;
        const external = /^https?:\/\//.test(href);
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
        const ext = external ? ' rel="noopener noreferrer" class="external"' : '';
        const note = external ? '<span class="visually-hidden"> (external site)</span>' : '';
        return `<a href="${escapeHtml(href)}"${title}${ext}>${text}${note}</a>`;
      },
    },
  });
  return marked;
}

const marked = createMarked();

export function renderMarkdown(markdown: string): string {
  // Swap verify markers for tokens so Markdown escaping leaves them alone,
  // then expand them into marked-up placeholders afterwards.
  const stash: string[] = [];
  const tokenised = markdown.replace(new RegExp(INLINE_VERIFY_SOURCE, 'g'), (m) => {
    stash.push(m);
    return `@@VERIFY${stash.length - 1}@@`;
  });
  const out = marked.parse(tokenised, { async: false });
  return out.replace(VERIFY_TOKEN, (_m, i: string) => expandInlineVerify(stash[Number(i)] ?? ''));
}

export function renderInline(markdown: string): string {
  const stash: string[] = [];
  const tokenised = markdown.replace(new RegExp(INLINE_VERIFY_SOURCE, 'g'), (m) => {
    stash.push(m);
    return `@@VERIFY${stash.length - 1}@@`;
  });
  const out = marked.parseInline(tokenised, { async: false });
  return out.replace(VERIFY_TOKEN, (_m, i: string) => expandInlineVerify(stash[Number(i)] ?? ''));
}

/** Plain text (for meta descriptions) with verify markers reduced to their placeholder. */
export function plainText(markdown: string): string {
  return markdown
    .replace(new RegExp(INLINE_VERIFY_SOURCE, 'g'), (_m, _o, _l, placeholder: string) => placeholder)
    .replace(/[*_`#>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}
