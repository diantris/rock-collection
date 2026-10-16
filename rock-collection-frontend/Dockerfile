# Production build of the Next.js frontend
FROM node:24-alpine
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
# NEXT_PUBLIC_* values are baked into the browser bundle at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN yarn build
EXPOSE 3000
# Listen on all interfaces so the port is reachable from outside the container
ENV HOSTNAME=0.0.0.0
CMD ["yarn", "start"]
