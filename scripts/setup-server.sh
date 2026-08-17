#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE PROVISIONAMENTO AUTOMATIZADO - ORACLE CLOUD (OCI)
# Suporta: Oracle Linux 8/9 & Ubuntu 22.04/24.04 LTS
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}   ZNK ATELIER ERP - PROVISIONAMENTO DE SERVIDOR ORACLE CLOUD (OCI)           ${NC}"
echo -e "${BLUE}==============================================================================${NC}"

# 1. Verificação de privilégios de root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERRO] Este script deve ser executado como root ou via sudo.${NC}"
  exit 1
fi

# 2. Identificação do Sistema Operacional
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
  VERSION_ID=$VERSION_ID
else
  echo -e "${RED}[ERRO] Não foi possível identificar a distribuição Linux.${NC}"
  exit 1
fi

echo -e "${GREEN}[INFO] Sistema Operacional detectado: ${OS} ${VERSION_ID}${NC}"

# ------------------------------------------------------------------------------
# 3. RESOLUÇÃO CRÍTICA DO FIREWALL DO SO NA ORACLE CLOUD (OCI)
# A OCI bloqueia portas 80/443 por padrão no iptables da imagem do SO
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[PASSO 1/5] Configurando Firewall do SO para portas 80, 443 e 22...${NC}"

if [[ "$OS" == "ol" || "$OS" == "rhel" || "$OS" == "centos" ]]; then
  echo -e "${BLUE}Configurando firewalld e iptables no Oracle Linux...${NC}"
  
  # Instala e ativa firewalld se necessário
  dnf install -y firewalld iptables-services
  systemctl enable --now firewalld || true

  # Libera portas no firewalld permanentemente
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --permanent --add-port=80/tcp
  firewall-cmd --permanent --add-port=443/tcp
  firewall-cmd --permanent --add-port=22/tcp
  firewall-cmd --reload

  # Desbloqueia regras nativas restritivas do OCI iptables
  iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT || true
  iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT || true
  iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT || true
  service iptables save || true

elif [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
  echo -e "${BLUE}Configurando UFW e iptables no Ubuntu...${NC}"
  
  apt-get update -y
  apt-get install -y ufw iptables-persistent netfilter-persistent

  # Permite portas no UFW
  ufw allow 22/tcp comment 'SSH'
  ufw allow 80/tcp comment 'HTTP Let’s Encrypt'
  ufw allow 443/tcp comment 'HTTPS'
  ufw --force enable

  # Desbloqueia regras legadas da imagem OCI Ubuntu no iptables
  iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT || true
  iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT || true
  iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT || true
  netfilter-persistent save || true
fi

echo -e "${GREEN}[SUCESSO] Portas 80, 443 e 22 liberadas no Firewall do SO!${NC}"

# ------------------------------------------------------------------------------
# 4. INSTALAÇÃO DO DOCKER ENGINE & DOCKER COMPOSE PLUGIN
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[PASSO 2/5] Instalando Docker Engine & Docker Compose...${NC}"

if [[ "$OS" == "ol" || "$OS" == "rhel" || "$OS" == "centos" ]]; then
  # Remove versões antigas
  dnf remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine || true
  
  # Adiciona repositório oficial do Docker no Oracle Linux
  dnf install -y dnf-plugins-core
  dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
  
  dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git curl openssl

elif [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg lsb-release git openssl

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Ativa e inicia serviço Docker
systemctl enable --now docker

# Adiciona o usuário padrão OCI (opc no Oracle Linux ou ubuntu no Ubuntu) ao grupo docker
TARGET_USER=${SUDO_USER:-$(whoami)}
if id "$TARGET_USER" &>/dev/null; then
  usermod -aG docker "$TARGET_USER"
  echo -e "${GREEN}[INFO] Usuário '${TARGET_USER}' adicionado ao grupo docker.${NC}"
fi

# ------------------------------------------------------------------------------
# 5. CONFIGURAÇÃO DE LOG ROTATION DO DOCKER (Prevenção de disco cheio)
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[PASSO 3/5] Configurando rotação de logs do Docker daemon...${NC}"

mkdir -p /etc/docker
cat <<EOF > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker

# ------------------------------------------------------------------------------
# 6. ESTRUTURA DE DIRETÓRIOS DO SISTEMA
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[PASSO 4/5] Criando estrutura de pastas da aplicação...${NC}"

APP_DIR="/opt/znk-erp"
mkdir -p "${APP_DIR}"
mkdir -p "${APP_DIR}/backups"
mkdir -p "${APP_DIR}/nginx/conf.d"
mkdir -p "${APP_DIR}/docker/postgres"
mkdir -p "${APP_DIR}/scripts"

chown -R "$TARGET_USER":"$TARGET_USER" "${APP_DIR}"

# ------------------------------------------------------------------------------
# 7. FINALIZAÇÃO & INSTRUÇÕES
# ------------------------------------------------------------------------------
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${GREEN}   SERVIDOR ORACLE CLOUD PREPARADO COM SUCESSO!                              ${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "Próximos passos:"
echo -e "1. Faça logout e login novamente no SSH para aplicar o grupo docker ao usuário:"
echo -e "   ${YELLOW}exit${NC} e reconecte via SSH."
echo -e "2. Clone o repositório ou copie os arquivos para: ${YELLOW}/opt/znk-erp${NC}"
echo -e "3. Gere seu arquivo .env.production com o script: ${YELLOW}bash scripts/generate-secrets.sh${NC}"
echo -e "4. Execute o deploy: ${YELLOW}bash scripts/deploy.sh${NC}"
echo -e "${BLUE}==============================================================================${NC}"
