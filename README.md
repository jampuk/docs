<div align="center">

# Jampuk Docs

**Technical reference for the Jampuk stack.**

Guides and reference for Astro, Starlight, Tailwind, Vite, TypeScript, Partytown, Sitemap, Sharp, and Cloudflare — plus a cross-site hub linking delivery solutions, engagement models, use cases, and Jampuk Read field notes.

[Read the docs](https://docs.jampuk.com) · [Jampuk.com](https://www.jampuk.com)

![Astro 7](https://img.shields.io/badge/Astro-7-BC52EE?style=flat-square&logo=astro&logoColor=white)
![Starlight](https://img.shields.io/badge/Starlight-0.42-F59E0B?style=flat-square&logo=astro&logoColor=white)
![Node.js 24+](https://img.shields.io/badge/Node.js-24%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-D97706?style=flat-square)](LICENSE)

</div>

---

## Overview

A static documentation site built with **Astro 7** and **Astro Starlight**, hosted on **Cloudflare Pages**. Its layout closely emulates VitePress with a dark-only Jampuk design system — no light theme, no SSR adapter.

- **Delivery guides plus stack reference.** Solution categories cover the delivery capabilities behind Jampuk engagements, with technical reference for Astro, Starlight, Tailwind, Vite, TypeScript, Partytown, Sitemap/SEO, Sharp, and Cloudflare.
- **Cross-site hub.** The homepage links delivery solutions, engagement models, use cases, and Jampuk Read field notes.
- **Static delivery.** Pre-rendered pages served directly from `dist/`, with built-in Pagefind search at zero extra config.
- **Share by design.** Leaf guide pages render a share row — social, bookmark, email, copy-link, and native Web Share — between the article body and the footer.
- **Dark only.** No theme toggle; consistent with the Jampuk Design System.

## Contents

- [Design system](#design-system)
- [Layout](#layout)
- [Content rules](#content-rules)
- [Authoring pages](#authoring-pages)
- [Project map](#project-map)
- [Development conventions](#development-conventions)
- [Search](#search)
- [Sharing](#sharing)
- [Deployment](#deployment)
- [License](#license)

## Design system

The docs inherit the Jampuk Design System (dark alpha). All visual tokens are defined as `--sl-*` variables in [`src/styles/custom.css`](src/styles/custom.css). Do not hardcode Starlight internals elsewhere.

| Token | Value |
| --- | --- |
| Primary | `#0B132B` |
| Surface | `#0F172A` |
| Container | `#1E293B` |
| Container-high | `#334155` |
| Tertiary / cyan | `#0EA5E9` |
| Amber | `#F59E0B` |
| Text | `#E2E8F0` |
| Muted | `#94A3B8` |
| Outline | `#334155` |

**Typography** — `Bricolage Grotesque` for hero/`h1` only; `Space Grotesk` for headings and labels; `Inter` for body; `Fira Code` for code. Google Fonts are loaded from the `head` config in `astro.config.mjs`; font tokens (`--font-display/heading/body/mono`) must stay defined in `custom.css` `:root` or the browser falls back to default serif.

**Shape** — 8 px buttons/inputs/code, 12 px cards, 9999 px pills. Amber is reserved for warnings and cautions — never for primary buttons.

> **Reuse tokens, never hardcode.** Map all colors through `--sl-*` vars in `custom.css`. New images should use dark surfaces with cyan/amber accents and include descriptive `alt` text.

## Layout

Starlight's layout is customized to closely emulate **VitePress** via `src/styles/custom.css`. Custom CSS is unlayered, so it overrides Starlight's `@layer starlight.core` rules without `!important`. Selectors target Starlight's real DOM classes.

| Area | Behavior |
| --- | --- |
| Header | Logo wordmark far-left, no separate site title (`replacesTitle`); search bar with `Ctrl K` hint aligned to the body content column; "Guides \| Reference" nav links injected into the right group before social icons; single hairline bottom border |
| Left sidebar | Group labels in white; muted nav items; active item as accent-colored text (no pill); native hairline tree lines on nested items |
| Main content | Content column capped at `--sl-content-width` (45 rem / 720 px), centered VitePress-style; H1 at 36 px; dark code blocks with outline borders; links in accent cyan |
| Right sidebar | "On this page" table of contents with muted links; active entry in the main text color |
| Theme | Dark only — do not re-enable the theme toggle |

The header nav links are injected at runtime by an inline script in `astro.config.mjs` (`head`) targeting `.header .right-group`.

## Content rules

Pages live in six solution category directories, each with an `index.mdx` overview that lists its guides and references as `LinkCard`s.

| Category directory | Covers |
| --- | --- |
| `ai-integrations/` | AI and LLM integration patterns |
| `devops-engineering/` | CI/CD, containerization, and infra |
| `modern-web-apps/` | Static and single-page delivery, GitOps and edge protection, performance and SEO, plus the Astro, Tailwind, Vite, TypeScript, Sharp and Partytown stack |
| `email-deliverability/` | Transactional and bulk email |
| `agentic-grid/` | Agentic systems and orchestration |
| `web-systems-delivery/` | Hosting, CDN, and deployment |

Every page must include:

- Frontmatter `title` + `description`
- One `h1` (via the frontmatter title — do not add a second)
- 3–5 content sections
- One code block
- One Starlight component (`Aside`, `Steps`, `Tabs`, `Card` / `CardGrid`)

Keep `sidebar.order` sequential within each directory. Use standard hyphens (`-`), not em/en dashes. Keep delivery capabilities and technology reference in `modern-web-apps/`; do not add stub pages. No product purchase pages - solution categories link to related guides instead.

## Authoring pages

Add a page under the matching category directory. The frontmatter supplies the visible `h1`, so do not repeat the title in the body.

```md
---
title: My page
description: Short summary for search results.
sidebar:
  order: 2
---

...page content...

## Further Readings

- [Astro Documentation](https://docs.astro.build/)
```

Further readings belong in a `## Further Readings` section at the end of the page body, not in frontmatter. Each entry is a Markdown link with an absolute URL.

External links are handled automatically by a rehype plugin ([`src/markdown/external-links.mjs`](src/markdown/external-links.mjs), registered in `astro.config.mjs`) — do not set link attributes by hand in markdown:

- Links to other domains get `target="_blank"` + `rel="noopener noreferrer"` server-side at build time.
- The docs site itself and other `*.jampuk.com` subdomains (`www.`, `read.`) stay in the same tab.
- Links inside a `## Further Readings` section also get a small arrow-up-right icon, styled in `custom.css` (`.further-readings a[data-external]::after`).

Built-in Starlight components are available in MDX:

```mdx
import { Aside, CardGrid, LinkCard, Steps, Tabs, TabItem } from '@astrojs/starlight/components';

<Aside type="tip">Short callout.</Aside>
```

- Use `Aside` for a caveat, tip or delivery note.
- Use `Steps` for ordered procedures.
- Use `Tabs` only when the alternative is genuinely different, such as npm and pnpm.
- Use `CardGrid` and `LinkCard` on category overviews.

Sidebar navigation is explicit in `astro.config.mjs`. Add new pages to the correct group and keep slug order aligned with `sidebar.order`. Category overview pages use `index.mdx` and a `LinkCard` grid.

Page quality bar:

- 380-550 words for guides; reference pages may run longer when the extra material is substantive.
- 3-5 substantive sections, not a definition list.
- At least one code block and one table or checklist.
- One Starlight component where it adds structure.
- Concrete examples from this repository or the website where possible.
- No stub asides, placeholder text or generic vendor summaries.

## Project map

| Location | Purpose |
| --- | --- |
| `astro.config.mjs` | Starlight + sitemap, static output, site URL via env var; external-link rehype plugin; inline header nav-link injection script |
| `wrangler.toml` | Cloudflare Pages metadata |
| `docker-compose.yml` | Local dev / preview via Docker |
| `public/favicons/` | Site icons served from `/favicons/` |
| `public/robots.txt` | References the production sitemap; update the domain if the canonical URL changes |
| `public/_headers` | Security headers for Cloudflare Pages |
| `src/assets/logo-jampuk-alt.png` | White logo for dark header/sidebar |
| `src/assets/logo-jampuk.png` | Color/navy logo for light-surface reuse only |
| `src/components/Footer.astro` | Starlight Footer override — share row + default footer + cookie settings trigger & consent banner |
| `src/components/ConsentBanner.astro` | Cookie consent banner (Google Consent Mode v2) |
| `src/components/ShareButtons.astro` | Social, bookmark, email, copy-link, and native share actions |
| `src/lib/consent.ts` | Consent storage key (`jampuk-docs-consent`) and banner re-open event |
| `src/content/docs/` | Six solution category dirs, each with `index.mdx` |
| `src/content.config.ts` | Starlight `docsLoader` + `docsSchema` |
| `src/markdown/external-links.mjs` | Rehype plugin — external links open in a new tab (`*.jampuk.com` whitelisted to same tab) and `## Further Readings` sections are tagged for CSS |
| `src/styles/custom.css` | VitePress-emulating Starlight overrides (dark only) |

## Development conventions

- Keep **self-contained**: no external app imports; do not add Tailwind or SSR adapters unless explicitly requested. GA4 analytics is offloaded via Partytown when configured.
- Use `output: 'static'` — no SSR adapter. Cloudflare Pages serves `dist/` directly.
- Keep secrets out of source files and logs. Declare env vars with empty or dummy placeholders in `.env.example`.
- Do not commit lockfiles; the remote build installs dependencies with `npm install`.
- Logo and favicon changes: keep both logo variants in `src/assets/` and never recreate the wordmark by hand.

<details>
<summary><strong>Optional local tooling reference</strong></summary>

- Astro's development server uses `http://localhost:4321`.
- The Docker Compose configuration serves a static production build through Astro preview on port `8088`, without a local Node toolchain.
- The container has no volumes or HMR. Content changes require rebuilding the image.
- Lockfiles are excluded by `.gitignore` and `.dockerignore`, so the image installs dependencies with `npm install`.

</details>

### Scripts

| Command | Purpose |
| --- | --- |
| `npm install` | First-time setup (lockfiles are never committed) |
| `npm run dev` | Local development server |
| `npm run build` | Static build to `dist/` (Pagefind index included) |
| `npm run preview` | Preview the production build |

## Search

**Pagefind** is the only search provider — no Algolia, no extra config. Starlight's default Pagefind search runs automatically after the build.

- Verify after changes: `npm run build` produces `dist/pagefind/`, then search for a known term (e.g. `"Vite"`) in preview.
- The CMS shell and error pages are excluded from indexing.

## Sharing

Guide pages render a share row between the article body and the footer (social, bookmarks, email, copy link, plus native Web Share where supported).

- Implemented as a Starlight `Footer` component override (`src/components/Footer.astro` renders `src/components/ShareButtons.astro`), registered under `components:` in `astro.config.mjs`. Starlight 0.42 does not auto-detect `src/components/` overrides.
- **Leaf guide pages only** — the splash home page, category `index.mdx` overviews, and the 404 page are excluded by the `showShare` guard.
- Share links always use the canonical `PUBLIC_DOCS_SITE` URL, so preview builds still share production links.
- Share markup is `data-pagefind-ignore`, keeping it out of search results.
- Styling lives in the `Share block` section of `src/styles/custom.css`; reuse existing tokens and do not add new hardcoded colors.

## Deployment

### Cloudflare Pages

| Setting | Value |
| --- | --- |
| Project | `jampuk-docs` |
| Root directory | `docs` |
| Production branch | `main` |
| Node.js | `24` |
| Remote build command | `npm install && npm run build` |
| Output directory | `dist` |
| Custom domain | `docs.jampuk.com` (CNAME) |

See [`wrangler.toml`](wrangler.toml) and `src/content/docs/web-systems-delivery/cloudflare-pages-deploy.mdx`.

### Environment variables

| Variable | Production value or purpose |
| --- | --- |
| `PUBLIC_DOCS_SITE` | `https://docs.jampuk.com` |
| `PUBLIC_WEBSITE_URL` | `https://www.jampuk.com` |
| `PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement ID; leave empty to disable analytics and the consent banner |

Canonical URL resolves as `PUBLIC_DOCS_SITE` → `SITE` → default `https://docs.jampuk.com`. Local Docker defaults to `http://localhost:8088`.

```sh
PUBLIC_DOCS_SITE=https://docs.jampuk.com npm run build
```


<details>
<summary><strong>Local Docker testing</strong></summary>

```sh
docker compose up --build        # build + serve on http://localhost:8088
docker compose up --build -d     # detached
```

No volumes, no HMR — the production static build is served by the Astro preview server on Node (port 8088). Rebuild after every content change. Override the baked-in site URL:

```sh
PUBLIC_DOCS_SITE=https://docs.jampuk.com docker compose up --build
```

</details>

## License

Copyright 2026 Jampuk Intelligence Systems.

Licensed under the [Apache License, Version 2.0](LICENSE).
