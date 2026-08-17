#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE BACKUP DIÁRIO DO POSTGRESQL COM RETENÇÃO DE 7 DIAS (ORACLE CLOUD)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/opt/znk-erp/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="znk_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
ENV_FILE="/opt/znk-erp/.env.production"

# Carrega variáveis se existirem
if [ -f "$ENV_FILE" ]; then
  # exporta variáveis ignorando comentários
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

DB_USER="${POSTGRES_USER:-znk_admin}"
DB_NAME="${POSTGRES_DB:-znk_fashion_erp}"
CONTAINER_NAME="znk_postgres"

mkdir -p "$BACKUP_DIR"

echo "=============================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando backup do banco de dados: ${DB_NAME}"
echo "=============================================================================="

# 1. Execução do dump compactado via gzip
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner --no-privileges | gzip -9 > "$BACKUP_PATH"; then
  BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
  echo "[SUCESSO] Backup gerado com sucesso em: ${BACKUP_PATH} (${BACKUP_SIZE})"
else
  echo "[ERRO] Falha ao executar pg_dump no container ${CONTAINER_NAME}"
  exit 1
fi

# 2. Validação de integridade do arquivo gerado
if [ ! -s "$BACKUP_PATH" ]; then
  echo "[ERRO] Arquivo de backup vazio gerado. Abortando."
  rm -f "$BACKUP_PATH"
  exit 1
fi

# 3. Política de Retenção: Remove backups com mais de 7 dias
echo "[INFO] Aplicando política de retenção (limpando backups com mais de 7 dias)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -type f -name "znk_backup_*.sql.gz" -mtime +7 -print -delete | wc -l)
echo "[INFO] ${DELETED_COUNT} arquivo(s) de backup antigo(s) removido(s)."

# 4. Upload Opcional para Oracle Cloud Object Storage (se OCI CLI estiver configurado)
if command -v oci &> /dev/null && [ -n "${OCI_BUCKET_NAME:-}" ]; then
  echo "[INFO] Enviando cópia do backup para o OCI Object Storage Bucket: ${OCI_BUCKET_NAME}..."
  oci os object put -bn "$OCI_BUCKET_NAME" --file "$BACKUP_PATH" --name "database-backups/${BACKUP_FILENAME}" --force || {
    echo "[AVISO] Falha ao sincronizar com OCI Object Storage. Backup local mantido."
  }
fi

echo "=============================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Rotina de backup finalizada com sucesso."
echo "=============================================================================="
