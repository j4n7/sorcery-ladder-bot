FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN npm install -g npm@10.5.2

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --include=dev --no-audit --no-fund
RUN npm run prisma:generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

CMD ["sh", "-c", "npm run prisma:migrate:deploy && node dist/index.js"]