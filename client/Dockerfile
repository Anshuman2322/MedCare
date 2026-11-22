# ---- build ----
# With a package-lock.json the install is exactly what was tested (`npm ci`);
# without one it falls back to `npm install`. Commit the lockfile for
# reproducible deploys (see DEPLOYMENT.md).
# Node 22: Node 20 reached end-of-life in April 2026 and no longer gets security fixes.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .

# Vite inlines VITE_* vars at build time, so this has to be a build ARG, not a
# runtime env var — set it to wherever the server is actually reachable from
# the browser for this deployment.
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- serve ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
