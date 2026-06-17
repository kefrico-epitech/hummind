# Base image for building
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk update && apk add --no-cache openssl

# Enable pnpm
RUN corepack enable pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client and build the NestJS application
RUN pnpm prisma generate
RUN pnpm build

# Prune devDependencies to keep the image small, but retain the generated Prisma client
RUN pnpm prune --prod --config.ignore-scripts=true

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk update && apk add --no-cache openssl

# Set non-root user (alpine includes 'node' user by default)
ENV NODE_ENV=production
RUN chown -R node:node /app

# Switch to the non-root user
USER node

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Copy the completely pruned node_modules from the builder stage
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

# Copy mail templates (read at runtime by NestJS Mailer from src/mail/templates/)
COPY --from=builder --chown=node:node /app/src/mail/templates ./src/mail/templates

# Expose the application port
EXPOSE 5500

# Start the application
CMD ["node", "dist/main.js"]
