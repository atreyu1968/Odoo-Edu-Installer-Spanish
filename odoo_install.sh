#!/bin/bash
################################################################################
# Script de Instalacion Desatendida de Odoo 17 Community Edition
# EDICION EDUCATIVA con Multiempresa
#
# Incluye:
#   - Odoo 17 CE con todos los modulos disponibles
#   - Localizacion espanola OCA/l10n-spain (contabilidad, AEAT, SII, Factura-e)
#   - Funcionalidad MULTIEMPRESA para uso educativo
#   - Rebranding OCA (personalizar con logo/nombre del centro)
#   - Creacion masiva de alumnos con empresas individuales
#   - Datos de demostracion espanoles precargados
#   - Script de reset de BD por alumno
#   - Copias de seguridad automaticas
#   - PostgreSQL + Nginx + systemd + logrotate + UFW
#
# Uso:
#   sudo bash odoo_install.sh
#
# Despues de instalar:
#   sudo bash odoo_crear_alumnos.sh 30        # Crear 30 alumnos
#   sudo bash odoo_reset_alumno.sh alumno05   # Resetear BD del alumno 05
#   sudo bash odoo_backup.sh                  # Backup de todas las BD
#
# Probado en: Ubuntu 22.04 / 24.04 LTS
################################################################################

set -euo pipefail

#===============================================================================
# CONFIGURACION — Ajusta estos valores segun tus necesidades
#===============================================================================

# Versiones soportadas: 14.0, 15.0, 16.0, 17.0, 18.0
# IMPORTANTE: Cambiar a una version superior requiere migracion de base de datos.
# Use el panel de administracion web para evaluar la compatibilidad de los modulos OCA
# antes de cambiar de version. No se recomienda migrar si algun modulo OCA critico
# no tiene rama estable para la version destino.
ODOO_VERSION="17.0"
ODOO_USER="odoo17"
ODOO_HOME="/opt/$ODOO_USER"
ODOO_HOME_EXT="$ODOO_HOME/${ODOO_USER}-server"
ODOO_CONF="/etc/${ODOO_USER}.conf"
ODOO_PORT="8069"
ODOO_LONGPOLLING_PORT="8072"

INSTALL_NGINX=true
WEBSITE_NAME="_"
ENABLE_SSL=false

DB_HOST="localhost"
DB_PORT="5432"
DB_USER="$ODOO_USER"
DB_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

INSTALL_WKHTMLTOPDF=true
WKHTMLTOPDF_VERSION="0.12.6.1-3"

# --- Superadministrador del panel web ---
SUPERADMIN_USER="superadmin"
SUPERADMIN_PASSWORD="SuperAdmin2024!"

# --- Configuracion educativa ---
EDU_MODE=true
EDU_CENTRO_NOMBRE="Centro de Formacion Profesional"
EDU_BACKUP_DIR="/var/backups/odoo"
EDU_BACKUP_RETENTION_DAYS=30

# Grupos: nombre|numAlumnos|dbPrefix|passwordPrefix|profNombre|profUsuario|profPassword (separados por ;)
EDU_GRUPOS="Grupo 1|30|empresa|alumno|Profesor|profesor|Profesor2024!"

# --- Branding / Marca Blanca ---
# Logo principal: PNG con fondo transparente, 200x60 px recomendado (max 300x100 px)
# Favicon: PNG o ICO, 32x32 px
# Colores: formato hexadecimal (#RRGGBB)
BRAND_COMPANY_NAME="Centro de Formacion Profesional"
BRAND_COMPANY_TAGLINE=""
BRAND_COMPANY_WEBSITE=""
BRAND_COMPANY_EMAIL=""
BRAND_COMPANY_PHONE=""
BRAND_COMPANY_STREET=""
BRAND_COMPANY_CITY=""
BRAND_COMPANY_ZIP=""
BRAND_COMPANY_STATE=""
BRAND_COMPANY_COUNTRY="ES"
BRAND_LOGO_URL=""
BRAND_FAVICON_URL=""
BRAND_PRIMARY_COLOR="#714B67"
BRAND_SECONDARY_COLOR="#21b799"

# --- Regimen Fiscal ---
# "iva"  = Peninsular (IVA: 4%, 10%, 21%)
# "igic" = Canarias  (IGIC: 0%, 3%, 5%, 7%, 9.5%, 15%, 20%)
FISCAL_REGIME="iva"
FISCAL_RECARGO_EQUIVALENCIA=false

# --- VeriFactu (RD 1007/2023) ---
# Obligatorio a partir del 1 de julio de 2026
# Activa el modulo l10n_es_aeat_verifactu para verificacion de facturas
VERIFACTU_ENABLED=false
VERIFACTU_ENVIRONMENT="test"    # "test" o "production"
VERIFACTU_NIF_TITULAR=""
VERIFACTU_RAZON_SOCIAL=""
VERIFACTU_NIF_REPRESENTANTE=""

# --- Modulos OCA ---
OCA_L10N_SPAIN=true
OCA_ACCOUNT_FINANCIAL_TOOLS=true
OCA_ACCOUNT_PAYMENT=true
OCA_BANK_PAYMENT=true
OCA_REPORTING_ENGINE=true
OCA_COMMUNITY_DATA_FILES=true
OCA_SERVER_TOOLS=true
OCA_WEB=true
OCA_QUEUE=true
OCA_PARTNER_CONTACT=true
OCA_MIS_BUILDER=true
OCA_MULTI_COMPANY=true
OCA_BRAND=true

CUSTOM_ADDONS_DIR="$ODOO_HOME/custom/addons"
OCA_DIR="$ODOO_HOME/OCA"

PYTHON_VERSION="python3"

#===============================================================================
# FUNCIONES AUXILIARES
#===============================================================================

log_info() {
    echo -e "\n\033[1;34m[INFO]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "\033[1;32m[OK]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

log_warn() {
    echo -e "\033[1;33m[AVISO]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script debe ejecutarse como root (sudo bash $0)"
        exit 1
    fi
}

detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS_ID="$ID"
        OS_VERSION="$VERSION_ID"
        OS_CODENAME="${VERSION_CODENAME:-}"
    else
        log_error "No se pudo detectar el sistema operativo."
        exit 1
    fi

    if [[ "$OS_ID" != "ubuntu" ]]; then
        log_warn "Este script esta optimizado para Ubuntu. Detectado: $OS_ID $OS_VERSION"
        log_warn "Continuando de todas formas..."
    fi

    SUPPORTED_CODENAMES="jammy noble"
    if [[ -n "$OS_CODENAME" ]] && ! echo "$SUPPORTED_CODENAMES" | grep -qw "$OS_CODENAME"; then
        log_warn "Ubuntu '$OS_CODENAME' ($OS_VERSION) no es una version LTS oficialmente probada."
        log_warn "Las versiones probadas son: Ubuntu 22.04 (jammy) y 24.04 (noble)."
        log_warn "Algunos repositorios externos (PostgreSQL, wkhtmltopdf) pueden no estar disponibles."
        log_info "Se usaran los paquetes de los repositorios del sistema cuando sea necesario."
    fi

    log_info "Sistema operativo detectado: $OS_ID $OS_VERSION ($OS_CODENAME)"
}

#===============================================================================
# 1. VERIFICACIONES INICIALES
#===============================================================================

check_root
detect_os

log_info "============================================================"
log_info " Instalacion Desatendida de Odoo $ODOO_VERSION"
log_info " EDICION EDUCATIVA con Multiempresa"
log_info " Localizacion Espanola OCA/l10n-spain + Rebranding"
log_info "============================================================"
log_info "Usuario Odoo:         $ODOO_USER"
log_info "Directorio:           $ODOO_HOME"
log_info "Puerto:               $ODOO_PORT"
log_info "Contrasena admin:     $ADMIN_PASSWORD"
log_info "Contrasena BD:        $DB_PASSWORD"
log_info "Modo educativo:       $EDU_MODE"
log_info "Centro:               $EDU_CENTRO_NOMBRE"
log_info "Grupos:               $EDU_GRUPOS"
log_info "Empresa (branding):   $BRAND_COMPANY_NAME"
[[ -n "$BRAND_LOGO_URL" ]] && log_info "Logo:                 $BRAND_LOGO_URL"
[[ -n "$BRAND_PRIMARY_COLOR" ]] && log_info "Color principal:      $BRAND_PRIMARY_COLOR"
log_info "============================================================"

#===============================================================================
# 2. ACTUALIZACION DEL SISTEMA
#===============================================================================

log_info "Actualizando el sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
log_success "Sistema actualizado."

#===============================================================================
# 3. INSTALACION DE DEPENDENCIAS DEL SISTEMA
#===============================================================================

log_info "Instalando dependencias del sistema..."

apt-get install -y -qq ${PYTHON_VERSION}

PYTHON_EXACT=$(python3 -c 'import sys; print(f"python{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || echo "python3")
log_info "Python detectado: $PYTHON_EXACT"

apt-get install -y -qq \
    git \
    curl \
    wget \
    gnupg2 \
    software-properties-common \
    build-essential \
    ${PYTHON_EXACT}-dev \
    ${PYTHON_VERSION}-pip \
    ${PYTHON_EXACT}-venv \
    libxml2-dev \
    libxslt1-dev \
    libzip-dev \
    libldap2-dev \
    libsasl2-dev \
    libjpeg-dev \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    zlib1g-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libwebp-dev \
    node-less \
    npm \
    xfonts-75dpi \
    xfonts-base \
    fontconfig

apt-get install -y -qq libtiff5-dev 2>/dev/null || apt-get install -y -qq libtiff-dev 2>/dev/null || true
apt-get install -y -qq libjpeg62-turbo-dev 2>/dev/null || apt-get install -y -qq libjpeg62-dev 2>/dev/null || true

apt-get install -y -qq \
    python3-setuptools \
    python3-wheel \
    python3-cffi \
    python3-babel \
    python3-dateutil \
    python3-decorator \
    python3-docutils \
    python3-feedparser \
    python3-gevent \
    python3-greenlet \
    python3-html2text \
    python3-jinja2 \
    python3-ldap \
    python3-libsass \
    python3-lxml \
    python3-mako \
    python3-mock \
    python3-num2words \
    python3-ofxparse \
    python3-openssl \
    python3-passlib \
    python3-pdfminer \
    python3-phonenumbers \
    python3-pil \
    python3-polib \
    python3-psutil \
    python3-psycopg2 \
    python3-pydot \
    python3-pyparsing \
    python3-pypdf2 \
    python3-qrcode \
    python3-renderpm \
    python3-reportlab \
    python3-requests \
    python3-serial \
    python3-slugify \
    python3-stdnum \
    python3-suds \
    python3-tz \
    python3-usb \
    python3-vatnumber \
    python3-vobject \
    python3-watchdog \
    python3-werkzeug \
    python3-xlrd \
    python3-xlsxwriter \
    python3-xlwt \
    python3-zeep 2>/dev/null || true

npm install -g rtlcss less less-plugin-clean-css 2>/dev/null || true

log_success "Dependencias del sistema instaladas."

#===============================================================================
# 4. INSTALACION DE POSTGRESQL
#===============================================================================

log_info "Instalando PostgreSQL..."

if [[ -f /etc/apt/sources.list.d/pgdg.list ]]; then
    rm -f /etc/apt/sources.list.d/pgdg.list
    apt-get update -qq 2>/dev/null || true
fi

if ! command -v psql &>/dev/null; then
    PGDG_SUPPORTED="jammy noble"

    if echo "$PGDG_SUPPORTED" | grep -qw "$OS_CODENAME"; then
        log_info "Anadiendo repositorio oficial de PostgreSQL (codename: $OS_CODENAME)..."
        sh -c "echo 'deb http://apt.postgresql.org/pub/repos/apt ${OS_CODENAME}-pgdg main' > /etc/apt/sources.list.d/pgdg.list"
        wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --batch --yes --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
        apt-get update -qq
    else
        log_warn "El codename '$OS_CODENAME' no esta soportado por el repositorio PGDG."
        log_info "Instalando PostgreSQL desde los repositorios del sistema..."
    fi
fi

apt-get install -y -qq postgresql postgresql-client

systemctl enable postgresql
systemctl start postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
    sudo -u postgres createuser -s "$DB_USER" 2>/dev/null || true

sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true

log_success "PostgreSQL instalado y configurado."

#===============================================================================
# 5. INSTALACION DE WKHTMLTOPDF
#===============================================================================

if [[ "$INSTALL_WKHTMLTOPDF" == true ]]; then
    log_info "Instalando wkhtmltopdf..."

    if ! command -v wkhtmltopdf &>/dev/null; then
        ARCH=$(dpkg --print-architecture)
        WKHTML_URL="https://github.com/wkhtmltopdf/packaging/releases/download/${WKHTMLTOPDF_VERSION}/wkhtmltox_${WKHTMLTOPDF_VERSION}.${OS_CODENAME}_${ARCH}.deb"

        wget -q "$WKHTML_URL" -O /tmp/wkhtmltox.deb 2>/dev/null || {
            log_info "Descarga directa fallo, intentando version generica..."
            wget -q "https://github.com/wkhtmltopdf/packaging/releases/download/${WKHTMLTOPDF_VERSION}/wkhtmltox_${WKHTMLTOPDF_VERSION}.jammy_${ARCH}.deb" -O /tmp/wkhtmltox.deb 2>/dev/null || {
                log_info "Instalando wkhtmltopdf desde repositorios del sistema..."
                apt-get install -y -qq wkhtmltopdf
            }
        }

        if [[ -f /tmp/wkhtmltox.deb ]]; then
            dpkg -i /tmp/wkhtmltox.deb 2>/dev/null || apt-get install -f -y -qq
            rm -f /tmp/wkhtmltox.deb
        fi
    fi

    log_success "wkhtmltopdf instalado."
fi

#===============================================================================
# 6. CREACION DEL USUARIO ODOO
#===============================================================================

log_info "Creando usuario del sistema para Odoo..."

if ! id "$ODOO_USER" &>/dev/null; then
    useradd -m -d "$ODOO_HOME" -U -r -s /bin/bash "$ODOO_USER"
fi

mkdir -p "$ODOO_HOME" "$CUSTOM_ADDONS_DIR" "$OCA_DIR"
mkdir -p /var/log/$ODOO_USER
mkdir -p "$EDU_BACKUP_DIR"

log_success "Usuario $ODOO_USER creado."

#===============================================================================
# 7. INSTALACION DE ODOO DESDE CODIGO FUENTE
#===============================================================================

log_info "Descargando Odoo $ODOO_VERSION desde GitHub..."

if [[ ! -d "$ODOO_HOME_EXT" ]]; then
    git clone --depth 1 --branch "$ODOO_VERSION" \
        https://github.com/odoo/odoo.git \
        "$ODOO_HOME_EXT"
else
    log_info "Odoo ya descargado, actualizando..."
    cd "$ODOO_HOME_EXT" && git pull origin "$ODOO_VERSION" || true
fi

log_success "Odoo $ODOO_VERSION descargado."

#===============================================================================
# 8. ENTORNO VIRTUAL DE PYTHON Y DEPENDENCIAS
#===============================================================================

log_info "Creando entorno virtual de Python e instalando dependencias..."

VENV_DIR="$ODOO_HOME/venv"

if [[ -d "$VENV_DIR" ]] && ! "$VENV_DIR/bin/python3" --version &>/dev/null; then
    log_warn "Entorno virtual existente esta danado. Recreando..."
    rm -rf "$VENV_DIR"
fi

if [[ ! -d "$VENV_DIR" ]]; then
    ${PYTHON_EXACT} -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

pip install --no-cache-dir --upgrade pip setuptools wheel

sed -i 's/^psycopg2.*$/psycopg2-binary/' "$ODOO_HOME_EXT/requirements.txt" 2>/dev/null || true

pip install --no-cache-dir --only-binary=lxml lxml 2>/dev/null || \
    pip install --no-cache-dir lxml

pip install --no-cache-dir psycopg2-binary

pip install --no-cache-dir -r "$ODOO_HOME_EXT/requirements.txt"

pip install --no-cache-dir \
    phonenumbers \
    num2words \
    python-stdnum \
    pyOpenSSL \
    cryptography \
    chardet \
    unidecode \
    xlrd \
    xlsxwriter \
    openpyxl \
    pycryptodome \
    suds-community \
    zeep \
    aeat-web-services \
    pytz \
    Babel \
    lxml \
    html2text \
    python-dateutil \
    vatnumber 2>/dev/null || true

pip install --no-cache-dir \
    odoo-test-helper \
    openupgradelib 2>/dev/null || true

deactivate

log_success "Entorno virtual y dependencias instaladas."

#===============================================================================
# 9. MODULOS OCA — LOCALIZACION ESPANOLA, MULTIEMPRESA, REBRANDING
#===============================================================================

clone_oca_repo() {
    local repo_name="$1"
    local target_dir="$OCA_DIR/$repo_name"

    if [[ ! -d "$target_dir" ]]; then
        log_info "Clonando OCA/$repo_name..."
        git clone --depth 1 --branch "$ODOO_VERSION" \
            "https://github.com/OCA/${repo_name}.git" \
            "$target_dir" 2>/dev/null || {
            log_warn "No se pudo clonar OCA/$repo_name (rama $ODOO_VERSION). Probando rama principal..."
            git clone --depth 1 \
                "https://github.com/OCA/${repo_name}.git" \
                "$target_dir" 2>/dev/null || {
                log_error "Fallo la clonacion de OCA/$repo_name. Continuando..."
                return 1
            }
        }
    else
        log_info "OCA/$repo_name ya existe, actualizando..."
        cd "$target_dir" && git pull 2>/dev/null || true
    fi

    if [[ -f "$target_dir/requirements.txt" ]]; then
        source "$VENV_DIR/bin/activate"
        pip install -r "$target_dir/requirements.txt" 2>/dev/null || true
        deactivate
    fi

    return 0
}

log_info "Instalando modulos OCA..."

# --- Localizacion espanola ---
if [[ "$OCA_L10N_SPAIN" == true ]]; then
    clone_oca_repo "l10n-spain"
fi

# --- Multiempresa ---
if [[ "$OCA_MULTI_COMPANY" == true ]]; then
    clone_oca_repo "multi-company"
fi

# --- Rebranding (marca blanca) ---
if [[ "$OCA_BRAND" == true ]]; then
    clone_oca_repo "brand"
    clone_oca_repo "server-brand"
fi

# --- Contabilidad y finanzas ---
if [[ "$OCA_ACCOUNT_FINANCIAL_TOOLS" == true ]]; then
    clone_oca_repo "account-financial-tools"
fi

if [[ "$OCA_ACCOUNT_PAYMENT" == true ]]; then
    clone_oca_repo "account-payment"
fi

if [[ "$OCA_BANK_PAYMENT" == true ]]; then
    clone_oca_repo "bank-payment"
fi

if [[ "$OCA_REPORTING_ENGINE" == true ]]; then
    clone_oca_repo "reporting-engine"
fi

if [[ "$OCA_COMMUNITY_DATA_FILES" == true ]]; then
    clone_oca_repo "community-data-files"
fi

if [[ "$OCA_SERVER_TOOLS" == true ]]; then
    clone_oca_repo "server-tools"
fi

if [[ "$OCA_WEB" == true ]]; then
    clone_oca_repo "web"
fi

if [[ "$OCA_QUEUE" == true ]]; then
    clone_oca_repo "queue"
fi

if [[ "$OCA_PARTNER_CONTACT" == true ]]; then
    clone_oca_repo "partner-contact"
fi

if [[ "$OCA_MIS_BUILDER" == true ]]; then
    clone_oca_repo "mis-builder"
fi

# --- Repositorios adicionales ---
clone_oca_repo "account-financial-reporting"
clone_oca_repo "account-invoicing"
clone_oca_repo "account-closing"
clone_oca_repo "account-analytic"
clone_oca_repo "account-reconcile"
clone_oca_repo "credit-control"
clone_oca_repo "currency"
clone_oca_repo "intrastat-extrastat"
clone_oca_repo "product-attribute"
clone_oca_repo "purchase-workflow"
clone_oca_repo "sale-workflow"
clone_oca_repo "stock-logistics-workflow"
clone_oca_repo "stock-logistics-warehouse"
clone_oca_repo "hr"
clone_oca_repo "hr-attendance"
clone_oca_repo "hr-expense"
clone_oca_repo "hr-holidays"
clone_oca_repo "project"
clone_oca_repo "manufacture"
clone_oca_repo "management-system"
clone_oca_repo "connector"
clone_oca_repo "edi"
clone_oca_repo "delivery-carrier"
clone_oca_repo "e-commerce"
clone_oca_repo "pos"
clone_oca_repo "crm"
clone_oca_repo "social"
clone_oca_repo "website"
clone_oca_repo "maintenance"
clone_oca_repo "knowledge"

log_success "Modulos OCA instalados."

#===============================================================================
# 10. CONSTRUIR RUTA DE ADDONS
#===============================================================================

log_info "Construyendo ruta de addons..."

ADDONS_PATH="$ODOO_HOME_EXT/addons,$ODOO_HOME_EXT/odoo/addons,$CUSTOM_ADDONS_DIR"

for dir in "$OCA_DIR"/*/; do
    if [[ -d "$dir" ]]; then
        ADDONS_PATH="$ADDONS_PATH,$dir"
    fi
done

log_success "Ruta de addons configurada."

#===============================================================================
# 11. ARCHIVO DE CONFIGURACION DE ODOO
#===============================================================================

log_info "Creando archivo de configuracion de Odoo..."

cat > "$ODOO_CONF" << EOF
[options]
; ============================================
; Configuracion general
; ============================================
admin_passwd = $ADMIN_PASSWORD
db_host = $DB_HOST
db_port = $DB_PORT
db_user = $DB_USER
db_password = $DB_PASSWORD
db_name = False
dbfilter = .*

; ============================================
; Rutas
; ============================================
addons_path = $ADDONS_PATH
data_dir = $ODOO_HOME/.local/share/Odoo

; ============================================
; Red
; ============================================
http_port = $ODOO_PORT
longpolling_port = $ODOO_LONGPOLLING_PORT
proxy_mode = True

; ============================================
; Rendimiento (ajustado para uso educativo)
; ============================================
workers = 6
max_cron_threads = 2
limit_memory_hard = 2684354560
limit_memory_soft = 2147483648
limit_request = 8192
limit_time_cpu = 600
limit_time_real = 1200
limit_time_real_cron = -1
db_maxconn = 64

; ============================================
; Logging
; ============================================
logfile = /var/log/$ODOO_USER/odoo-server.log
log_level = info
log_handler = :INFO
logrotate = True
syslog = False

; ============================================
; Idioma
; ============================================
load_language = es_ES

; ============================================
; Seguridad y multiempresa
; ============================================
list_db = True
csv_internal_sep = ;

; ============================================
; Modulos por defecto
; ============================================
server_wide_modules = base,web
EOF

log_success "Archivo de configuracion creado en $ODOO_CONF."

#===============================================================================
# 12. PERMISOS
#===============================================================================

log_info "Configurando permisos..."

chown -R "$ODOO_USER":"$ODOO_USER" "$ODOO_HOME"
chown "$ODOO_USER":"$ODOO_USER" "$ODOO_CONF"
chmod 640 "$ODOO_CONF"
chown -R "$ODOO_USER":"$ODOO_USER" /var/log/$ODOO_USER
chown -R "$ODOO_USER":"$ODOO_USER" "$EDU_BACKUP_DIR"

log_success "Permisos configurados."

#===============================================================================
# 13. SERVICIO SYSTEMD
#===============================================================================

log_info "Creando servicio systemd..."

cat > /etc/systemd/system/${ODOO_USER}.service << EOF
[Unit]
Description=Odoo $ODOO_VERSION - Servidor ERP Educativo
Documentation=https://www.odoo.com/documentation/$ODOO_VERSION
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
SyslogIdentifier=${ODOO_USER}
PermissionsStartOnly=true
User=${ODOO_USER}
Group=${ODOO_USER}
ExecStart=${VENV_DIR}/bin/python ${ODOO_HOME_EXT}/odoo-bin -c ${ODOO_CONF}
WorkingDirectory=${ODOO_HOME_EXT}
StandardOutput=journal+console

Restart=on-failure
RestartSec=5

LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${ODOO_USER}.service

log_success "Servicio systemd creado y habilitado."

#===============================================================================
# 14. CONFIGURACION DE NGINX (OPCIONAL)
#===============================================================================

if [[ "$INSTALL_NGINX" == true ]]; then
    log_info "Instalando y configurando Nginx..."

    apt-get install -y -qq nginx

    cat > /etc/nginx/sites-available/$ODOO_USER << 'NGINX_EOF'
upstream odoo {
    server 127.0.0.1:ODOO_PORT_PLACEHOLDER;
}
upstream odoochat {
    server 127.0.0.1:ODOO_LONGPOLLING_PORT_PLACEHOLDER;
}

server {
    listen 80;
    server_name WEBSITE_NAME_PLACEHOLDER;

    proxy_read_timeout 720s;
    proxy_connect_timeout 720s;
    proxy_send_timeout 720s;

    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $http_host;

    access_log /var/log/nginx/odoo.access.log;
    error_log /var/log/nginx/odoo.error.log;

    location /longpolling {
        proxy_pass http://odoochat;
    }

    location /websocket {
        proxy_pass http://odoochat;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        proxy_redirect off;
        proxy_pass http://odoo;
    }

    location ~* /web/static/ {
        proxy_cache_valid 200 90m;
        proxy_buffering on;
        expires 864000;
        proxy_pass http://odoo;
    }

    client_max_body_size 200m;

    gzip_types text/css text/scss text/plain text/xml application/xml
               application/json application/javascript;
    gzip on;
}
NGINX_EOF

    sed -i "s/ODOO_PORT_PLACEHOLDER/$ODOO_PORT/g" /etc/nginx/sites-available/$ODOO_USER
    sed -i "s/ODOO_LONGPOLLING_PORT_PLACEHOLDER/$ODOO_LONGPOLLING_PORT/g" /etc/nginx/sites-available/$ODOO_USER
    sed -i "s/WEBSITE_NAME_PLACEHOLDER/$WEBSITE_NAME/g" /etc/nginx/sites-available/$ODOO_USER

    ln -sf /etc/nginx/sites-available/$ODOO_USER /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    nginx -t && systemctl restart nginx
    systemctl enable nginx

    log_success "Nginx instalado y configurado."
fi

#===============================================================================
# 15. CONFIGURACION DEL FIREWALL (UFW)
#===============================================================================

if command -v ufw &>/dev/null; then
    log_info "Configurando firewall (UFW)..."

    ufw allow 22/tcp >/dev/null 2>&1 || true
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
    ufw allow ${ODOO_PORT}/tcp >/dev/null 2>&1 || true

    log_success "Firewall configurado."
fi

#===============================================================================
# 16. CONFIGURAR LOGROTATE
#===============================================================================

log_info "Configurando logrotate..."

cat > /etc/logrotate.d/$ODOO_USER << EOF
/var/log/$ODOO_USER/*.log {
    weekly
    rotate 52
    missingok
    notifempty
    compress
    delaycompress
    sharedscripts
    postrotate
        systemctl reload $ODOO_USER > /dev/null 2>&1 || true
    endscript
}
EOF

log_success "Logrotate configurado."

#===============================================================================
# 17. COPIAS DE SEGURIDAD AUTOMATICAS (CRON)
#===============================================================================

log_info "Configurando copias de seguridad automaticas..."

cat > /usr/local/bin/odoo_backup_auto.sh << 'BACKUP_SCRIPT'
#!/bin/bash
BACKUP_DIR="BACKUP_DIR_PLACEHOLDER"
ODOO_USER="ODOO_USER_PLACEHOLDER"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=RETENTION_PLACEHOLDER

mkdir -p "$BACKUP_DIR"

for db in $(sudo -u postgres psql -t -c "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres','template0','template1');" 2>/dev/null); do
    db=$(echo "$db" | xargs)
    if [[ -n "$db" ]]; then
        DUMP_FILE="$BACKUP_DIR/${db}_${TIMESTAMP}.sql.gz"
        sudo -u postgres pg_dump "$db" 2>/dev/null | gzip > "$DUMP_FILE"
        if [[ $? -eq 0 ]]; then
            echo "[OK] Backup: $DUMP_FILE"
        else
            echo "[ERROR] Fallo backup de: $db"
        fi
    fi
done

find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null
echo "[OK] Limpieza de backups antiguos (>${RETENTION_DAYS} dias) completada."
BACKUP_SCRIPT

sed -i "s|BACKUP_DIR_PLACEHOLDER|$EDU_BACKUP_DIR|g" /usr/local/bin/odoo_backup_auto.sh
sed -i "s|ODOO_USER_PLACEHOLDER|$ODOO_USER|g" /usr/local/bin/odoo_backup_auto.sh
sed -i "s|RETENTION_PLACEHOLDER|$EDU_BACKUP_RETENTION_DAYS|g" /usr/local/bin/odoo_backup_auto.sh
chmod +x /usr/local/bin/odoo_backup_auto.sh

(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/odoo_backup_auto.sh >> /var/log/$ODOO_USER/backup.log 2>&1") | sort -u | crontab -

log_success "Copias de seguridad automaticas configuradas (diario a las 02:00)."

#===============================================================================
# 18. SCRIPTS AUXILIARES EDUCATIVOS
#===============================================================================

log_info "Creando scripts auxiliares educativos..."

# --- Script: Crear alumnos masivamente ---
cat > /usr/local/bin/odoo_crear_alumnos.sh << 'ALUMNOS_SCRIPT'
#!/bin/bash
################################################################################
# Crear alumnos masivamente en Odoo (multi-grupo, multi-profesor)
# Cada alumno obtiene:
#   - Su propia base de datos con datos de demostracion
#   - Un usuario con permisos limitados a su empresa
#   - Idioma espanol y plan contable espanol precargado
#
# Los profesores reciben acceso de administrador a todas las BDs.
#
# Uso: sudo bash odoo_crear_alumnos.sh
################################################################################

set -euo pipefail

ODOO_USER="ODOO_USER_PLACEHOLDER"
ODOO_HOME="ODOO_HOME_PLACEHOLDER"
ODOO_CONF="ODOO_CONF_PLACEHOLDER"
VENV_DIR="$ODOO_HOME/venv"
ODOO_BIN="$ODOO_HOME/ODOO_USER_PLACEHOLDER-server/odoo-bin"

# Grupos: nombre|numAlumnos|dbPrefix|passwordPrefix|profNombre|profUsuario|profPassword (separados por ;)
EDU_GRUPOS="EDU_GRUPOS_PLACEHOLDER"

# Branding
BRAND_COMPANY_WEBSITE="BRAND_WEBSITE_PLACEHOLDER"
BRAND_COMPANY_EMAIL="BRAND_EMAIL_PLACEHOLDER"
BRAND_COMPANY_PHONE="BRAND_PHONE_PLACEHOLDER"
BRAND_COMPANY_STREET="BRAND_STREET_PLACEHOLDER"
BRAND_COMPANY_CITY="BRAND_CITY_PLACEHOLDER"
BRAND_COMPANY_ZIP="BRAND_ZIP_PLACEHOLDER"
BRAND_PRIMARY_COLOR="BRAND_PRIMARY_COLOR_PLACEHOLDER"
BRAND_SECONDARY_COLOR="BRAND_SECONDARY_COLOR_PLACEHOLDER"
BRAND_LOGO_URL="BRAND_LOGO_URL_PLACEHOLDER"
BRAND_FAVICON_URL="BRAND_FAVICON_URL_PLACEHOLDER"

CREDENTIALS_FILE="$ODOO_HOME/credenciales_alumnos.csv"
echo "grupo,profesor,alumno,base_datos,usuario,contrasena,url" > "$CREDENTIALS_FILE"

SERVER_IP=$(hostname -I | awk '{print $1}')

# Descargar logo una sola vez si se proporcionó URL
LOGO_B64=""
if [[ -n "$BRAND_LOGO_URL" ]]; then
    LOGO_TMP="/tmp/brand_logo_$$.png"
    if wget -q -O "$LOGO_TMP" "$BRAND_LOGO_URL" 2>/dev/null; then
        LOGO_B64=$(base64 -w0 "$LOGO_TMP" 2>/dev/null)
        rm -f "$LOGO_TMP"
    fi
fi

FAV_B64=""
if [[ -n "$BRAND_FAVICON_URL" ]]; then
    FAV_TMP="/tmp/brand_favicon_$$.png"
    if wget -q -O "$FAV_TMP" "$BRAND_FAVICON_URL" 2>/dev/null; then
        FAV_B64=$(base64 -w0 "$FAV_TMP" 2>/dev/null)
        rm -f "$FAV_TMP"
    fi
fi

# Iterar sobre los grupos (cada uno con su profesor asignado)
IFS=';' read -ra GRUPOS <<< "$EDU_GRUPOS"
for GRUPO_DEF in "${GRUPOS[@]}"; do
    IFS='|' read -r GRUPO_NOMBRE GRUPO_NUM GRUPO_DB_PREFIX GRUPO_PWD_PREFIX PROF_NOMBRE PROF_USER PROF_PWD <<< "$GRUPO_DEF"

    echo ""
    echo "============================================================"
    echo " Grupo: $GRUPO_NOMBRE"
    echo " Profesor: $PROF_NOMBRE ($PROF_USER)"
    echo " Creando $GRUPO_NUM bases de datos"
    echo " Prefijo BD: ${GRUPO_DB_PREFIX}"
    echo " Prefijo usuario: ${GRUPO_PWD_PREFIX}"
    echo "============================================================"

    GRUPO_DB_NAMES=()

    for i in $(seq -w 1 "$GRUPO_NUM"); do
        DB_NAME="${GRUPO_DB_PREFIX}${i}"
        USER_LOGIN="${GRUPO_PWD_PREFIX}${i}"
        USER_PWD="${GRUPO_PWD_PREFIX}${i}"
        EMPRESA_NOMBRE="$GRUPO_NOMBRE - Alumno ${i}"

        echo -n "  [$GRUPO_NOMBRE] Creando alumno $i ($DB_NAME)... "

        sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 && {
            echo "ya existe, saltando."
            GRUPO_DB_NAMES+=("$DB_NAME")
            continue
        }

        sudo -u "$ODOO_USER" "$VENV_DIR/bin/python" "$ODOO_BIN" \
            -c "$ODOO_CONF" \
            -d "$DB_NAME" \
            -i base,l10n_es,contacts,sale_management,purchase,stock,account,point_of_sale,hr,project,crm,mrp \
            --load-language=es_ES \
            --without-demo=False \
            --stop-after-init 2>/dev/null

        if [[ $? -eq 0 ]]; then
            # Aplicar branding a la empresa
            BRAND_SQL="UPDATE res_company SET name='$EMPRESA_NOMBRE'"
            [[ -n "$BRAND_COMPANY_WEBSITE" ]] && BRAND_SQL="$BRAND_SQL, website='$BRAND_COMPANY_WEBSITE'"
            [[ -n "$BRAND_COMPANY_EMAIL" ]] && BRAND_SQL="$BRAND_SQL, email='$BRAND_COMPANY_EMAIL'"
            [[ -n "$BRAND_COMPANY_PHONE" ]] && BRAND_SQL="$BRAND_SQL, phone='$BRAND_COMPANY_PHONE'"
            [[ -n "$BRAND_COMPANY_STREET" ]] && BRAND_SQL="$BRAND_SQL, street='$BRAND_COMPANY_STREET'"
            [[ -n "$BRAND_COMPANY_CITY" ]] && BRAND_SQL="$BRAND_SQL, city='$BRAND_COMPANY_CITY'"
            [[ -n "$BRAND_COMPANY_ZIP" ]] && BRAND_SQL="$BRAND_SQL, zip='$BRAND_COMPANY_ZIP'"
            [[ -n "$BRAND_PRIMARY_COLOR" ]] && BRAND_SQL="$BRAND_SQL, primary_color='$BRAND_PRIMARY_COLOR'"
            [[ -n "$BRAND_SECONDARY_COLOR" ]] && BRAND_SQL="$BRAND_SQL, secondary_color='$BRAND_SECONDARY_COLOR'"
            BRAND_SQL="$BRAND_SQL WHERE id=1;"
            sudo -u postgres psql -d "$DB_NAME" -c "$BRAND_SQL" 2>/dev/null

            sudo -u postgres psql -d "$DB_NAME" -c "
                UPDATE res_partner SET name='$EMPRESA_NOMBRE' WHERE id=1;
            " 2>/dev/null

            # Aplicar logo
            if [[ -n "$LOGO_B64" ]]; then
                sudo -u postgres psql -d "$DB_NAME" -c "
                    UPDATE res_company SET logo=decode('$LOGO_B64','base64') WHERE id=1;
                " 2>/dev/null
            fi

            # Aplicar favicon
            if [[ -n "$FAV_B64" ]]; then
                sudo -u postgres psql -d "$DB_NAME" -c "
                    UPDATE res_company SET favicon=decode('$FAV_B64','base64') WHERE id=1;
                " 2>/dev/null
            fi

            # Crear usuario alumno
            sudo -u postgres psql -d "$DB_NAME" -c "
                INSERT INTO res_users (login, password, name, company_id, active, notification_type)
                SELECT '$USER_LOGIN', '$USER_PWD', '$GRUPO_NOMBRE - Alumno $i', 1, true, 'email'
                WHERE NOT EXISTS (SELECT 1 FROM res_users WHERE login='$USER_LOGIN');
            " 2>/dev/null

            GRUPO_DB_NAMES+=("$DB_NAME")
            echo "$GRUPO_NOMBRE,$PROF_USER,$USER_LOGIN,$DB_NAME,$USER_LOGIN,$USER_PWD,http://${SERVER_IP}/web?db=$DB_NAME" >> "$CREDENTIALS_FILE"
            echo "OK"
        else
            echo "ERROR"
        fi
    done

    # Crear el profesor de este grupo SOLO en las BDs de su grupo
    echo ""
    echo "  Creando profesor '$PROF_NOMBRE' en las BDs de '$GRUPO_NOMBRE'..."
    for DB_NAME in "${GRUPO_DB_NAMES[@]}"; do
        sudo -u postgres psql -d "$DB_NAME" -c "
            INSERT INTO res_users (login, password, name, company_id, active, notification_type)
            SELECT '$PROF_USER', '$PROF_PWD', '$PROF_NOMBRE', 1, true, 'email'
            WHERE NOT EXISTS (SELECT 1 FROM res_users WHERE login='$PROF_USER');
        " 2>/dev/null

        sudo -u postgres psql -d "$DB_NAME" -c "
            UPDATE res_users SET groups_id = (
                SELECT array_agg(id) FROM res_groups WHERE category_id IN (
                    SELECT id FROM ir_module_category WHERE name IN ('Administration', 'Technical')
                )
            ) WHERE login='$PROF_USER';
        " 2>/dev/null || true
    done
    echo "  Profesor '$PROF_NOMBRE' creado en ${#GRUPO_DB_NAMES[@]} bases de datos."
done

chmod 600 "$CREDENTIALS_FILE"
chown "$ODOO_USER":"$ODOO_USER" "$CREDENTIALS_FILE"

echo ""
echo "============================================================"
echo " ALUMNOS CREADOS EXITOSAMENTE"
echo "============================================================"
echo " Archivo de credenciales: $CREDENTIALS_FILE"
echo ""
echo " Grupos (cada profesor solo accede a su grupo):"
IFS=';' read -ra GRUPOS_FIN <<< "$EDU_GRUPOS"
for GRUPO_DEF in "${GRUPOS_FIN[@]}"; do
    IFS='|' read -r GRUPO_NOMBRE GRUPO_NUM GRUPO_DB_PREFIX GRUPO_PWD_PREFIX PROF_NOMBRE PROF_USER PROF_PWD <<< "$GRUPO_DEF"
    echo "   - $GRUPO_NOMBRE: ${GRUPO_NUM} alumnos (BD: ${GRUPO_DB_PREFIX}XX, User: ${GRUPO_PWD_PREFIX}XX)"
    echo "     Profesor: $PROF_NOMBRE (usuario: $PROF_USER)"
done
echo "============================================================"
ALUMNOS_SCRIPT

sed -i "s|ODOO_USER_PLACEHOLDER|$ODOO_USER|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|ODOO_HOME_PLACEHOLDER|$ODOO_HOME|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|ODOO_CONF_PLACEHOLDER|$ODOO_CONF|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|EDU_GRUPOS_PLACEHOLDER|$EDU_GRUPOS|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|BRAND_WEBSITE_PLACEHOLDER|$BRAND_COMPANY_WEBSITE|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|BRAND_EMAIL_PLACEHOLDER|$BRAND_COMPANY_EMAIL|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|BRAND_PHONE_PLACEHOLDER|$BRAND_COMPANY_PHONE|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|BRAND_STREET_PLACEHOLDER|$BRAND_COMPANY_STREET|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|BRAND_CITY_PLACEHOLDER|$BRAND_COMPANY_CITY|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|BRAND_ZIP_PLACEHOLDER|$BRAND_COMPANY_ZIP|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|BRAND_PRIMARY_COLOR_PLACEHOLDER|$BRAND_PRIMARY_COLOR|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|BRAND_SECONDARY_COLOR_PLACEHOLDER|$BRAND_SECONDARY_COLOR|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|BRAND_LOGO_URL_PLACEHOLDER|$BRAND_LOGO_URL|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|BRAND_FAVICON_URL_PLACEHOLDER|$BRAND_FAVICON_URL|g" /usr/local/bin/odoo_crear_alumnos.sh
chmod +x /usr/local/bin/odoo_crear_alumnos.sh

# --- Script: Resetear BD de un alumno ---
cat > /usr/local/bin/odoo_reset_alumno.sh << 'RESET_SCRIPT'
#!/bin/bash
################################################################################
# Resetear la base de datos de un alumno
# Crea un backup antes de eliminar y recrea la BD con datos de demostracion
#
# Uso: sudo bash odoo_reset_alumno.sh <nombre_bd>
# Ejemplo: sudo bash odoo_reset_alumno.sh empresa05
################################################################################

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Uso: $0 <nombre_bd>"
    echo "Ejemplo: $0 empresa05"
    exit 1
fi

DB_NAME="$1"
ODOO_USER="ODOO_USER_PLACEHOLDER"
ODOO_HOME="ODOO_HOME_PLACEHOLDER"
ODOO_CONF="ODOO_CONF_PLACEHOLDER"
VENV_DIR="$ODOO_HOME/venv"
ODOO_BIN="$ODOO_HOME/ODOO_USER_PLACEHOLDER-server/odoo-bin"
BACKUP_DIR="BACKUP_DIR_PLACEHOLDER"

# Branding
BRAND_COMPANY_WEBSITE="BRAND_WEBSITE_PLACEHOLDER"
BRAND_COMPANY_EMAIL="BRAND_EMAIL_PLACEHOLDER"
BRAND_COMPANY_PHONE="BRAND_PHONE_PLACEHOLDER"
BRAND_COMPANY_STREET="BRAND_STREET_PLACEHOLDER"
BRAND_COMPANY_CITY="BRAND_CITY_PLACEHOLDER"
BRAND_COMPANY_ZIP="BRAND_ZIP_PLACEHOLDER"
BRAND_PRIMARY_COLOR="BRAND_PRIMARY_COLOR_PLACEHOLDER"
BRAND_SECONDARY_COLOR="BRAND_SECONDARY_COLOR_PLACEHOLDER"
BRAND_LOGO_URL="BRAND_LOGO_URL_PLACEHOLDER"
BRAND_FAVICON_URL="BRAND_FAVICON_URL_PLACEHOLDER"

echo "============================================================"
echo " Reseteando base de datos: $DB_NAME"
echo "============================================================"

# Verificar que la BD existe
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || {
    echo "ERROR: La base de datos '$DB_NAME' no existe."
    exit 1
}

# Backup antes de borrar
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "Creando backup previo..."
sudo -u postgres pg_dump "$DB_NAME" 2>/dev/null | gzip > "$BACKUP_DIR/${DB_NAME}_pre_reset_${TIMESTAMP}.sql.gz" || true

# Cerrar conexiones activas
echo "Cerrando conexiones activas..."
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" 2>/dev/null || true

# Eliminar BD
echo "Eliminando base de datos..."
sudo -u postgres dropdb "$DB_NAME" 2>/dev/null || true

# Recrear con datos demo
echo "Recreando base de datos con datos de demostracion..."
sudo -u "$ODOO_USER" "$VENV_DIR/bin/python" "$ODOO_BIN" \
    -c "$ODOO_CONF" \
    -d "$DB_NAME" \
    -i base,l10n_es,contacts,sale_management,purchase,stock,account,point_of_sale,hr,project,crm,mrp \
    --load-language=es_ES \
    --without-demo=False \
    --stop-after-init 2>/dev/null

# Aplicar branding
BRAND_SQL="UPDATE res_company SET name='$DB_NAME'"
[[ -n "$BRAND_COMPANY_WEBSITE" ]] && BRAND_SQL="$BRAND_SQL, website='$BRAND_COMPANY_WEBSITE'"
[[ -n "$BRAND_COMPANY_EMAIL" ]] && BRAND_SQL="$BRAND_SQL, email='$BRAND_COMPANY_EMAIL'"
[[ -n "$BRAND_COMPANY_PHONE" ]] && BRAND_SQL="$BRAND_SQL, phone='$BRAND_COMPANY_PHONE'"
[[ -n "$BRAND_COMPANY_STREET" ]] && BRAND_SQL="$BRAND_SQL, street='$BRAND_COMPANY_STREET'"
[[ -n "$BRAND_COMPANY_CITY" ]] && BRAND_SQL="$BRAND_SQL, city='$BRAND_COMPANY_CITY'"
[[ -n "$BRAND_COMPANY_ZIP" ]] && BRAND_SQL="$BRAND_SQL, zip='$BRAND_COMPANY_ZIP'"
[[ -n "$BRAND_PRIMARY_COLOR" ]] && BRAND_SQL="$BRAND_SQL, primary_color='$BRAND_PRIMARY_COLOR'"
[[ -n "$BRAND_SECONDARY_COLOR" ]] && BRAND_SQL="$BRAND_SQL, secondary_color='$BRAND_SECONDARY_COLOR'"
BRAND_SQL="$BRAND_SQL WHERE id=1;"
sudo -u postgres psql -d "$DB_NAME" -c "$BRAND_SQL" 2>/dev/null

sudo -u postgres psql -d "$DB_NAME" -c "
    UPDATE res_partner SET name='$DB_NAME' WHERE id=1;
" 2>/dev/null

# Descargar y aplicar logo si se proporcionó URL
if [[ -n "$BRAND_LOGO_URL" ]]; then
    LOGO_TMP="/tmp/brand_logo_$$.png"
    if wget -q -O "$LOGO_TMP" "$BRAND_LOGO_URL" 2>/dev/null; then
        LOGO_B64=$(base64 -w0 "$LOGO_TMP" 2>/dev/null)
        if [[ -n "$LOGO_B64" ]]; then
            sudo -u postgres psql -d "$DB_NAME" -c "
                UPDATE res_company SET logo=decode('$LOGO_B64','base64') WHERE id=1;
            " 2>/dev/null
        fi
        rm -f "$LOGO_TMP"
    fi
fi

# Descargar y aplicar favicon si se proporcionó URL
if [[ -n "$BRAND_FAVICON_URL" ]]; then
    FAV_TMP="/tmp/brand_favicon_$$.png"
    if wget -q -O "$FAV_TMP" "$BRAND_FAVICON_URL" 2>/dev/null; then
        FAV_B64=$(base64 -w0 "$FAV_TMP" 2>/dev/null)
        if [[ -n "$FAV_B64" ]]; then
            sudo -u postgres psql -d "$DB_NAME" -c "
                UPDATE res_company SET favicon=decode('$FAV_B64','base64') WHERE id=1;
            " 2>/dev/null
        fi
        rm -f "$FAV_TMP"
    fi
fi

echo ""
echo "============================================================"
echo " Base de datos $DB_NAME reseteada correctamente"
echo " Backup previo: $BACKUP_DIR/${DB_NAME}_pre_reset_${TIMESTAMP}.sql.gz"
echo "============================================================"
RESET_SCRIPT

sed -i "s|ODOO_USER_PLACEHOLDER|$ODOO_USER|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|ODOO_HOME_PLACEHOLDER|$ODOO_HOME|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|ODOO_CONF_PLACEHOLDER|$ODOO_CONF|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|BACKUP_DIR_PLACEHOLDER|$EDU_BACKUP_DIR|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|BRAND_WEBSITE_PLACEHOLDER|$BRAND_COMPANY_WEBSITE|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|BRAND_EMAIL_PLACEHOLDER|$BRAND_COMPANY_EMAIL|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|BRAND_PHONE_PLACEHOLDER|$BRAND_COMPANY_PHONE|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|BRAND_STREET_PLACEHOLDER|$BRAND_COMPANY_STREET|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|BRAND_CITY_PLACEHOLDER|$BRAND_COMPANY_CITY|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|BRAND_ZIP_PLACEHOLDER|$BRAND_COMPANY_ZIP|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|BRAND_PRIMARY_COLOR_PLACEHOLDER|$BRAND_PRIMARY_COLOR|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|BRAND_SECONDARY_COLOR_PLACEHOLDER|$BRAND_SECONDARY_COLOR|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|BRAND_LOGO_URL_PLACEHOLDER|$BRAND_LOGO_URL|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|BRAND_FAVICON_URL_PLACEHOLDER|$BRAND_FAVICON_URL|g" /usr/local/bin/odoo_reset_alumno.sh
chmod +x /usr/local/bin/odoo_reset_alumno.sh

# --- Script: Backup manual ---
cat > /usr/local/bin/odoo_backup.sh << 'MANUAL_BACKUP'
#!/bin/bash
################################################################################
# Backup manual de todas las bases de datos de Odoo
# Uso: sudo bash odoo_backup.sh
################################################################################

BACKUP_DIR="BACKUP_DIR_PLACEHOLDER"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "============================================================"
echo " Backup manual de todas las bases de datos"
echo " Directorio: $BACKUP_DIR"
echo " Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"

COUNT=0
for db in $(sudo -u postgres psql -t -c "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres','template0','template1');" 2>/dev/null); do
    db=$(echo "$db" | xargs)
    if [[ -n "$db" ]]; then
        DUMP_FILE="$BACKUP_DIR/${db}_${TIMESTAMP}.sql.gz"
        echo -n "  Backup $db... "
        sudo -u postgres pg_dump "$db" 2>/dev/null | gzip > "$DUMP_FILE"
        if [[ $? -eq 0 ]]; then
            SIZE=$(du -h "$DUMP_FILE" | cut -f1)
            echo "OK ($SIZE)"
            COUNT=$((COUNT + 1))
        else
            echo "ERROR"
        fi
    fi
done

echo ""
echo "============================================================"
echo " $COUNT bases de datos respaldadas en: $BACKUP_DIR"
echo "============================================================"
MANUAL_BACKUP

sed -i "s|BACKUP_DIR_PLACEHOLDER|$EDU_BACKUP_DIR|g" /usr/local/bin/odoo_backup.sh
chmod +x /usr/local/bin/odoo_backup.sh

# --- Script: Restaurar BD de alumno desde backup ---
cat > /usr/local/bin/odoo_restaurar_alumno.sh << 'RESTORE_SCRIPT'
#!/bin/bash
################################################################################
# Restaurar base de datos de un alumno desde backup
# Uso: sudo bash odoo_restaurar_alumno.sh <archivo_backup.sql.gz>
# Ejemplo: sudo bash odoo_restaurar_alumno.sh /var/backups/odoo/empresa05_20240101_020000.sql.gz
################################################################################

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Uso: $0 <archivo_backup.sql.gz>"
    echo ""
    echo "Backups disponibles:"
    ls -lht BACKUP_DIR_PLACEHOLDER/*.sql.gz 2>/dev/null | head -20
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME=$(basename "$BACKUP_FILE" | sed 's/_[0-9]\{8\}_[0-9]\{6\}\.sql\.gz$//')

echo "============================================================"
echo " Restaurando base de datos: $DB_NAME"
echo " Desde: $BACKUP_FILE"
echo "============================================================"

sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" 2>/dev/null || true
sudo -u postgres dropdb "$DB_NAME" 2>/dev/null || true
sudo -u postgres createdb "$DB_NAME" 2>/dev/null

gunzip -c "$BACKUP_FILE" | sudo -u postgres psql "$DB_NAME" 2>/dev/null

echo ""
echo "Base de datos $DB_NAME restaurada correctamente."
RESTORE_SCRIPT

sed -i "s|BACKUP_DIR_PLACEHOLDER|$EDU_BACKUP_DIR|g" /usr/local/bin/odoo_restaurar_alumno.sh
chmod +x /usr/local/bin/odoo_restaurar_alumno.sh

# --- Script de actualizacion de modulos OCA ---
cat > /usr/local/bin/odoo_actualizar_oca.sh << 'OCA_UPDATE_SCRIPT'
#!/bin/bash
#===============================================================================
# Script de actualizacion segura de modulos OCA
# Solo actualiza repositorios con rama estable para la version instalada.
# Los repos en beta o sin rama se omiten automaticamente.
#===============================================================================

ODOO_USER="ODOO_USER_PLACEHOLDER"
ODOO_HOME="ODOO_HOME_PLACEHOLDER"
ODOO_VERSION="ODOO_VERSION_PLACEHOLDER"
OCA_DIR="$ODOO_HOME/OCA"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}Este script debe ejecutarse como root (sudo).${NC}"
    exit 1
fi

MODE="${1:-safe}"

if [[ "$MODE" != "safe" && "$MODE" != "check" ]]; then
    echo -e "${RED}Modo no reconocido: $MODE${NC}"
    echo "Uso: sudo odoo_actualizar_oca.sh [safe|check]"
    echo "  safe  — Actualiza solo repos con rama estable (por defecto)"
    echo "  check — Solo muestra que repos tienen actualizaciones pendientes"
    exit 1
fi

echo ""
echo "=================================================================="
echo "  ACTUALIZACION DE MODULOS OCA"
echo "  Version Odoo: $ODOO_VERSION"
echo "  Modo: $MODE"
echo "=================================================================="
echo ""

# Marcar directorio OCA como seguro para git (evitar "dubious ownership")
git config --global --add safe.directory "$OCA_DIR" 2>/dev/null || true
for d in "$OCA_DIR"/*/; do
    git config --global --add safe.directory "$d" 2>/dev/null || true
done

updated=0
skipped=0
skipped_no_branch=0
skipped_wrong_branch=0
failed=0
up_to_date=0
skipped_no_branch_list=""
skipped_wrong_branch_list=""

for repo_dir in "$OCA_DIR"/*/; do
    repo_name=$(basename "$repo_dir")

    if [[ ! -d "$repo_dir/.git" ]]; then
        continue
    fi

    cd "$repo_dir"

    current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

    # Verificar si el repo esta en la rama de la version instalada
    if [[ "$current_branch" != "$ODOO_VERSION" ]]; then
        echo -e "${YELLOW}[OMITIDO]${NC} $repo_name — rama actual ($current_branch) distinta a $ODOO_VERSION"
        skipped=$((skipped + 1))
        skipped_wrong_branch=$((skipped_wrong_branch + 1))
        skipped_wrong_branch_list="$skipped_wrong_branch_list $repo_name($current_branch)"
        continue
    fi

    # Verificar si existe rama remota para la version (seguridad adicional)
    has_version_branch=$(git ls-remote --heads origin "$ODOO_VERSION" 2>/dev/null | wc -l || echo "0")

    if [[ "$has_version_branch" -eq 0 ]]; then
        echo -e "${YELLOW}[OMITIDO]${NC} $repo_name — sin rama remota $ODOO_VERSION"
        skipped=$((skipped + 1))
        skipped_no_branch=$((skipped_no_branch + 1))
        skipped_no_branch_list="$skipped_no_branch_list $repo_name"
        continue
    fi

    # Comprobar si hay actualizaciones disponibles
    if ! sudo -u "$ODOO_USER" git fetch origin "$ODOO_VERSION" --quiet 2>/dev/null; then
        echo -e "${YELLOW}[WARN]${NC} $repo_name — no se pudo conectar al remoto, omitiendo"
        skipped=$((skipped + 1))
        continue
    fi

    local_hash=$(git rev-parse HEAD 2>/dev/null || echo "")
    remote_hash=$(git rev-parse "origin/$ODOO_VERSION" 2>/dev/null || echo "")

    if [[ "$local_hash" == "$remote_hash" ]]; then
        echo -e "${GREEN}[OK]${NC} $repo_name — ya actualizado"
        up_to_date=$((up_to_date + 1))
        continue
    fi

    behind=$(git rev-list HEAD.."origin/$ODOO_VERSION" --count 2>/dev/null || echo "?")

    if [[ "$MODE" == "check" ]]; then
        echo -e "${BLUE}[PENDIENTE]${NC} $repo_name — $behind commits nuevos disponibles"
        continue
    fi

    echo -e "${BLUE}[ACTUALIZANDO]${NC} $repo_name ($behind commits)..."
    if sudo -u "$ODOO_USER" git pull origin "$ODOO_VERSION" --quiet 2>/dev/null; then
        echo -e "${GREEN}[OK]${NC} $repo_name — actualizado correctamente"
        updated=$((updated + 1))
    else
        echo -e "${RED}[ERROR]${NC} $repo_name — fallo la actualizacion (se mantiene version anterior)"
        failed=$((failed + 1))
    fi
done

echo ""
echo "=================================================================="
echo "  RESUMEN"
echo "  Ya actualizados:        $up_to_date"
echo "  Actualizados ahora:     $updated"
echo "  Omitidos:               $skipped"
if [[ $skipped_no_branch -gt 0 ]]; then
echo "    - Sin rama remota:    $skipped_no_branch"
fi
if [[ $skipped_wrong_branch -gt 0 ]]; then
echo "    - Rama diferente:     $skipped_wrong_branch"
fi
echo "  Fallidos:               $failed"
echo "=================================================================="

if [[ $skipped_no_branch -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}Modulos sin rama remota $ODOO_VERSION:${NC}"
    echo "  $skipped_no_branch_list"
fi

if [[ $skipped_wrong_branch -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}Modulos en rama diferente (no se tocan):${NC}"
    echo "  $skipped_wrong_branch_list"
fi

if [[ $skipped -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}NOTA: Los modulos omitidos siguen funcionando con la"
    echo "version que tienen instalada. Solo se actualizan los repos"
    echo "que estan en la rama $ODOO_VERSION y tienen rama remota"
    echo "confirmada en GitHub.${NC}"
fi

if [[ "$MODE" != "check" && $updated -gt 0 ]]; then
    echo ""
    echo "Reiniciando servicio Odoo..."
    systemctl restart ${ODOO_USER}.service
    echo -e "${GREEN}Servicio reiniciado.${NC}"
fi

echo ""
echo "Uso: sudo odoo_actualizar_oca.sh [safe|check]"
echo "  safe  — Actualiza solo repos con rama estable (por defecto)"
echo "  check — Solo muestra que repos tienen actualizaciones pendientes"
echo ""
OCA_UPDATE_SCRIPT

sed -i "s|ODOO_USER_PLACEHOLDER|$ODOO_USER|g" /usr/local/bin/odoo_actualizar_oca.sh
sed -i "s|ODOO_HOME_PLACEHOLDER|$ODOO_HOME|g" /usr/local/bin/odoo_actualizar_oca.sh
sed -i "s|ODOO_VERSION_PLACEHOLDER|$ODOO_VERSION|g" /usr/local/bin/odoo_actualizar_oca.sh
chmod +x /usr/local/bin/odoo_actualizar_oca.sh

log_success "Scripts auxiliares educativos creados."

#===============================================================================
# 19. INICIAR ODOO
#===============================================================================

log_info "Iniciando el servicio de Odoo..."

systemctl start ${ODOO_USER}.service

sleep 5

if systemctl is-active --quiet ${ODOO_USER}.service; then
    log_success "Odoo esta funcionando correctamente."
else
    log_error "Odoo no se inicio correctamente. Revisa los logs:"
    log_error "  journalctl -u ${ODOO_USER}.service -n 50"
    log_error "  cat /var/log/$ODOO_USER/odoo-server.log"
fi

#===============================================================================
# 20. RESUMEN DE LA INSTALACION
#===============================================================================

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=================================================================="
echo "   INSTALACION DE ODOO $ODOO_VERSION COMPLETADA"
echo "   EDICION EDUCATIVA CON MULTIEMPRESA"
echo "=================================================================="
echo ""
echo "  ACCESO WEB:"
if [[ "$INSTALL_NGINX" == true ]]; then
echo "    http://$SERVER_IP"
else
echo "    http://$SERVER_IP:$ODOO_PORT"
fi
echo ""
echo "  CREDENCIALES DE ADMINISTRACION:"
echo "    Contrasena maestra:  $ADMIN_PASSWORD"
echo "    Usuario BD:          $DB_USER"
echo "    Contrasena BD:       $DB_PASSWORD"
echo ""
echo "  ARCHIVOS Y DIRECTORIOS:"
echo "    Configuracion:       $ODOO_CONF"
echo "    Directorio Odoo:     $ODOO_HOME_EXT"
echo "    Addons OCA:          $OCA_DIR"
echo "    Addons custom:       $CUSTOM_ADDONS_DIR"
echo "    Logs:                /var/log/$ODOO_USER/"
echo "    Backups:             $EDU_BACKUP_DIR"
echo ""
echo "  COMANDOS DEL SERVICIO:"
echo "    systemctl start $ODOO_USER"
echo "    systemctl stop $ODOO_USER"
echo "    systemctl restart $ODOO_USER"
echo "    systemctl status $ODOO_USER"
echo "    journalctl -u $ODOO_USER -f"
echo ""
echo "  SCRIPTS EDUCATIVOS:"
echo "    Crear alumnos:       sudo odoo_crear_alumnos.sh [N]"
echo "    Resetear alumno:     sudo odoo_reset_alumno.sh alumnoXX"
echo "    Backup manual:       sudo odoo_backup.sh"
echo "    Restaurar backup:    sudo odoo_restaurar_alumno.sh <archivo>"
echo ""
echo "  MODULOS OCA INSTALADOS:"
echo "    - l10n-spain (Localizacion contable espanola)"
echo "    - multi-company (Multiempresa)"
echo "    - brand / server-brand (Rebranding / Marca blanca)"
echo "    - account-financial-tools, account-financial-reporting"
echo "    - account-payment, account-invoicing, account-closing"
echo "    - account-analytic, account-reconcile"
echo "    - bank-payment, credit-control, currency"
echo "    - reporting-engine, mis-builder"
echo "    - community-data-files, server-tools"
echo "    - web, queue, partner-contact"
echo "    - intrastat-extrastat, product-attribute"
echo "    - purchase-workflow, sale-workflow"
echo "    - stock-logistics-workflow, stock-logistics-warehouse"
echo "    - hr, hr-attendance, hr-expense, hr-holidays"
echo "    - project, manufacture, management-system"
echo "    - connector, edi, delivery-carrier"
echo "    - e-commerce, pos, crm, social"
echo "    - website, maintenance, knowledge"
echo ""
echo "  PASOS SIGUIENTES:"
echo ""
echo "    1. ACCEDE AL PANEL DE ADMINISTRACION:"
if [[ "$INSTALL_NGINX" == true ]]; then
echo "       URL: http://$SERVER_IP/admin"
else
echo "       URL: http://$SERVER_IP:$ODOO_PORT/admin"
fi
echo "       Usuario: $SUPERADMIN_USER"
echo "       Contrasena: $SUPERADMIN_PASSWORD"
echo ""
echo "    2. Desde el panel puedes:"
echo "       - Crear grupos de alumnos y asignar profesores"
echo "       - Configurar el branding (logo, colores, datos)"
echo "       - Gestionar actualizaciones de Odoo y modulos OCA"
echo "       - Resetear bases de datos de alumnos"
echo ""
echo "    3. Cada profesor accede con sus credenciales"
echo "       y solo ve las BDs de su grupo asignado."
echo ""
echo "    4. Cada alumno accede con su usuario/contrasena"
echo "       a su base de datos individual."
echo ""
echo "=================================================================="

# Guardar credenciales
CREDENTIALS_FILE="$ODOO_HOME/credenciales_odoo.txt"
cat > "$CREDENTIALS_FILE" << EOF
============================================================
  CREDENCIALES DE ODOO $ODOO_VERSION - EDICION EDUCATIVA
  Fecha de instalacion: $(date '+%Y-%m-%d %H:%M:%S')
  Centro: $EDU_CENTRO_NOMBRE
============================================================

URL de acceso:
  $(if [[ "$INSTALL_NGINX" == true ]]; then echo "http://$SERVER_IP"; else echo "http://$SERVER_IP:$ODOO_PORT"; fi)

Contrasena maestra (admin):
  $ADMIN_PASSWORD

Base de datos:
  Usuario: $DB_USER
  Contrasena: $DB_PASSWORD
  Host: $DB_HOST
  Puerto: $DB_PORT

Superadministrador:
  Usuario: $SUPERADMIN_USER
  Contrasena: $SUPERADMIN_PASSWORD

Regimen fiscal: $FISCAL_REGIME
Recargo de equivalencia: $FISCAL_RECARGO_EQUIVALENCIA
VeriFactu: $VERIFACTU_ENABLED ($VERIFACTU_ENVIRONMENT)

Grupos (profesor incluido): $EDU_GRUPOS

Archivo de configuracion:  $ODOO_CONF
Directorio de Odoo:        $ODOO_HOME_EXT
Modulos OCA:               $OCA_DIR
Addons personalizados:     $CUSTOM_ADDONS_DIR
Backups:                   $EDU_BACKUP_DIR
Logs:                      /var/log/$ODOO_USER/odoo-server.log

Scripts educativos:
  /usr/local/bin/odoo_crear_alumnos.sh
  /usr/local/bin/odoo_reset_alumno.sh
  /usr/local/bin/odoo_backup.sh
  /usr/local/bin/odoo_restaurar_alumno.sh
  /usr/local/bin/odoo_actualizar_oca.sh
============================================================
EOF

chmod 600 "$CREDENTIALS_FILE"
chown "$ODOO_USER":"$ODOO_USER" "$CREDENTIALS_FILE"

log_success "Credenciales guardadas en: $CREDENTIALS_FILE"
log_success "Instalacion completada exitosamente!"

exit 0
