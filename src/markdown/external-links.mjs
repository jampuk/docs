/**
 * Rehype plugin: external-link handling for Starlight markdown.
 *
 * - Adds `target="_blank"` + `rel="noopener noreferrer"` (+ `data-external`)
 *   to links pointing outside the site, so external pages never hijack the
 *   reader's current tab. Links to the docs site itself and to any
 *   `*.jampuk.com` subdomain are trusted and stay in the same tab.
 * - Tags the nodes following a `## Further Readings` heading with the
 *   `further-readings` class so CSS can add an external-link cue only
 *   inside that section. All of this happens at build time - no
 *   client-side JavaScript and no flash of same-tab navigation.
 */

const FURTHER_READINGS_HEADING = /^further readings$/i;

function resolveHref(href) {
	if (typeof href !== 'string') return null;
	try {
		// Protocol-relative (`//cdn.example.com/x.js`) parses with an explicit scheme.
		// Relative and fragment URLs throw without a base - they are internal.
		return new URL(href.startsWith('//') ? `https:${href}` : href);
	} catch {
		return null;
	}
}

function isAbsoluteHttp(url) {
	return url?.protocol === 'http:' || url?.protocol === 'https:';
}

function isTrustedHost(hostname, siteHost) {
	const host = hostname?.toLowerCase() ?? '';
	if (!host) return false;
	if (siteHost && host === siteHost) return true;
	// Same brand, different tab is not worth the context switch.
	return /(^|\.)jampuk\.com$/.test(host);
}

/** Gather the plain text of a heading node (h2 depth, text children). */
function nodeText(node) {
	let out = '';
	(function walk(n) {
		if (n.type === 'text') {
			out += n.value;
			return;
		}
		if (n.children) n.children.forEach(walk);
	})(node);
	return out.trim();
}

export default function externalLinks(options = {}) {
	let siteHost = '';
	try {
		siteHost = options.site ? new URL(options.site).hostname.toLowerCase() : '';
	} catch {
		siteHost = '';
	}

	return (tree) => {
		const children = tree.children ?? [];

		// 1. Tag the `## Further Readings` section (heading siblings until
		// the next h1/h2) so its external links can be styled.
		for (let i = 0; i < children.length; i++) {
			const node = children[i];
			if (node.tagName === 'h2' && FURTHER_READINGS_HEADING.test(nodeText(node))) {
				for (let j = i + 1; j < children.length; j++) {
					const sib = children[j];
					if (/^h[12]$/.test(sib.tagName ?? '')) break;
					if (!sib.tagName) continue; // skip text / comment nodes
					const props = (sib.properties ??= {});
					const classes = props.className ?? (props.className = []);
					if (!classes.includes('further-readings')) classes.push('further-readings');
				}
				break;
			}
		}

		// 2. Rewrite every link to a non-trusted external domain.
		(function visit(node) {
			if (!node) return;
			if (node.tagName === 'a') {
				const url = resolveHref(node.properties?.href);
				if (isAbsoluteHttp(url) && !isTrustedHost(url.hostname, siteHost)) {
					const props = (node.properties ??= {});
					props.target = '_blank';
					props.rel = ['noopener', 'noreferrer'];
					props['data-external'] = '';
				}
			}
			if (node.children) node.children.forEach(visit);
		})(tree);
	};
}
