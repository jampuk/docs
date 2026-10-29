# syntax=docker/dockerfile:1

# ============================================================================
# Stage 1: Builder - Astro static site generation
# ----------------------------------------------------------------------------
# Produces the fully static site (Starlight + Pagefind index) in /app/dist.
#
# Astro inlines PUBLIC_* variables into the generated HTML at BUILD time, so
# they are supplied as build arguments (see docker-compose.yml). The values
# are baked into the static output and are not needed at runtime.
# ============================================================================
FROM node:24-alpine AS builder

WORKDIR /app

# Node 24 is pinned rather than parameterised: Astro 7 requires Node >= 22.22
# and sharp 0.35 ships Node-API prebuilds for Node 24. Alpine's musl libc
# needs libc6-compat for sharp's prebuilt binaries.
RUN apk add --no-cache libc6-compat

ARG PUBLIC_DOCS_SITE=http://localhost:8088

ENV PUBLIC_DOCS_SITE=${PUBLIC_DOCS_SITE}

# Dependency layer first - reinstalled only when package.json changes.
# No lockfile is committed, so `npm install` is always used.
COPY package.json ./
RUN npm install --no-audit --no-fund

# Configuration and sources
COPY astro.config.mjs tsconfig.json ./
COPY public/ ./public/
COPY src/ ./src/

# Starlight builds the Pagefind index as part of `astro build`.
RUN npm run build

# ============================================================================
# Stage 2: Runtime - Node serving the static output
# ----------------------------------------------------------------------------
# Production dependencies only (no dev tooling, no build stage leftovers).
# The Astro preview server exposes the built site on port 8088 inside the
# container. There is no dev server and no HMR - the site is fully compiled
# and immutable for the lifetime of the image.
# ============================================================================
FROM node:24-alpine AS runtime

WORKDIR /app

# Node 24 is pinned for the same reasons as the builder stage: Astro 7 needs
# Node >= 22.22 and the preview server is a Node runtime.
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8088

# Runtime dependencies (astro + starlight + sitemap) required by the preview
# server to load astro.config.mjs and serve the dist/ folder.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

# The preview server resolves astro.config.mjs and tsconfig.json (path
# aliases) at startup, so ship them alongside dist/.
COPY astro.config.mjs tsconfig.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 8088

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:8088/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8088"]
