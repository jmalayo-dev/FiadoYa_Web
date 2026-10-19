# syntax=docker/dockerfile:1
# Etapa 1: build con Node.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
RUN npm run build && rm -f dist/mockServiceWorker.js dist/config.js

# Etapa 2: Nginx sirve la SPA y hace de proxy hacia el gateway.
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/templates-fiadoya/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY public/config.js.template /usr/share/nginx/html/config.js.template
COPY docker-entrypoint.sh /docker-entrypoint-fiadoya.sh
# El proceso maestro abre el puerto 80; los workers corren como el usuario sin privilegios "nginx".
RUN chmod +x /docker-entrypoint-fiadoya.sh && rm -f /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
ENTRYPOINT ["/docker-entrypoint-fiadoya.sh"]
