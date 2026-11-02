import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "@data/site";

const PRODUCTION_URL = "https://docs.jampuk.com";

// Mirrors the Starlight sidebar order in astro.config.mjs. Sections added later
// fall back to alphabetical order after the known guides.
const SECTION_ORDER = [
  "agentic-grid",
  "web-systems-delivery",
  "ai-integrations",
  "devops-engineering",
  "modern-web-apps",
  "email-deliverability",
];

function docsPath(id: string): string {
  const clean = id.replace(/(^|\/)index$/, "");
  return clean ? `/${clean}/` : "/";
}

function sectionRank(section: string): number {
  const index = SECTION_ORDER.indexOf(section);
  return index === -1 ? SECTION_ORDER.length : index;
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function GET(_context: APIContext) {
  const site = SITE.url.replace(/\/+$/, "");
  const isProduction = site === PRODUCTION_URL;

  if (!isProduction) {
    return new Response("LLMs.txt is not available in non-production environments.\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const u = (path: string) => `${site}${path.startsWith("/") ? path : `/${path}`}`;

  const entries = await getCollection("docs", ({ data }) => data.draft !== true);

  const home = entries.find((entry) => entry.id === "index");
  const sections = new Map<
    string,
    {
      title: string;
      items: { href: string; title: string; desc: string; order: number }[];
    }
  >();

  for (const entry of entries) {
    if (entry.id === "index") continue;

    const segments = entry.id.split("/");
    const section = segments[0];
    const isSectionIndex = entry.id.endsWith("/index");
    const group = sections.get(section) ?? {
      title: titleFromSlug(section),
      items: [],
    };

    if (isSectionIndex) {
      group.title = entry.data.title;
      group.items.push({
        href: docsPath(entry.id),
        title: entry.data.title,
        desc: entry.data.description ?? "",
        order: -1,
      });
      sections.set(section, group);
      continue;
    }

    group.items.push({
      href: docsPath(entry.id),
      title: entry.data.title,
      desc: entry.data.description ?? "",
      order: entry.data.sidebar?.order ?? Number.MAX_SAFE_INTEGER,
    });
    sections.set(section, group);
  }

  const sectionKeys = Array.from(sections.keys()).sort(
    (a, b) =>
      sectionRank(a) - sectionRank(b) ||
      sections.get(a)!.title.localeCompare(sections.get(b)!.title),
  );

  const sectionBlocks = sectionKeys
    .map((key) => {
      const group = sections.get(key)!;
      const items = group.items
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
        .map((item) => `- [${item.title}](${u(item.href)}): ${item.desc}`)
        .join("\n");

      return `## ${group.title}\n\n${items}`;
    })
    .join("\n\n");

  const homeTitle = home?.data.title ?? "Introduction";
  const homeDesc = home?.data.description ?? SITE.description;

  const body = `# ${SITE.docsName}

> ${SITE.description}

${SITE.docsName} is the delivery documentation of ${SITE.company.name} (SSM ${SITE.company.ssmRegistrationNo}, ${SITE.company.jurisdiction}), led by ${SITE.founder.name}, ${SITE.founder.jobTitle}. Contact: ${SITE.email}

## Overview

- [${homeTitle}](${u("/")}): ${homeDesc}

${sectionBlocks}

## Optional

- [Jampuk Read](https://read.jampuk.com/): Field notes on secure, compliant AI delivery.
- [Jampuk Intelligence](${SITE.websiteUrl}/): The main website.
- [GitHub](https://github.com/jampuk): Open-source work and tooling.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
