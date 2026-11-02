FROM node:22-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json tsconfig.json ./
COPY apps/api-central/package.json apps/api-central/package.json
COPY apps/web-hospital/package.json apps/web-hospital/package.json
COPY apps/web-patient/package.json apps/web-patient/package.json
COPY packages/database/package.json packages/database/package.json
COPY services/edge-gateway/package.json services/edge-gateway/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci --workspace @healthcare/edge-gateway --include-workspace-root=false

COPY services/edge-gateway services/edge-gateway
COPY packages/shared-types/src packages/shared-types/src
RUN npm run build --workspace @healthcare/edge-gateway

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /workspace/services/edge-gateway/dist ./dist
RUN mkdir -p /app/data/spool && chown -R node:node /app/data
USER node
EXPOSE 8080 2575
CMD ["node", "dist/services/edge-gateway/src/index.js"]
