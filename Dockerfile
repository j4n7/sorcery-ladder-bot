FROM node:22-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]