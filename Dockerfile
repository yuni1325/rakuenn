FROM mcr.microsoft.com/playwright:v1.61.0-noble

WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_HEADLESS=true
ENV DATABASE_URL=file:/data/dev.db
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

RUN mkdir -p /data

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && npm run start -- -p ${PORT:-3000} -H 0.0.0.0"]
