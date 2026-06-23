FROM mcr.microsoft.com/playwright:v1.61.0-noble

WORKDIR /app

# NODE_ENV=production は npm ci の前に置かない（prisma 等の devDependencies が必要）
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
ENV PLAYWRIGHT_HEADLESS=true
ENV DATABASE_URL=file:/data/dev.db
ENV HOSTNAME=0.0.0.0

RUN mkdir -p /data

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && exec npm run start -- -p ${PORT:-3000} -H 0.0.0.0"]