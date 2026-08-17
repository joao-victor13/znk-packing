#!/usr/bin/env bash
# ==============================================================================
# SCRIPT GERADOR DE SEGREDOS CRIPTOGRÁFICOS (.env.production)
# ==============================================================================

set -euo pipefail

ENV_FILE=".env.production"
EXAMPLE_FILE=".env.production.example"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

if [ -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}[AVISO] O arquivo ${ENV_FILE} já existe.${NC}"
  read -p "Deseja sobrescrever com novas chaves criptográficas? (s/N): " -r CONFIRM
  if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
    echo -e "${BLUE}Operação cancelada. Mantendo ${ENV_FILE} existente.${NC}"
    exit 0
  fi
fi

echo -e "${BLUE}Gerando chaves criptográficas de alta entropia via OpenSSL...${NC}"

POSTGRES_PASS=$(openssl rand -base64 24 | tr -d '=+/' | cut -c1-20)
JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)
SESSION_COOKIE_SECRET=$(openssl rand -base64 48)

read -p "Informe o domínio da aplicação (ex: compras.znkatelier.com.br): " DOMAIN_NAME
DOMAIN_NAME=${DOMAIN_NAME:-compras.znkatelier.com.br}

read -p "Informe o e-mail do administrador para o Let's Encrypt: " LETS_EMAIL
LETS_EMAIL=${LETS_EMAIL:-admin@znkatelier.com.br}

cat <<EOF > "$ENV_FILE"
# ==============================================================================
# VARIÁVEIS DE AMBIENTE DE PRODUÇÃO - GERADO AUTOMATICAMENTE
# ==============================================================================
NODE_ENV=production
APP_URL=https://${DOMAIN_NAME}
DOMAIN_NAME=${DOMAIN_NAME}
LETSENCRYPT_EMAIL=${LETS_EMAIL}

# BANCO DE DADOS
POSTGRES_DB=znk_fashion_erp
POSTGRES_USER=znk_db_admin
POSTGRES_PASSWORD=${POSTGRES_PASS}

# CHAVES CRIPTOGRÁFICAS
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
SESSION_COOKIE_SECRET=${SESSION_COOKIE_SECRET}
EOF

# Define permissões restritas (apenas o dono pode ler/escrever)
chmod 600 "$ENV_FILE"

echo -e "${GREEN}[SUCESSO] Arquivo ${ENV_FILE} gerado com permissões restritas (chmod 600).${NC}"
