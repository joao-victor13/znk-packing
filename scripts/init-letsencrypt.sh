#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE INICIALIZAÇÃO DO SSL/TLS LET'S ENCRYPT (CERTBOT + NGINX)
# ==============================================================================

set -euo pipefail

ENV_FILE=".env.production"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

DOMAIN="${DOMAIN_NAME:-compras.znkatelier.com.br}"
EMAIL="${LETSENCRYPT_EMAIL:-admin@znkatelier.com.br}"
STAGING="${STAGING:-0}" # 1 para testes contra limite do Let's Encrypt

echo "=============================================================================="
echo "   CONFIGURAÇÃO DE CERTIFICADO SSL/TLS PARA: ${DOMAIN}                        "
echo "=============================================================================="

# 1. Criação de certificados dummy temporários para o Nginx conseguir iniciar
DATA_PATH="./certbot_temp"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}"

echo "[PASSO 1/4] Criando certificados temporários para inicialização do Nginx..."
docker compose run --rm --entrypoint "\
  sh -c 'mkdir -p ${CERT_PATH} && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout \"${CERT_PATH}/privkey.pem\" \
    -out \"${CERT_PATH}/fullchain.pem\" \
    -subj \"/CN=localhost\"'" certbot

echo "[PASSO 2/4] Iniciando Nginx Proxy..."
docker compose up -d nginx

echo "[PASSO 3/4] Solicitando certificado SSL oficial Let's Encrypt via Certbot..."
STAGING_ARG=""
if [ "$STAGING" != "0" ]; then
  STAGING_ARG="--staging"
fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    -d $DOMAIN \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

echo "[PASSO 4/4] Recarregando Nginx com os novos certificados válidos..."
docker compose exec nginx nginx -s reload

echo "=============================================================================="
echo "[SUCESSO] HTTPS ativado e funcionando para: https://${DOMAIN}"
echo "=============================================================================="
