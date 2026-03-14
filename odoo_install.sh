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

# --- Configuracion educativa ---
EDU_MODE=true
EDU_NUM_ALUMNOS=30
EDU_PASSWORD_PREFIX="alumno"
EDU_DB_PREFIX="empresa"
EDU_PROFESOR_USER="profesor"
EDU_PROFESOR_PASSWORD="Profesor2024!"
EDU_CENTRO_NOMBRE="Centro de Formacion Profesional"
EDU_CENTRO_LOGO=""
EDU_BACKUP_DIR="/var/backups/odoo"
EDU_BACKUP_RETENTION_DAYS=30

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
log_info "Num. alumnos:         $EDU_NUM_ALUMNOS"
log_info "Centro:               $EDU_CENTRO_NOMBRE"
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

apt-get install -y -qq \
    git \
    curl \
    wget \
    gnupg2 \
    software-properties-common \
    build-essential \
    ${PYTHON_VERSION} \
    ${PYTHON_VERSION}-dev \
    ${PYTHON_VERSION}-pip \
    ${PYTHON_VERSION}-venv \
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
    python3-zeep \
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
    libtiff5-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libwebp-dev \
    libjpeg62-turbo-dev 2>/dev/null || true

apt-get install -y -qq \
    node-less \
    npm \
    xfonts-75dpi \
    xfonts-base \
    fontconfig

npm install -g rtlcss less less-plugin-clean-css 2>/dev/null || true

log_success "Dependencias del sistema instaladas."

#===============================================================================
# 4. INSTALACION DE POSTGRESQL
#===============================================================================

log_info "Instalando PostgreSQL..."

if ! command -v psql &>/dev/null; then
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget -qO - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
    apt-get update -qq
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

if [[ ! -d "$VENV_DIR" ]]; then
    ${PYTHON_VERSION} -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

pip install --upgrade pip setuptools wheel

pip install -r "$ODOO_HOME_EXT/requirements.txt"

pip install \
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

pip install \
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
# Crear alumnos masivamente en Odoo
# Cada alumno obtiene:
#   - Su propia base de datos con datos de demostracion
#   - Un usuario con permisos limitados a su empresa
#   - Idioma espanol y plan contable espanol precargado
#
# Uso: sudo bash odoo_crear_alumnos.sh [numero_alumnos]
# Ejemplo: sudo bash odoo_crear_alumnos.sh 30
################################################################################

set -euo pipefail

NUM=${1:-NUM_ALUMNOS_PLACEHOLDER}
ODOO_USER="ODOO_USER_PLACEHOLDER"
ODOO_HOME="ODOO_HOME_PLACEHOLDER"
ODOO_CONF="ODOO_CONF_PLACEHOLDER"
VENV_DIR="$ODOO_HOME/venv"
ODOO_BIN="$ODOO_HOME/ODOO_USER_PLACEHOLDER-server/odoo-bin"
DB_PREFIX="DB_PREFIX_PLACEHOLDER"
PWD_PREFIX="PWD_PREFIX_PLACEHOLDER"
PROFESOR_USER="PROFESOR_USER_PLACEHOLDER"
PROFESOR_PWD="PROFESOR_PWD_PLACEHOLDER"

echo "============================================================"
echo " Creando $NUM bases de datos para alumnos"
echo " Prefijo BD: ${DB_PREFIX}"
echo " Contrasena: ${PWD_PREFIX}XX (donde XX = numero)"
echo "============================================================"

CREDENTIALS_FILE="$ODOO_HOME/credenciales_alumnos.csv"
echo "alumno,base_datos,usuario,contrasena,url" > "$CREDENTIALS_FILE"

for i in $(seq -w 1 "$NUM"); do
    DB_NAME="${DB_PREFIX}${i}"
    USER_LOGIN="${PWD_PREFIX}${i}"
    USER_PWD="${PWD_PREFIX}${i}"
    EMPRESA_NOMBRE="Empresa Alumno ${i}"

    echo -n "Creando alumno $i ($DB_NAME)... "

    sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 && {
        echo "ya existe, saltando."
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
        sudo -u postgres psql -d "$DB_NAME" -c "
            UPDATE res_company SET name='$EMPRESA_NOMBRE' WHERE id=1;
            UPDATE res_partner SET name='$EMPRESA_NOMBRE' WHERE id=1;
        " 2>/dev/null

        sudo -u postgres psql -d "$DB_NAME" -c "
            INSERT INTO res_users (login, password, name, company_id, active, notification_type)
            SELECT '$USER_LOGIN', '$USER_PWD', 'Alumno $i', 1, true, 'email'
            WHERE NOT EXISTS (SELECT 1 FROM res_users WHERE login='$USER_LOGIN');
        " 2>/dev/null

        echo "$USER_LOGIN,$DB_NAME,$USER_LOGIN,$USER_PWD,http://$(hostname -I | awk '{print $1}')/web?db=$DB_NAME" >> "$CREDENTIALS_FILE"
        echo "OK"
    else
        echo "ERROR"
    fi
done

# Crear usuario profesor con acceso a todas las BD
echo ""
echo "Creando usuario profesor..."
for i in $(seq -w 1 "$NUM"); do
    DB_NAME="${DB_PREFIX}${i}"
    sudo -u postgres psql -d "$DB_NAME" -c "
        INSERT INTO res_users (login, password, name, company_id, active, notification_type)
        SELECT '$PROFESOR_USER', '$PROFESOR_PWD', 'Profesor', 1, true, 'email'
        WHERE NOT EXISTS (SELECT 1 FROM res_users WHERE login='$PROFESOR_USER');
    " 2>/dev/null

    sudo -u postgres psql -d "$DB_NAME" -c "
        UPDATE res_users SET groups_id = (
            SELECT array_agg(id) FROM res_groups WHERE category_id IN (
                SELECT id FROM ir_module_category WHERE name IN ('Administration', 'Technical')
            )
        ) WHERE login='$PROFESOR_USER';
    " 2>/dev/null || true
done

chmod 600 "$CREDENTIALS_FILE"
chown "$ODOO_USER":"$ODOO_USER" "$CREDENTIALS_FILE"

echo ""
echo "============================================================"
echo " ALUMNOS CREADOS EXITOSAMENTE"
echo "============================================================"
echo " Archivo de credenciales: $CREDENTIALS_FILE"
echo ""
echo " Credenciales del profesor:"
echo "   Usuario: $PROFESOR_USER"
echo "   Contrasena: $PROFESOR_PWD"
echo "   (Tiene acceso a TODAS las bases de datos)"
echo ""
echo " Formato por alumno:"
echo "   BD: ${DB_PREFIX}XX"
echo "   Usuario: ${PWD_PREFIX}XX"
echo "   Contrasena: ${PWD_PREFIX}XX"
echo "============================================================"
ALUMNOS_SCRIPT

sed -i "s|NUM_ALUMNOS_PLACEHOLDER|$EDU_NUM_ALUMNOS|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|ODOO_USER_PLACEHOLDER|$ODOO_USER|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|ODOO_HOME_PLACEHOLDER|$ODOO_HOME|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|ODOO_CONF_PLACEHOLDER|$ODOO_CONF|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|DB_PREFIX_PLACEHOLDER|$EDU_DB_PREFIX|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|PWD_PREFIX_PLACEHOLDER|$EDU_PASSWORD_PREFIX|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|PROFESOR_USER_PLACEHOLDER|$EDU_PROFESOR_USER|g" /usr/local/bin/odoo_crear_alumnos.sh
sed -i "s|PROFESOR_PWD_PLACEHOLDER|$EDU_PROFESOR_PASSWORD|g" /usr/local/bin/odoo_crear_alumnos.sh
chmod +x /usr/local/bin/odoo_crear_alumnos.sh

# --- Script: Resetear BD de un alumno ---
cat > /usr/local/bin/odoo_reset_alumno.sh << 'RESET_SCRIPT'
#!/bin/bash
################################################################################
# Resetear la base de datos de un alumno
# Crea un backup antes de eliminar y recrea la BD con datos de demostracion
#
# Uso: sudo bash odoo_reset_alumno.sh <nombre_usuario>
# Ejemplo: sudo bash odoo_reset_alumno.sh alumno05
################################################################################

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Uso: $0 <nombre_usuario>"
    echo "Ejemplo: $0 alumno05"
    exit 1
fi

ALUMNO="$1"
ODOO_USER="ODOO_USER_PLACEHOLDER"
ODOO_HOME="ODOO_HOME_PLACEHOLDER"
ODOO_CONF="ODOO_CONF_PLACEHOLDER"
VENV_DIR="$ODOO_HOME/venv"
ODOO_BIN="$ODOO_HOME/ODOO_USER_PLACEHOLDER-server/odoo-bin"
DB_PREFIX="DB_PREFIX_PLACEHOLDER"
BACKUP_DIR="BACKUP_DIR_PLACEHOLDER"

NUM=$(echo "$ALUMNO" | grep -o '[0-9]\+$')
DB_NAME="${DB_PREFIX}$(printf '%02d' $NUM)"
EMPRESA_NOMBRE="Empresa Alumno $(printf '%02d' $NUM)"

echo "============================================================"
echo " Reseteando base de datos: $DB_NAME"
echo " Alumno: $ALUMNO"
echo "============================================================"

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

# Reconfigurar
sudo -u postgres psql -d "$DB_NAME" -c "
    UPDATE res_company SET name='$EMPRESA_NOMBRE' WHERE id=1;
    UPDATE res_partner SET name='$EMPRESA_NOMBRE' WHERE id=1;
" 2>/dev/null

sudo -u postgres psql -d "$DB_NAME" -c "
    INSERT INTO res_users (login, password, name, company_id, active, notification_type)
    SELECT '$ALUMNO', '$ALUMNO', 'Alumno $(printf '%02d' $NUM)', 1, true, 'email'
    WHERE NOT EXISTS (SELECT 1 FROM res_users WHERE login='$ALUMNO');
" 2>/dev/null

echo ""
echo "============================================================"
echo " Base de datos $DB_NAME reseteada correctamente"
echo " Backup previo: $BACKUP_DIR/${DB_NAME}_pre_reset_${TIMESTAMP}.sql.gz"
echo " Usuario: $ALUMNO / Contrasena: $ALUMNO"
echo "============================================================"
RESET_SCRIPT

sed -i "s|ODOO_USER_PLACEHOLDER|$ODOO_USER|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|ODOO_HOME_PLACEHOLDER|$ODOO_HOME|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|ODOO_CONF_PLACEHOLDER|$ODOO_CONF|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|DB_PREFIX_PLACEHOLDER|$EDU_DB_PREFIX|g" /usr/local/bin/odoo_reset_alumno.sh
sed -i "s|BACKUP_DIR_PLACEHOLDER|$EDU_BACKUP_DIR|g" /usr/local/bin/odoo_reset_alumno.sh
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
echo "    1. Ejecuta: sudo odoo_crear_alumnos.sh $EDU_NUM_ALUMNOS"
echo "    2. Reparte las credenciales del archivo:"
echo "       $ODOO_HOME/credenciales_alumnos.csv"
echo "    3. Cada alumno accede a su BD con su usuario"
echo "    4. El profesor accede con:"
echo "       Usuario: $EDU_PROFESOR_USER"
echo "       Contrasena: $EDU_PROFESOR_PASSWORD"
echo "    5. Para personalizar la marca, instala el modulo"
echo "       'brand' desde Aplicaciones en cada BD"
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

Profesor:
  Usuario: $EDU_PROFESOR_USER
  Contrasena: $EDU_PROFESOR_PASSWORD

Patron alumnos:
  BD: ${EDU_DB_PREFIX}XX
  Usuario: ${EDU_PASSWORD_PREFIX}XX
  Contrasena: ${EDU_PASSWORD_PREFIX}XX

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
============================================================
EOF

chmod 600 "$CREDENTIALS_FILE"
chown "$ODOO_USER":"$ODOO_USER" "$CREDENTIALS_FILE"

log_success "Credenciales guardadas en: $CREDENTIALS_FILE"
log_success "Instalacion completada exitosamente!"

exit 0
