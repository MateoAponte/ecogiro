FROM node:20-alpine AS base
RUN npm install -g pnpm@10.0.0 turbo@2

FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune back --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ ./
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/.npmrc ./
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/out/full/ ./
RUN pnpm --filter back run build
RUN pnpm --filter back deploy --prod /prod/back

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=installer /prod/back ./
COPY --from=installer /app/apps/back/dist ./dist
EXPOSE 3000
CMD ["node", "dist/src/main.js"]