import type { APIContext } from "astro";
import { SITE } from "@data/site";

const PRODUCTION_URL = "https://docs.jampuk.com";

export function GET(_context: APIContext) {
  const site = SITE.url.replace(/\/+$/, "");
  const isProduction = site === PRODUCTION_URL;

  if (!isProduction) {
    return new Response("humans.txt is not available in non-production environments.\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  const body = `/* TEAM */

  Name: ${SITE.founder.name}
  Role: ${SITE.founder.jobTitle}
  Contact: ${SITE.email}
  Microblog: @techconsulnerd@fosstodon.org
  From: ${SITE.company.jurisdiction}

/* THANKS */

  Name: Open source community and maintainers of the libraries this site depends on
  Note: Astro, Starlight, Vite, Pagefind, and the wider web standards community.

/* SITE */

  Last update: ${today}
  Language: English
  Doctype: HTML5
  IDE: Astro, Starlight, Vite
  Standards: HTML5, CSS3, Schema.org JSON-LD, Open Graph, Twitter Cards
  Components: Astro SSG, Starlight, Pagefind
  Software: Astro 7, Starlight 0.42, Vite 8, TypeScript 5
  URL: ${site}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
