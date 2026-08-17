# ==============================================================================
# MULTI-STAGE DOCKERFILE PARA PRODUÇÃO (NODE.JS / NEXT.JS / REACT)
# Otimizado para baixo consumo de RAM, segurança (non-root) e cache de camadas
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependências base
# ------------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalação com cache de pacotes
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --prefer-offline --no-audit

# ------------------------------------------------------------------------------
# Stage 2: Build da Aplicação
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Geração do Prisma Client e Build do Bundle
RUN npx prisma generate || true
RUN npm run build

# Remove devDependencies para minimizar o tamanho final
RUN npm prune --production

# ------------------------------------------------------------------------------
# Stage 3: Imagem Final de Execução (Minimal Runtime)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Criação de usuário sem privilégios de root para segurança (Cyber Security Best Practice)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeapp

# Instala curl para healthchecks
RUN apk add --no-cache curl

# Copia artefatos construídos e dependências de produção
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# Define permissões
USER nodeapp

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "dist/server.js"]
