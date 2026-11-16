# The app as plain files (next.config.ts: output 'export') served by Caddy, which also passes /api/* on to the API, so
# the browser talks to one address. The same image runs locally (caddy/Caddyfile, plain HTTP on port 80) and on the
# VM (caddy/vm.Caddyfile, HTTPS for the DuckDNS name; see deploy/README.md).

# Caddy with the DuckDNS plugin, for the VM's certificate (Let's Encrypt can't reach the VM through its firewall, so
# Caddy proves the name with a DNS record instead). Doesn't depend on the app, so Docker keeps it cached.
FROM caddy:2-builder AS caddy
RUN xcaddy build --with github.com/caddy-dns/duckdns

FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
# NEXT_PUBLIC_* values are baked into the browser bundle at build time. Empty = the API is on the page's own address.
ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN yarn build

FROM caddy:2
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
COPY caddy/ /etc/caddy/
COPY --from=build /app/out /srv
EXPOSE 80 443
