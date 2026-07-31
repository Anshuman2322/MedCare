# ---- deps ----
# package-lock.json is intentionally not committed in this repo (see .gitignore),
# so `npm ci` isn't usable here — `npm install` is the correct/only option.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# ---- runtime ----
# Separate stage so npm's install cache (left behind in /root/.npm even after
# `npm install`, ~170MB) never lands in the final image layers.
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
