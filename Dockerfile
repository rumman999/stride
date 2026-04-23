# Build Stage
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependency definitions
COPY package.json bun.lock ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy project files
COPY . .

# Build the project
RUN bun run build

# Production Stage
FROM node:22-alpine AS runner
WORKDIR /app

# Copy build artifacts from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

# Install only production dependencies (optional but recommended for smaller size)
# Alternatively, we can just copy node_modules from the builder.
# We'll use npm here because we are in a node alpine image. 
# SvelteKit adapter-node usually needs package.json for type module and some deps.
COPY --from=builder /app/node_modules ./node_modules

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["node", "build/index.js"]
