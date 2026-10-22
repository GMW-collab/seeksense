// Integration boundary for delivering enquiries.
// No provider is configured by default: the server then reports enquiries as
// unavailable and visitors are shown the email fallback. Nothing is stored.
//
// Before enabling a provider, the founder must have: a data processing
// agreement with it, UK/adequate data residency confirmed, and the privacy
// notice updated to name it (see docs/HANDOVER.md).

import type { Enquiry } from './validation.ts';
import { ENQUIRY_INTERESTS } from './validation.ts';

export interface Mailer {
  readonly name: string;
  send(enquiry: Enquiry): Promise<void>;
}

export class MailerError extends Error {}

function interestLabel(value: string): string {
  return ENQUIRY_INTERESTS.find((i) => i.value === value)?.label ?? value;
}

/** Plain-text body. Deliberately excludes IP address and other metadata. */
export function formatEnquiry(e: Enquiry): { subject: string; text: string } {
  return {
    // The subject contains no personal or health information, so it is safe in inbox previews.
    subject: 'New website enquiry',
    text: [
      `Name: ${e.name}`,
      `Email: ${e.email}`,
      `Phone: ${e.phone || '(not given)'}`,
      `Interested in: ${interestLabel(e.interest)}`,
      '',
      'Message:',
      e.message || '(none)',
      '',
      '--',
      'Sent from the SeekSense website enquiry form. The sender consented to being contacted about this enquiry.',
      'Please handle in line with the enquiry retention policy.',
    ].join('\n'),
  };
}

/** Postmark (https://postmarkapp.com) transactional email API. */
export class PostmarkMailer implements Mailer {
  readonly name = 'postmark';
  private readonly token: string;
  private readonly from: string;
  private readonly to: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: { token: string; from: string; to: string; fetchImpl?: typeof fetch }) {
    this.token = opts.token;
    this.from = opts.from;
    this.to = opts.to;
    // Wrapped so the global is called unbound (Workers throw "Illegal invocation" otherwise).
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  async send(enquiry: Enquiry): Promise<void> {
    const { subject, text } = formatEnquiry(enquiry);
    const res = await this.fetchImpl('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': this.token,
      },
      body: JSON.stringify({
        From: this.from,
        To: this.to,
        ReplyTo: enquiry.email,
        Subject: subject,
        TextBody: text,
        MessageStream: 'outbound',
        TrackOpens: false,
        TrackLinks: 'None',
      }),
      signal: AbortSignal.timeout(10_000),
    });
    // Never include the response body in errors: it could echo submitted data.
    if (!res.ok) throw new MailerError(`Mail provider responded with status ${res.status}`);
  }
}

export function mailerFromEnv(env: NodeJS.ProcessEnv = process.env): Mailer | null {
  const provider = (env.MAIL_PROVIDER ?? '').trim().toLowerCase();
  if (!provider) return null;
  if (provider === 'postmark') {
    const token = env.POSTMARK_SERVER_TOKEN;
    const from = env.ENQUIRY_FROM;
    const to = env.ENQUIRY_TO;
    if (!token || !from || !to)
      throw new Error('MAIL_PROVIDER=postmark needs POSTMARK_SERVER_TOKEN, ENQUIRY_FROM and ENQUIRY_TO');
    return new PostmarkMailer({ token, from, to });
  }
  throw new Error(`Unknown MAIL_PROVIDER "${provider}"`);
}
