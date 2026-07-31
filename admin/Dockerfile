# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
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
