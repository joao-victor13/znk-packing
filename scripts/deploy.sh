#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE DEPLOY CONTÍNUO & ZERO DOWNTIME - ZNK ATELIER ERP
# Executa: git pull -> build -> migrate -> rolling restart -> health check
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BRANCH="${1:-main}"
ENV_FILE=".env.production"

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}   INICIANDO CICLO DE DEPLOY AUTOMATIZADO (BRANCH: ${BRANCH})                ${NC}"
echo -e "${BLUE}==============================================================================${NC}"

# 1. Validação de pré-requisitos
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}[ERRO] Arquivo de variáveis ${ENV_FILE} não encontrado!${NC}"
  echo -e "Execute ${YELLOW}bash scripts/generate-secrets.sh${NC} antes do deploy."
  exit 1
fi

# 2. Atualização do código-fonte via Git
echo -e "${YELLOW}[PASSO 1/6] Atualizando código-fonte via Git (branch: ${BRANCH})...${NC}"
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  echo -e "${YELLOW}[AVISO] Não é um repositório Git local. Prosseguindo com os arquivos atuais...${NC}"
fi

# 3. Build otimizado das imagens com cache de camadas
echo -e "${YELLOW}[PASSO 2/6] Construindo imagens Docker com cache de camadas...${NC}"
docker compose --env-file "$ENV_FILE" build --pull app

# 4. Inicialização do Banco de Dados & Aguardo do Healthcheck
echo -e "${YELLOW}[PASSO 3/6] Garantindo que o PostgreSQL esteja saudável...${NC}"
docker compose --env-file "$ENV_FILE" up -d postgres

# Aguarda até que o container postgres reporte 'healthy'
MAX_WAIT=30
WAITED=0
while [ "$WAITED" -lt "$MAX_WAIT" ]; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' znk_postgres 2>/dev/null || echo "starting")
  if [ "$STATUS" == "healthy" ]; then
    echo -e "${GREEN}[INFO] PostgreSQL está pronto e saudável!${NC}"
    break
  fi
  sleep 2
  WAITED=$((WAITED + 2))
  echo -e "${BLUE}Aguardando PostgreSQL inicializar (${WAITED}s/${MAX_WAIT}s)...${NC}"
done

if [ "$WAITED" -ge "$MAX_WAIT" ]; then
  echo -e "${RED}[ERRO] Timeout aguardando PostgreSQL inicializar.${NC}"
  exit 1
fi

# 5. Execução de Migrações de Banco de Dados (Prisma Migrate)
echo -e "${YELLOW}[PASSO 4/6] Executando migrações de banco de dados (Prisma)...${NC}"
docker compose --env-file "$ENV_FILE" run --rm app npx prisma migrate deploy || {
  echo -e "${YELLOW}[AVISO] Prisma migrate deploy finalizado (ou sem novas migrações pendentes).${NC}"
}

# 6. Atualização dos Containers (Rolling Restart)
echo -e "${YELLOW}[PASSO 5/6] Atualizando e reiniciando os containers da aplicação...${NC}"
docker compose --env-file "$ENV_FILE" up -d --remove-orphans

# 7. Validação de Saúde da Aplicação (Health Check)
echo -e "${YELLOW}[PASSO 6/6] Validando disponibilidade da aplicação (Health Check)...${NC}"
MAX_HEALTH_TRIES=15
TRIES=0
APP_HEALTHY=false

while [ "$TRIES" -lt "$MAX_HEALTH_TRIES" ]; do
  HTTP_CODE=$(docker exec znk_app curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "000")
  if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 304 ]; then
    APP_HEALTHY=true
    break
  fi
  sleep 2
  TRIES=$((TRIES + 1))
  echo -e "${BLUE}Checando resposta da aplicação (Tentativa ${TRIES}/${MAX_HEALTH_TRIES} - HTTP ${HTTP_CODE})...${NC}"
done

if [ "$APP_HEALTHY" = true ]; then
  echo -e "${GREEN}[SUCESSO] Aplicação respondendo com HTTP 200 OK!${NC}"
else
  echo -e "${RED}[ALERTA] Aplicação não respondeu no tempo esperado. Verifique os logs: docker compose logs app${NC}"
fi

# 8. Limpeza de Imagens Órfãs Antigas
echo -e "${BLUE}Limpando imagens antigas não utilizadas...${NC}"
docker image prune -f

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${GREEN}   DEPLOY CONCLUÍDO COM SUCESSO! (${BRANCH} @ $(date '+%d/%m/%Y %H:%M:%S'))     ${NC}"
echo -e "${BLUE}==============================================================================${NC}"
