FROM node:20-slim AS base

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Common dependencies and setup
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev", "--host"]

# Build stage
FROM base AS build
ENV NODE_ENV=production
COPY . .
RUN pnpm build

# Production stage
FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 