const siteUrl = (
  import.meta.env.PUBLIC_DOCS_SITE?.trim() ||
  import.meta.env.SITE?.trim() ||
  'https://docs.jampuk.com'
).replace(/\/+$/, '');

export const SITE = {
  name: 'Jampuk Intelligence',
  docsName: 'Jampuk Docs',
  url: siteUrl,
  websiteUrl: 'https://www.jampuk.com',
  locale: 'en_US',
  description:
    'Entry points to Jampuk Intelligence delivery solutions, engagement models, use cases and field notes. Guides and reference cover the Astro, Starlight, Tailwind, Vite, TypeScript and Cloudflare stack.',
  ogImage: '/images/og-image.jpg',
  twitter: '',
  sameAs: [
    'https://www.linkedin.com/company/jampuk',
    'https://github.com/jampuk',
  ],
  email: 'hi@jampuk.com',
  company: {
    name: 'Jampuk Intelligence Systems',
  },
  founder: {
    name: 'Hafiz Zainudin',
    jobTitle: 'AI Steward & Systems Architect',
    profileUrl: 'https://www.jampuk.com/principal-profile',
    linkedinUrl: 'https://www.linkedin.com/in/hafiz-zainudin',
    mastodonUrl: 'https://fosstodon.org/@techconsulnerd',
  },
} as const;
