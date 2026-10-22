import type { BuildContext } from '../lib/context.ts';

export interface Page {
  /** Output path, e.g. "/" or "/services/talking-therapy/" or "/404.html". */
  path: string;
  render(ctx: BuildContext): string;
  /** Excluded from the sitemap (utility, preview-only or noindex pages). */
  excludeFromSitemap?: boolean;
}
