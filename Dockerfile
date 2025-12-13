# Stage 1: Install dependencies and build the Next.js app
# UPDATED: Using node:20 to meet dependency requirements (fixes EBADENGINE warnings)
FROM node:20 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code and run the build command
COPY . .
RUN npm run build

# Stage 2: Create the final production image
# UPDATED: Using node:20 for consistent runtime environment
FROM node:20 AS runner

WORKDIR /app

# Set environment to production and define port
ENV NODE_ENV production
ENV PORT 8080

# Create a non-root user for security
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# --- CRITICAL COPY COMMANDS FOR STANDALONE DEPLOYMENT ---

# 1. Copy the standalone server and its dependencies
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./

# 2. Copy the necessary static assets generated during the build (.next/static)
# This fixes the 404 errors for the JS chunks
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

# 3. Copy the public directory (for favicon, robots.txt, and public images)
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

# ---------------------------------------------------------

USER nextjs

EXPOSE 8080

# Start the Next.js production server
CMD ["node", "server.js"]
