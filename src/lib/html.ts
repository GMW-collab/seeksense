// Minimal, escape-by-default HTML templating.
// Every interpolated value is escaped unless it is already a SafeHtml value
// produced by `html` or `raw`. This keeps the templates safe against
// injection without a framework.

export class SafeHtml {
  readonly value: string;
  constructor(value: string) {
    this.value = value;
  }
  toString(): string {
    return this.value;
  }
}

export type Renderable = SafeHtml | string | number | null | undefined | false | Renderable[];

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);
}

/** Mark a trusted string (e.g. rendered Markdown we control) as HTML. */
export function raw(value: string): SafeHtml {
  return new SafeHtml(value);
}

function renderValue(value: Renderable): string {
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(renderValue).join('');
  if (value instanceof SafeHtml) return value.value;
  return escapeHtml(String(value));
}

export function html(strings: TemplateStringsArray, ...values: Renderable[]): SafeHtml {
  let out = '';
  strings.forEach((chunk, i) => {
    out += chunk;
    if (i < values.length) out += renderValue(values[i] as Renderable);
  });
  return new SafeHtml(out);
}

export function render(value: Renderable): string {
  return renderValue(value);
}

/** Join class names, ignoring falsy entries. */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}
