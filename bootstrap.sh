#!/bin/bash
################################################################################
# Bootstrap Script - OdooEdu Installer
#
# Este script prepara un servidor Ubuntu limpio e instala OdooEdu de forma
# completamente desatendida. Realiza las siguientes acciones:
#
#   1. Actualiza el sistema operativo
#   2. Instala git y curl (necesarios para clonar el repositorio)
#   3. Clona el repositorio de OdooEdu
#   4. Ejecuta el script de instalación principal
#
# Uso:
#   curl -sSL https://raw.githubusercontent.com/atreyu1968/Odoo-Edu-Installer-Spanish/main/bootstrap.sh | sudo bash
#
# O si ya lo descargaste:
#   chmod +x bootstrap.sh
#   sudo bash bootstrap.sh
#
# Compatible con: Ubuntu 22.04 LTS / 24.04 LTS
################################################################################

set -euo pipefail

RED='\033[1;31m'
GREEN='\033[1;32m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

REPO_URL="https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish.git"
INSTALL_DIR="/tmp/Odoo-Edu-Installer-Spanish"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                              ║${NC}"
echo -e "${BLUE}║           ${GREEN}OdooEdu - Instalador Educativo de Odoo${BLUE}              ║${NC}"
echo -e "${BLUE}║           ${NC}Bootstrap - Preparación del servidor${BLUE}                ║${NC}"
echo -e "${BLUE}║                                                              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}[ERROR]${NC} Este script debe ejecutarse como root."
    echo ""
    echo "  Uso: curl -sSL https://raw.githubusercontent.com/atreyu1968/Odoo-Edu-Installer-Spanish/master/bootstrap.sh | sudo bash"
    echo ""
    exit 1
fi

. /etc/os-release 2>/dev/null || true
if [[ "${ID:-}" != "ubuntu" ]]; then
    echo -e "${YELLOW}[AVISO]${NC} Este script está diseñado para Ubuntu 22.04 / 24.04 LTS."
    echo -e "         Sistema detectado: ${ID:-desconocido} ${VERSION_ID:-}"
    echo ""
    read -p "¿Continuar de todos modos? (s/N): " -r
    if [[ ! "$REPLY" =~ ^[Ss]$ ]]; then
        echo "Instalación cancelada."
        exit 1
    fi
fi

echo -e "${BLUE}[1/4]${NC} Actualizando el sistema operativo..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
echo -e "${GREEN}  ✓ Sistema actualizado${NC}"

echo -e "${BLUE}[2/4]${NC} Instalando dependencias previas (git, curl)..."
apt-get install -y -qq git curl ca-certificates
echo -e "${GREEN}  ✓ git y curl instalados${NC}"

echo -e "${BLUE}[3/4]${NC} Clonando el repositorio de OdooEdu..."
if [[ -d "$INSTALL_DIR" ]]; then
    rm -rf "$INSTALL_DIR"
fi
git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
chmod +x "$INSTALL_DIR/odoo_install.sh"
echo -e "${GREEN}  ✓ Repositorio clonado en $INSTALL_DIR${NC}"

echo ""
echo -e "${BLUE}[4/4]${NC} Ejecutando el instalador principal..."
echo -e "       ${YELLOW}Este proceso tarda entre 10 y 20 minutos.${NC}"
echo ""

cd "$INSTALL_DIR"
bash odoo_install.sh

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║        ✓ Bootstrap completado exitosamente                   ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  Las credenciales se han guardado en:                         ║${NC}"
echo -e "${GREEN}║  /opt/odoo17/credenciales_odoo.txt                            ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
