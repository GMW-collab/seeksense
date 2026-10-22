import type { BuildSettings } from '../config/env.ts';
import type { Article, Service } from './content.ts';

export interface BuildContext {
  settings: BuildSettings;
  services: Service[];
  articles: Article[];
  /** Services shown on this build: live ones in production, all in preview. */
  publishedServices(): Service[];
  /** Articles shown on this build: approved ones in production, all in preview. */
  publishedArticles(): Article[];
  serviceHref(slug: string): string | null;
  /** Absolute URL for a site path. */
  url(path: string): string;
  /** Cache-busted asset path. */
  asset(path: string): string;
}

export function createContext(
  settings: BuildSettings,
  services: Service[],
  articles: Article[],
  assetHashes: Map<string, string>,
): BuildContext {
  const isProd = settings.env === 'production';
  const ctx: BuildContext = {
    settings,
    services,
    articles,
    publishedServices: () => services.filter((s) => !isProd || s.status === 'live'),
    publishedArticles: () => articles.filter((a) => !isProd || a.approved),
    serviceHref(slug) {
      return ctx.publishedServices().some((s) => s.slug === slug) ? `/services/${slug}/` : null;
    },
    url: (path) => `${settings.siteUrl}${path}`,
    asset(path) {
      const hash = assetHashes.get(path);
      return hash ? `${path}?v=${hash}` : path;
    },
  };
  return ctx;
}
