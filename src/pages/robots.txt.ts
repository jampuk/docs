import type { APIContext } from 'astro';

/**
 * Dynamic robots.txt.
 *
 * Production (docs.jampuk.com) → Allow all + sitemap reference.
 * All other origins (Cloudflare preview, staging, local) → Disallow all,
 * so preview deployments are never indexed and don't dilute canonical authority.
 */

const PRODUCTION_URL = 'https://docs.jampuk.com';

export function GET(_ctx: APIContext) {
  // Astro.site is set from the `site:` config option (overridable via env var).
  const site = (
    import.meta.env.PUBLIC_DOCS_SITE?.trim() ||
    import.meta.env.SITE?.trim() ||
    PRODUCTION_URL
  ).replace(/\/+$/, '');

  const isProd = site === PRODUCTION_URL;

  const body = isProd
    ? `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap-index.xml\n`
    : `User-agent: *\nDisallow: /\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
