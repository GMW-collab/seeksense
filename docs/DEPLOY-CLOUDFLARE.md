# Deploying to Cloudflare Pages

Every push to `main` runs CI. When CI passes, the **Deploy to Cloudflare Pages** workflow builds the site and deploys it to the Cloudflare Pages project `seeksense`. It also deploys the enquiry endpoint as a Pages Function (`functions/api/enquiry.ts`).

## What gets deployed for now

- The **preview build**: placeholders are highlighted and every page is marked noindex (meta tag, `X-Robots-Tag` header and robots.txt).
- It goes to **https://seeksense.pages.dev** only. No custom domain is attached and DNS is not touched.
- The enquiry form returns "Online enquiries are not available right now" with the email fallback until mail settings are added (step 3).

## One-time setup

### 1. Create an API token (Cloudflare dashboard)

Go to **My Profile → API Tokens → Create Token → Create Custom Token**:

- **Permissions:** Account → *Cloudflare Pages* → **Edit**
- **Account resources:** include only your account
- Give it an expiry date if you prefer, and store it somewhere safe.

Also copy your **Account ID**. It's on the right-hand side of any zone's overview page, or under *Workers & Pages*.

### 2. Add two repository secrets (GitHub)

In `GMW-collab/seeksense`, go to **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | The token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID |

Then go to **Actions → Deploy to Cloudflare Pages → Run workflow**, or simply push to `main`. The first run creates the Pages project.

### 3. (Later) Turn on enquiries

In Cloudflare, go to **Workers & Pages → seeksense → Settings → Variables and secrets** and add, for Production, as *encrypted* values:

`MAIL_PROVIDER=postmark`, `POSTMARK_SERVER_TOKEN`, `ENQUIRY_FROM`, `ENQUIRY_TO`

Do this only after the data processing agreement with the mail provider is in place and the privacy notice names it.

### 4. (Recommended) Protect the staging site

The pages.dev address is public, although it is not indexed. To limit it to your team, use **Workers & Pages → seeksense → Settings → General → Access policy** (Cloudflare Access; the free tier covers up to 50 users).

### 5. (Recommended, once on the real domain) Rate limiting

The function rate-limits in memory, which in Workers only applies per instance. When seeksense.co is attached, add a WAF rate-limiting rule for `/api/enquiry`, for example 5 requests per 10 minutes per IP.

## Going live on seeksense.co

1. Run `npm run launch-check` and resolve every item.
2. In `.github/workflows/deploy.yml`, change `SITE_ENV: preview` to `SITE_ENV: production`. The build will then fail if anything is still unverified.
3. In Pages → **Custom domains**, add `seeksense.co` (and `www`). Cloudflare will show the DNS records needed. **Note what the domain currently serves before switching it.**
4. Check the live site: headers (securityheaders.com), the enquiry flow with a test inbox, and that `robots.txt` now allows indexing.

## Rollback

Go to Cloudflare **Workers & Pages → seeksense → Deployments**, open any earlier deployment, and choose **Rollback to this deployment**. This takes effect immediately and needs no rebuild.
