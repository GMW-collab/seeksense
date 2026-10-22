// Loads and validates editorial content (Markdown with YAML front matter).
// Adding a service or article is a matter of adding one .md file; the build
// fails with a clear message if required fields are missing.

import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import yaml from 'js-yaml';
import { renderMarkdown } from './markdown.ts';

const CONTENT_DIR = new URL('../content/', import.meta.url).pathname;

export type ServiceStatus = 'live' | 'proposed';
export type ServiceKind = 'consultation' | 'therapy' | 'assessment' | 'signposting' | 'education';

export interface Service {
  slug: string;
  title: string;
  shortTitle: string;
  order: number;
  kind: ServiceKind;
  status: ServiceStatus;
  summary: string;
  description: string;
  suitableFor: string[];
  notProvided: string[];
  atAGlance: Array<{ label: string; value: string }>;
  related: string[];
  bodyMarkdown: string;
  bodyHtml: () => string;
}

export interface Reference {
  title: string;
  publisher: string;
  url: string;
}

export interface Theme {
  slug: string;
  title: string;
  description: string;
}

export const THEMES: Theme[] = [
  {
    slug: 'navigating-support',
    title: 'Navigating support',
    description: 'How mental health support is organised in the UK, and how to find what fits.',
  },
  {
    slug: 'understanding-assessment',
    title: 'Understanding assessment',
    description: 'What an assessment is, what it can tell you, and what it cannot.',
  },
  {
    slug: 'psychological-approaches',
    title: 'Psychological approaches',
    description: 'Plain explanations of the main kinds of talking therapy.',
  },
  {
    slug: 'emotional-wellbeing',
    title: 'Emotional wellbeing',
    description: 'Thinking about difficult feelings, and looking after yourself day to day.',
  },
  {
    slug: 'relationships',
    title: 'Relationships',
    description: 'How the people around us shape, and are shaped by, our wellbeing.',
  },
];

export interface Article {
  slug: string;
  title: string;
  summary: string;
  description: string;
  theme: string;
  /** Approved for publication by the responsible practitioner. */
  approved: boolean;
  published: string | null;
  reviewed: string | null;
  nextReview: string | null;
  references: Reference[];
  related: string[];
  readingMinutes: number;
  bodyMarkdown: string;
  bodyHtml: () => string;
}

class ContentError extends Error {}

function fail(file: string, message: string): never {
  throw new ContentError(`${file}: ${message}`);
}

function parseFile(path: string): { data: Record<string, unknown>; body: string } {
  const text = readFileSync(path, 'utf8');
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!match) fail(path, 'missing front matter');
  const data = yaml.safeLoad(match[1] ?? '');
  if (typeof data !== 'object' || data === null) fail(path, 'front matter must be a mapping');
  return { data: data as Record<string, unknown>, body: match[2] ?? '' };
}

function str(file: string, data: Record<string, unknown>, key: string, optional = false): string {
  const v = data[key];
  if (v === undefined || v === null || v === '') {
    if (optional) return '';
    fail(file, `"${key}" is required`);
  }
  if (typeof v !== 'string') fail(file, `"${key}" must be text`);
  return v.trim();
}

function list(file: string, data: Record<string, unknown>, key: string): string[] {
  const v = data[key];
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) fail(file, `"${key}" must be a list of text`);
  return v as string[];
}

function date(file: string, data: Record<string, unknown>, key: string): string | null {
  const v = data[key];
  if (v === undefined || v === null || v === '') return null;
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) fail(file, `"${key}" must be a date like 2026-01-31`);
  return s;
}

function mdFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort()
    .map((f) => join(dir, f));
}

const KINDS: ServiceKind[] = ['consultation', 'therapy', 'assessment', 'signposting', 'education'];

export function loadServices(dir = join(CONTENT_DIR, 'services')): Service[] {
  const services = mdFiles(dir).map((file): Service => {
    const { data, body } = parseFile(file);
    const slug = basename(file, '.md');
    const kind = str(file, data, 'kind') as ServiceKind;
    if (!KINDS.includes(kind)) fail(file, `"kind" must be one of ${KINDS.join(', ')}`);
    const status = str(file, data, 'status') as ServiceStatus;
    if (status !== 'live' && status !== 'proposed') fail(file, '"status" must be "live" or "proposed"');
    const glance = data.atAGlance;
    if (!Array.isArray(glance)) fail(file, '"atAGlance" must be a list');
    const atAGlance = glance.map((row) => {
      if (typeof row !== 'object' || row === null) fail(file, 'each "atAGlance" row needs label and value');
      const r = row as Record<string, unknown>;
      return { label: str(file, r, 'label'), value: str(file, r, 'value') };
    });
    const order = Number(data.order ?? 99);
    return {
      slug,
      title: str(file, data, 'title'),
      shortTitle: str(file, data, 'shortTitle', true) || str(file, data, 'title'),
      order,
      kind,
      status,
      summary: str(file, data, 'summary'),
      description: str(file, data, 'description'),
      suitableFor: list(file, data, 'suitableFor'),
      notProvided: list(file, data, 'notProvided'),
      atAGlance,
      related: list(file, data, 'related'),
      bodyMarkdown: body,
      bodyHtml: () => renderMarkdown(body),
    };
  });
  return services.sort((a, b) => a.order - b.order);
}

export function loadArticles(dir = join(CONTENT_DIR, 'articles')): Article[] {
  const themeSlugs = THEMES.map((t) => t.slug);
  const articles = mdFiles(dir).map((file): Article => {
    const { data, body } = parseFile(file);
    const theme = str(file, data, 'theme');
    if (!themeSlugs.includes(theme)) fail(file, `"theme" must be one of ${themeSlugs.join(', ')}`);
    const refs = data.references ?? [];
    if (!Array.isArray(refs)) fail(file, '"references" must be a list');
    const references = refs.map((r) => {
      const rec = r as Record<string, unknown>;
      const url = str(file, rec, 'url');
      if (!url.startsWith('https://')) fail(file, `reference URL must use https: ${url}`);
      return { title: str(file, rec, 'title'), publisher: str(file, rec, 'publisher'), url };
    });
    const words = body.split(/\s+/).filter(Boolean).length;
    return {
      slug: basename(file, '.md'),
      title: str(file, data, 'title'),
      summary: str(file, data, 'summary'),
      description: str(file, data, 'description'),
      theme,
      approved: data.approved === true,
      published: date(file, data, 'published'),
      reviewed: date(file, data, 'reviewed'),
      nextReview: date(file, data, 'nextReview'),
      references,
      related: list(file, data, 'related'),
      readingMinutes: Math.max(1, Math.round(words / 220)),
      bodyMarkdown: body,
      bodyHtml: () => renderMarkdown(body),
    };
  });
  return articles.sort(
    (a, b) => (b.published ?? '').localeCompare(a.published ?? '') || a.title.localeCompare(b.title),
  );
}

export function themeBySlug(slug: string): Theme {
  const t = THEMES.find((x) => x.slug === slug);
  if (!t) throw new Error(`Unknown theme ${slug}`);
  return t;
}
