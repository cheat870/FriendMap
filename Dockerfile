FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma and CA certificates
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy dependency definitions
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm install

# Copy backend source code
COPY backend/ .

# Generate Prisma Client & compile TypeScript
RUN npx prisma generate
RUN npm run build

# Default production environment
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000 5000

# Push DB tables on startup and run server
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
