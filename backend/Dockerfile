FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000 5000

CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
