// Local development: build a preview and serve it. Enquiries are accepted
// but not sent anywhere (a summary without personal details is logged).
// Use with: npm run dev   (rebuilds on change via node --watch)

import { build } from './build.ts';
import { readSettings } from './config/env.ts';
import { createAppServer } from '../server/server.ts';
import type { Mailer } from '../server/mailer.ts';

const settings = { ...readSettings(), env: 'preview' as const, strict: false };
const result = build(settings);
console.log(`Built ${result.pages.length} pages, ${result.pending.length} item(s) awaiting confirmation.`);

const devMailer: Mailer = {
  name: 'dev (not sent)',
  async send(e) {
    console.log(`[dev] enquiry accepted: interest=${e.interest}, message length=${e.message.length}. Not sent.`);
  },
};

const port = Number(process.env.PORT ?? 4321);
createAppServer({ root: result.outDir, mailer: devMailer, log: (l) => console.log(l) }).listen(port, () => {
  console.log(`Preview at http://localhost:${port}`);
});
