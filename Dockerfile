FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install using npm
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Copy rest and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production --silent

COPY --from=builder /app/.next .next
COPY --from=builder /app/public public
COPY --from=builder /app/next.config.js next.config.js

EXPOSE 3000
CMD ["npm", "start"]
