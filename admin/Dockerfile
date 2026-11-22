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

# Vite inlines VITE_* vars at build time, so these have to be build ARGs, not
# runtime env vars.
ARG VITE_API_URL=http://localhost:5000
ARG VITE_CLOUDINARY_CLOUD=""
ARG VITE_CLOUDINARY_PRESET=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLOUDINARY_CLOUD=$VITE_CLOUDINARY_CLOUD
ENV VITE_CLOUDINARY_PRESET=$VITE_CLOUDINARY_PRESET
RUN npm run build

# ---- serve ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
