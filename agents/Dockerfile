# syntax=docker/dockerfile:1.7

FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build


FROM node:22-slim AS runtime

ENV NODE_ENV=production
ENV PORT=4111

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.mastra/output ./.mastra/output

EXPOSE 4111

CMD ["node", ".mastra/output/index.mjs"]