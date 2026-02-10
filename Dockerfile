# --- STAGE 1: Build the application ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client and Build the production application
RUN npx prisma generate
RUN npm run build

# --- STAGE 2: Install production dependencies ---
FROM node:20-alpine AS prod-deps

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install ONLY production dependencies
# Need build-base tools for native modules like bcrypt
RUN apk add --no-cache python3 make g++ && \
    npm ci --omit=dev && \
    npx prisma generate && \
    apk del python3 make g++

# --- STAGE 3: Final Runner Image ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS=--openssl-legacy-provider

# Copy build artifacts and production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Create uploads directory and set permissions for the node user
RUN mkdir -p /app/uploads/profile-pictures && chown -R node:node /app/uploads

# Use non-root user for security
USER node

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
