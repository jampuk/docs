import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import externalLinks from './src/markdown/external-links.mjs';
import { unified } from '@astrojs/markdown-remark';

// Docs canonical URL can be overridden via env var for preview/prod.
// Example: PUBLIC_DOCS_SITE=https://docs.jampuk.com npm run build
const site =
  process.env.PUBLIC_DOCS_SITE?.trim() ||
  process.env.SITE?.trim() ||
  'https://docs.jampuk.com';

// https://astro.build/config
// Cloudflare Pages: static output, no adapter required.
export default defineConfig({
  site,
  output: 'static',
  markdown: {
    // Opens links to untrusted external domains in a new tab (the docs site
    // itself and other *.jampuk.com subdomains are whitelisted to same-tab)
    // and tags the `## Further Readings` section for styling.
    // See src/markdown/external-links.mjs.
    processor: unified({
      rehypePlugins: [
        [externalLinks, { site }],
      ],
    }),
  },
  integrations: [
    partytown({
      config: {
        // Forward GA4 commands from the main thread into the Partytown worker.
        // Only `dataLayer.push` is forwarded: the main-thread `gtag` shim pushes
        // into `window.dataLayer`, so forwarding `gtag` as well would bounce the
        // call back to the main thread and loop.
        forward: ['dataLayer.push'],
      },
    }),
    starlight({
      title: 'Jampuk Docs',
      description:
        'Entry points to Jampuk Intelligence delivery solutions, engagement models, use cases and field notes. Guides and reference cover the Astro, Starlight, Tailwind, Vite, TypeScript and Cloudflare stack.',
      logo: {
        // Dark-only site: use the white logo variant
        // (src/assets/logo-jampuk-alt.png). Color variant
        // (logo-jampuk.png) is kept for light-surface reuse.
        src: './src/assets/logo-jampuk-alt.png',
        // Hide the "Docs" site title after the logo (the logo image
        // carries the wordmark). Text stays sr-only for accessibility.
        replacesTitle: true,
      },
      favicon: '/favicons/favicon-32x32.png',
      customCss: ['./src/styles/custom.css'],
      // Starlight 0.42 does not auto-detect `src/components/` overrides, so the
      // Footer override (share buttons) must be registered explicitly.
      components: {
        Footer: './src/components/Footer.astro',
        Head: './src/components/Head.astro',
      },
      // Single-language site: use the default root locale so routes stay
      // unprefixed (e.g. `/devops-engineering/crowdsec-setup/`, not `/en/...`).
      // Do NOT add `locales: { en: ... }` - a non-root locale key puts all
      // content under a URL prefix and root-level files stop resolving.
      // Pagefind is Starlight's default search - zero config, offline-friendly,
      // works on static Cloudflare Pages hosting.
      // Explicitly left as default; see src/content/docs/modern-web-apps/search-ops.mdx
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/jampuk',
        },
      ],
      head: [
        // Inline script: inject VitePress-style header nav links
        // ("Guides | Reference") as the first item of the header's
        // right group (before the social icons), matching the VitePress
        // header layout. Starlight hides .right-group below 50rem, so the
        // links are hidden on mobile for free.
        {
          tag: 'script',
          content: `(function(){
  function injectNavLinks(){
    const group = document.querySelector('.header .right-group');
    if(!group || group.querySelector('.vp-nav')) return;
    const nav = document.createElement('div');
    nav.className = 'vp-nav';
    nav.innerHTML =
      '<a href="https://read.jampuk.com/">Field Notes</a>' +
      '<a href="https://www.jampuk.com/">Jampuk.com</a>';
    group.insertBefore(nav, group.firstChild);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', injectNavLinks);
  } else {
    injectNavLinks();
  }
})()`,
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.googleapis.com',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossorigin: '',
          },
        },
        {
          tag: 'link',
          attrs: {
            href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap',
            rel: 'stylesheet',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'theme-color',
            content: '#0B132B',
          },
        },
      ],
      sidebar: [
        {
          label: 'Agentic Grid',
          collapsed: true,
          items: [
            { slug: 'agentic-grid' },
            'agentic-grid/engagement-walkthrough',
            'agentic-grid/agent-runtime-vpc',
            'agentic-grid/deliverable-checklist',
          ],
        },
        {
          label: 'Web Systems Delivery',
          collapsed: true,
          items: [
            { slug: 'web-systems-delivery' },
            'web-systems-delivery/cloudflare-pages-deploy',
            'web-systems-delivery/gitops-deploy-flow',
            'web-systems-delivery/runbook-authoring',
            'web-systems-delivery/handover-checklist',
          ],
        },
        {
          label: 'AI Integrations',
          collapsed: true,
          items: [
            { slug: 'ai-integrations' },
            'ai-integrations/rag-pipeline-design',
            'ai-integrations/prompt-context-engineering',
            'ai-integrations/model-gateway',
            'ai-integrations/llm-evaluation',
            'ai-integrations/vector-store-options',
          ],
        },
        {
          label: 'DevOps Engineering',
          collapsed: true,
          items: [
            { slug: 'devops-engineering' },
            'devops-engineering/crowdsec-setup',
            'devops-engineering/web-server-hardening',
            'devops-engineering/docker-foundations',
            'devops-engineering/kubernetes-helm',
            'devops-engineering/server-provisioning-checklist',
          ],
        },
        {
          label: 'Modern Web Apps',
          collapsed: true,
          items: [
            { slug: 'modern-web-apps' },
            {
              label: 'Delivery',
              items: [
                'modern-web-apps/delivery-walkthrough',
                'modern-web-apps/static-site-generation',
                'modern-web-apps/spa-delivery',
                'modern-web-apps/gitops-cicd',
                'modern-web-apps/edge-dns-ddos',
                'modern-web-apps/performance-foundations',
                'modern-web-apps/sitemap-seo',
              ],
            },
            {
              label: 'Stack reference',
              items: [
                'modern-web-apps/tailwind-v4',
                'modern-web-apps/typescript-strict',
                'modern-web-apps/vite-bundling',
                'modern-web-apps/sharp-images',
                'modern-web-apps/partytown-analytics',
                'modern-web-apps/search-ops',
                'modern-web-apps/reproducible-build-spec',
              ],
            },
          ],
        },
        {
          label: 'Email Deliverability',
          collapsed: true,
          items: [
            { slug: 'email-deliverability' },
            'email-deliverability/spf-flattening',
            'email-deliverability/dkim-rotation',
            'email-deliverability/dmarc-enforcement',
            'email-deliverability/email-dns-records',
            'email-deliverability/deliverability-monitoring',
          ],
        },
      ],
    }),
    sitemap({
      filter: (page) =>
        !['/403', '/404', '/500', '/502', '/503'].some((p) =>
          page.includes(p)
        ),
    }),
  ],
});
