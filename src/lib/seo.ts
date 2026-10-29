import { SITE } from '../data/site';

/**
 * Pure SEO helpers for the docs site (no framework deps).
 * Builds schema.org JSON-LD nodes and absolute URLs for social crawlers.
 *
 * Nodes are emitted as a single `@graph` with stable `@id`s so
 * Organization, WebSite, Person, and BreadcrumbList cross-reference each other.
 */

export const SITE_URL = SITE.url;
export const ORGANIZATION_ID = `${SITE.websiteUrl}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PERSON_ID = `${SITE.websiteUrl}/#founder`;
export const LOGO_PATH = '/favicons/android-chrome-512x512.png';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function absoluteUrl(path: string, base: string = SITE_URL): string {
  try {
    return new URL(path, base).toString();
  } catch {
    return path;
  }
}

/**
 * Canonical URL for a page path — always directory-style (trailing slash).
 */
export function canonicalUrl(pathname: string, site: string = SITE_URL): string {
  const clean = pathname.split(/[?#]/)[0] || '/';
  const withSlash = clean.endsWith('/') ? clean : `${clean}/`;
  return absoluteUrl(withSlash, site);
}

// Uppercase labels for known acronym segments
const SEGMENT_LABELS: Record<string, string> = {
  ai: 'AI',
  cms: 'CMS',
  devops: 'DevOps',
  dkim: 'DKIM',
  dmarc: 'DMARC',
  dns: 'DNS',
  gitops: 'GitOps',
  llm: 'LLM',
  rag: 'RAG',
  spf: 'SPF',
  vpc: 'VPC',
};

function prettify(segment: string): string {
  const whole = SEGMENT_LABELS[segment.toLowerCase()];
  if (whole) return whole;
  return segment
    .split('-')
    .map((word) => {
      const label = SEGMENT_LABELS[word.toLowerCase()];
      return label ?? word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function buildOrganization(): Record<string, unknown> {
  const logo = absoluteUrl(LOGO_PATH, SITE.websiteUrl);
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE.name,
    alternateName: SITE.company.name,
    url: SITE.websiteUrl,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE.websiteUrl}/#logo`,
      url: logo,
      width: 512,
      height: 512,
    },
    image: { '@id': `${SITE.websiteUrl}/#logo` },
    description: SITE.description,
    email: SITE.email,
    founder: { '@id': PERSON_ID },
    sameAs: SITE.sameAs,
  };
}

export function buildWebsite(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE.docsName,
    url: SITE_URL,
    description: SITE.description,
    inLanguage: SITE.locale.replace('_', '-'),
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function buildPerson(): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE.founder.name,
    jobTitle: SITE.founder.jobTitle,
    url: SITE.founder.profileUrl,
    sameAs: [SITE.founder.linkedinUrl, SITE.founder.mastodonUrl],
    worksFor: { '@id': ORGANIZATION_ID },
  };
}

/**
 * BreadcrumbList for a docs page path.
 * The root crumb is "Docs" (the docs home), not the org name.
 *
 * Example: /devops-engineering/crowdsec-setup/
 *   → Docs › DevOps Engineering › CrowdSec Setup
 */
export function buildBreadcrumb(
  pathname: string,
  pageTitle?: string,
): Record<string, unknown> | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs: { name: string; url: string }[] = [
    { name: 'Docs', url: canonicalUrl('/', SITE_URL) },
  ];

  let acc = '';
  segments.forEach((segment, index) => {
    acc += `/${segment}`;
    const isLast = index === segments.length - 1;
    // Use the real page title for the final crumb; prettify slugs for parents.
    const name = isLast && pageTitle ? pageTitle : prettify(segment);
    crumbs.push({ name, url: canonicalUrl(acc) });
  });

  const pageUrl = canonicalUrl(acc);
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
