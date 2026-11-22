# ---- deps ----
# With a package-lock.json the install is exactly what was tested (`npm ci`);
# without one it falls back to `npm install`. Commit the lockfile for
# reproducible deploys (see DEPLOYMENT.md).
# Node 22: Node 20 reached end-of-life in April 2026 and no longer gets security fixes.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
    && npm cache clean --force

# ---- runtime ----
# Separate stage so npm's install cache (left behind in /root/.npm even after
# `npm install`, ~170MB) never lands in the final image layers.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

# The API only needs to read its own files: don't run it as root.
USER node

EXPOSE 5000

# Process liveness. /api/health also reports "db": "connected" | "disconnected".
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
