// Build-time settings, read from the environment with safe defaults.

export type SiteEnv = 'preview' | 'production';

export interface BuildSettings {
  env: SiteEnv;
  siteUrl: string;
  publishFutureSection: boolean;
  bookingUrl: string | null;
  /** When false, pending facts are rendered without failing. Never false for real production builds. */
  strict: boolean;
}

function bool(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

function httpsUrl(value: string | undefined, name: string): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
  if (url.protocol !== 'https:') throw new Error(`${name} must use https`);
  return url.toString();
}

export function readSettings(env: NodeJS.ProcessEnv = process.env): BuildSettings {
  const siteEnv: SiteEnv = env.SITE_ENV === 'production' ? 'production' : 'preview';
  const siteUrl = (env.SITE_URL ?? 'https://seeksense.co').replace(/\/+$/, '');
  return {
    env: siteEnv,
    siteUrl,
    publishFutureSection: bool(env.PUBLISH_FUTURE_SECTION),
    bookingUrl: httpsUrl(env.BOOKING_URL, 'BOOKING_URL'),
    strict: siteEnv === 'production',
  };
}
