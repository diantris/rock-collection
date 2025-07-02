# Development Dockerfile for React frontend
FROM node:20-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
EXPOSE 3000
# Set HOST environment variable so Next.js listens on all interfaces
ENV HOST=0.0.0.0
CMD ["yarn", "start"]
