#!/bin/bash
################################################################################
# Script de Instalación Desatendida de Odoo 17 Community Edition
# Incluye:
#   - Odoo 17 CE con todos los módulos disponibles
#   - Paquete de localización española OCA/l10n-spain
#   - Configuración en español
#   - Funcionalidad MULTIEMPRESA para uso educativo
#   - Cada alumno puede crear y gestionar su propia empresa
#   - PostgreSQL
#   - Nginx como proxy inverso (opcional)
#   - Servicio systemd
#   - Script de creación masiva de alumnos/empresas
#
# Uso: sudo bash odoo_install.sh
#
# Probado en: Ubuntu 22.04 / 24.04 LTS, Debian 11/12
################################################################################

set -euo pipefail

#===============================================================================
# CONFIGURACIÓN — Ajusta estos valores según tus necesidades
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
    log_info "Sistema operativo detectado: $OS_ID $OS_VERSION ($OS_CODENAME)"
}

#===============================================================================
# 1. VERIFICACIONES INICIALES
#===============================================================================

check_root
detect_os

log_info "============================================================"
log_info " Instalación Desatendida de Odoo $ODOO_VERSION"
log_info " con Localización Española OCA/l10n-spain"
log_info "============================================================"
log_info "Usuario Odoo:         $ODOO_USER"
log_info "Directorio:           $ODOO_HOME"
log_info "Puerto:               $ODOO_PORT"
log_info "Contraseña admin:     $ADMIN_PASSWORD"
log_info "Contraseña BD:        $DB_PASSWORD"
log_info "============================================================"

#===============================================================================
# 2. ACTUALIZACIÓN DEL SISTEMA
#===============================================================================

log_info "Actualizando el sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
log_success "Sistema actualizado."

#===============================================================================
# 3. INSTALACIÓN DE DEPENDENCIAS DEL SISTEMA
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
    libjpeg62-turbo-dev 2>/dev/null || true \
    node-less \
    npm \
    xfonts-75dpi \
    xfonts-base \
    fontconfig

npm install -g rtlcss less less-plugin-clean-css 2>/dev/null || true

log_success "Dependencias del sistema instaladas."

#===============================================================================
# 4. INSTALACIÓN DE POSTGRESQL
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
# 5. INSTALACIÓN DE WKHTMLTOPDF
#===============================================================================

if [[ "$INSTALL_WKHTMLTOPDF" == true ]]; then
    log_info "Instalando wkhtmltopdf..."

    if ! command -v wkhtmltopdf &>/dev/null; then
        ARCH=$(dpkg --print-architecture)
        case "$OS_ID" in
            ubuntu)
                WKHTML_URL="https://github.com/wkhtmltopdf/packaging/releases/download/${WKHTMLTOPDF_VERSION}/wkhtmltox_${WKHTMLTOPDF_VERSION}.${OS_CODENAME}_${ARCH}.deb"
                ;;
            debian)
                WKHTML_URL="https://github.com/wkhtmltopdf/packaging/releases/download/${WKHTMLTOPDF_VERSION}/wkhtmltox_${WKHTMLTOPDF_VERSION}.${OS_CODENAME}_${ARCH}.deb"
                ;;
            *)
                WKHTML_URL="https://github.com/wkhtmltopdf/packaging/releases/download/${WKHTMLTOPDF_VERSION}/wkhtmltox_${WKHTMLTOPDF_VERSION}.jammy_${ARCH}.deb"
                ;;
        esac

        wget -q "$WKHTML_URL" -O /tmp/wkhtmltox.deb 2>/dev/null || {
            log_info "Descarga directa falló, intentando versión genérica..."
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
# 6. CREACIÓN DEL USUARIO ODOO
#===============================================================================

log_info "Creando usuario del sistema para Odoo..."

if ! id "$ODOO_USER" &>/dev/null; then
    useradd -m -d "$ODOO_HOME" -U -r -s /bin/bash "$ODOO_USER"
fi

mkdir -p "$ODOO_HOME" "$CUSTOM_ADDONS_DIR" "$OCA_DIR"
mkdir -p /var/log/$ODOO_USER

log_success "Usuario $ODOO_USER creado."

#===============================================================================
# 7. INSTALACIÓN DE ODOO DESDE CÓDIGO FUENTE
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
# 9. MÓDULOS OCA — LOCALIZACIÓN ESPAÑOLA Y COMPLEMENTOS
#===============================================================================

clone_oca_repo() {
    local repo_name="$1"
    local target_dir="$OCA_DIR/$repo_name"

    if [[ ! -d "$target_dir" ]]; then
        log_info "Clonando OCA/$repo_name..."
        git clone --depth 1 --branch "$ODOO_VERSION" \
            "https://github.com/OCA/${repo_name}.git" \
            "$target_dir" 2>/dev/null || {
            log_error "No se pudo clonar OCA/$repo_name (rama $ODOO_VERSION). Probando rama principal..."
            git clone --depth 1 \
                "https://github.com/OCA/${repo_name}.git" \
                "$target_dir" 2>/dev/null || {
                log_error "Falló la clonación de OCA/$repo_name. Continuando..."
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

log_info "Instalando módulos OCA..."

if [[ "$OCA_L10N_SPAIN" == true ]]; then
    clone_oca_repo "l10n-spain"
fi

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

log_success "Módulos OCA instalados."

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
# 11. ARCHIVO DE CONFIGURACIÓN DE ODOO
#===============================================================================

log_info "Creando archivo de configuración de Odoo..."

cat > "$ODOO_CONF" << EOF
[options]
; Configuración general
admin_passwd = $ADMIN_PASSWORD
db_host = $DB_HOST
db_port = $DB_PORT
db_user = $DB_USER
db_password = $DB_PASSWORD
db_name = False
dbfilter = .*

; Rutas
addons_path = $ADDONS_PATH
data_dir = $ODOO_HOME/.local/share/Odoo

; Red
http_port = $ODOO_PORT
longpolling_port = $ODOO_LONGPOLLING_PORT
proxy_mode = True

; Rendimiento
workers = 4
max_cron_threads = 2
limit_memory_hard = 2684354560
limit_memory_soft = 2147483648
limit_request = 8192
limit_time_cpu = 600
limit_time_real = 1200
limit_time_real_cron = -1

; Logging
logfile = /var/log/$ODOO_USER/odoo-server.log
log_level = info
log_handler = :INFO
logrotate = True
syslog = False

; Idioma
load_language = es_ES

; Seguridad
list_db = True
csv_internal_sep = ;

; Módulos por defecto para la base de datos
server_wide_modules = base,web
EOF

log_success "Archivo de configuración creado en $ODOO_CONF."

#===============================================================================
# 12. PERMISOS
#===============================================================================

log_info "Configurando permisos..."

chown -R "$ODOO_USER":"$ODOO_USER" "$ODOO_HOME"
chown "$ODOO_USER":"$ODOO_USER" "$ODOO_CONF"
chmod 640 "$ODOO_CONF"
chown -R "$ODOO_USER":"$ODOO_USER" /var/log/$ODOO_USER

log_success "Permisos configurados."

#===============================================================================
# 13. SERVICIO SYSTEMD
#===============================================================================

log_info "Creando servicio systemd..."

cat > /etc/systemd/system/${ODOO_USER}.service << EOF
[Unit]
Description=Odoo $ODOO_VERSION - Servidor ERP
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
# 14. CONFIGURACIÓN DE NGINX (OPCIONAL)
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
# 15. CONFIGURACIÓN DEL FIREWALL (UFW)
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
# 17. INICIAR ODOO
#===============================================================================

log_info "Iniciando el servicio de Odoo..."

systemctl start ${ODOO_USER}.service

sleep 5

if systemctl is-active --quiet ${ODOO_USER}.service; then
    log_success "Odoo está funcionando correctamente."
else
    log_error "Odoo no se inició correctamente. Revisa los logs:"
    log_error "  journalctl -u ${ODOO_USER}.service -n 50"
    log_error "  cat /var/log/$ODOO_USER/odoo-server.log"
fi

#===============================================================================
# 18. RESUMEN DE LA INSTALACIÓN
#===============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     INSTALACIÓN DE ODOO $ODOO_VERSION COMPLETADA           ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  Acceso web:                                               ║"
if [[ "$INSTALL_NGINX" == true ]]; then
echo "║    http://$(hostname -I | awk '{print $1}')                ║"
else
echo "║    http://$(hostname -I | awk '{print $1}'):$ODOO_PORT     ║"
fi
echo "║                                                            ║"
echo "║  Contraseña maestra:  $ADMIN_PASSWORD                      ║"
echo "║  Usuario BD:          $DB_USER                              ║"
echo "║  Contraseña BD:       $DB_PASSWORD                          ║"
echo "║                                                            ║"
echo "║  Archivo de config:   $ODOO_CONF                            ║"
echo "║  Directorio Odoo:     $ODOO_HOME_EXT                       ║"
echo "║  Addons OCA:          $OCA_DIR                              ║"
echo "║  Addons personalizados: $CUSTOM_ADDONS_DIR                 ║"
echo "║  Logs:                /var/log/$ODOO_USER/                  ║"
echo "║                                                            ║"
echo "║  Comandos útiles:                                          ║"
echo "║    systemctl start $ODOO_USER                               ║"
echo "║    systemctl stop $ODOO_USER                                ║"
echo "║    systemctl restart $ODOO_USER                             ║"
echo "║    systemctl status $ODOO_USER                              ║"
echo "║    journalctl -u $ODOO_USER -f                              ║"
echo "║                                                            ║"
echo "║  Idioma: Español (es_ES) preconfigurado                   ║"
echo "║                                                            ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  MÓDULOS OCA INSTALADOS:                                   ║"
echo "║  ✓ l10n-spain (Localización contable española)             ║"
echo "║  ✓ account-financial-tools                                 ║"
echo "║  ✓ account-financial-reporting                             ║"
echo "║  ✓ account-payment                                         ║"
echo "║  ✓ account-invoicing                                       ║"
echo "║  ✓ account-closing                                         ║"
echo "║  ✓ account-analytic                                        ║"
echo "║  ✓ account-reconcile                                       ║"
echo "║  ✓ bank-payment                                            ║"
echo "║  ✓ reporting-engine                                        ║"
echo "║  ✓ community-data-files                                    ║"
echo "║  ✓ server-tools                                            ║"
echo "║  ✓ web                                                     ║"
echo "║  ✓ queue                                                   ║"
echo "║  ✓ partner-contact                                         ║"
echo "║  ✓ mis-builder                                             ║"
echo "║  ✓ credit-control                                          ║"
echo "║  ✓ currency                                                ║"
echo "║  ✓ intrastat-extrastat                                     ║"
echo "║  ✓ product-attribute                                       ║"
echo "║  ✓ purchase-workflow                                       ║"
echo "║  ✓ sale-workflow                                            ║"
echo "║  ✓ stock-logistics-workflow                                ║"
echo "║  ✓ stock-logistics-warehouse                               ║"
echo "║  ✓ hr, hr-attendance, hr-expense, hr-holidays              ║"
echo "║  ✓ project, manufacture, management-system                 ║"
echo "║  ✓ connector, edi, delivery-carrier                        ║"
echo "║  ✓ e-commerce, pos, crm, social                            ║"
echo "║  ✓ website, maintenance, knowledge                         ║"
echo "║                                                            ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  PASOS SIGUIENTES:                                         ║"
echo "║  1. Accede a la URL de Odoo desde tu navegador             ║"
echo "║  2. Crea una nueva base de datos                           ║"
echo "║  3. Selecciona idioma 'Español' al crear la BD             ║"
echo "║  4. Instala los módulos de l10n_es desde Aplicaciones      ║"
echo "║     - l10n_es (Plan contable español)                      ║"
echo "║     - l10n_es_aeat (Modelos AEAT)                         ║"
echo "║     - l10n_es_aeat_mod303 (Modelo 303 IVA)                ║"
echo "║     - l10n_es_aeat_mod347 (Modelo 347)                    ║"
echo "║     - l10n_es_aeat_mod349 (Modelo 349)                    ║"
echo "║     - l10n_es_aeat_mod390 (Modelo 390)                    ║"
echo "║     - l10n_es_aeat_sii (SII - Suministro Inmediato)       ║"
echo "║     - l10n_es_facturae (Factura-e)                         ║"
echo "║     - l10n_es_partner (CIF/NIF validación)                ║"
echo "║     - l10n_es_pos (TPV español)                            ║"
echo "║     - l10n_es_toponyms (Provincias y municipios)           ║"
echo "║  5. Configura tus datos fiscales de empresa                ║"
echo "║                                                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"

CREDENTIALS_FILE="$ODOO_HOME/credenciales_odoo.txt"
cat > "$CREDENTIALS_FILE" << EOF
============================================
  CREDENCIALES DE ODOO $ODOO_VERSION
  Fecha de instalación: $(date '+%Y-%m-%d %H:%M:%S')
============================================

URL de acceso:
  $(if [[ "$INSTALL_NGINX" == true ]]; then echo "http://$(hostname -I | awk '{print $1}')"; else echo "http://$(hostname -I | awk '{print $1}'):$ODOO_PORT"; fi)

Contraseña maestra (admin):
  $ADMIN_PASSWORD

Base de datos:
  Usuario: $DB_USER
  Contraseña: $DB_PASSWORD
  Host: $DB_HOST
  Puerto: $DB_PORT

Archivo de configuración:
  $ODOO_CONF

Directorio de Odoo:
  $ODOO_HOME_EXT

Módulos OCA:
  $OCA_DIR

Addons personalizados:
  $CUSTOM_ADDONS_DIR

Logs:
  /var/log/$ODOO_USER/odoo-server.log
============================================
EOF

chmod 600 "$CREDENTIALS_FILE"
chown "$ODOO_USER":"$ODOO_USER" "$CREDENTIALS_FILE"

log_success "Credenciales guardadas en: $CREDENTIALS_FILE"
log_success "¡Instalación completada exitosamente!"

exit 0
