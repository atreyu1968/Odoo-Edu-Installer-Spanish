<p align="center">
  <img src="artifacts/odoo-edu/public/images/odoo-edu-logo.png" alt="OdooEdu Logo" width="120" />
</p>

<h1 align="center">OdooEdu - Instalador Educativo de Odoo</h1>

<p align="center">
  <strong>Instalación desatendida de Odoo 17 Community Edition para centros de formación profesional españoles</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Odoo-17.0_CE-blue?style=flat-square&logo=odoo" alt="Odoo 17" />
  <img src="https://img.shields.io/badge/Ubuntu-22.04_%7C_24.04_LTS-orange?style=flat-square&logo=ubuntu" alt="Ubuntu" />
  <img src="https://img.shields.io/badge/Licencia-MIT-green?style=flat-square" alt="MIT" />
  <img src="https://img.shields.io/badge/OCA-40%2B_m%C3%B3dulos-purple?style=flat-square" alt="OCA" />
  <img src="https://img.shields.io/badge/VeriFactu-RD_1007%2F2023-red?style=flat-square" alt="VeriFactu" />
</p>

---

## Descripción

**OdooEdu** es un script de instalación completamente desatendido que despliega Odoo 17 Community Edition con localización española completa, soporte multiempresa para alumnos, panel de administración web, rebranding (marca blanca) y la suite completa de módulos OCA. Está diseñado específicamente para **centros de formación profesional** que imparten módulos de gestión empresarial, contabilidad y administración.

### Características principales

| Característica | Descripción |
|---|---|
| **Instalación automática** | Un solo comando instala Odoo 17, PostgreSQL, Nginx como proxy inverso, certificados SSL, wkhtmltopdf y todas las dependencias del sistema |
| **Localización española** | Plan General Contable (`l10n_es`), modelos AEAT (303, 347, 390), Suministro Inmediato de Información (SII) y Factura-e listos para usar |
| **Aislamiento multiempresa** | Cada alumno recibe su propia base de datos con datos de demostración españoles precargados (clientes, facturas, productos) |
| **Panel de administración web** | Interfaz web para el superadministrador: gestiona grupos, profesores, branding, fiscalidad y actualizaciones sin tocar la terminal |
| **Roles de acceso** | Superadministrador (acceso completo) y Profesor (solo su grupo de alumnos) |
| **Rebranding / marca blanca** | Personaliza logo, favicon, colores corporativos y datos de la empresa. Se aplica automáticamente a todas las bases de datos |
| **Configuración fiscal** | Selector de régimen IVA (Península y Baleares) o IGIC (Canarias) con todos los tipos impositivos, posiciones fiscales y recargo de equivalencia |
| **VeriFactu** | Soporte completo para el sistema de verificación de facturas de la AEAT (RD 1007/2023): registros de facturación, código QR, hash SHA-256 encadenado, envío telemático. Modos de pruebas y producción |
| **Gestión de módulos OCA** | Más de 40 módulos OCA incluidos con sistema de estabilidad por versión. Actualizaciones seguras que solo tocan módulos estables |
| **Backups automáticos** | Copias de seguridad diarias automatizadas con retención configurable. Backup y restauración por alumno |
| **Reseteo de BD** | El profesor puede resetear la empresa de cualquier alumno a su estado inicial desde el panel |
| **CSV de contraseñas** | Archivo CSV auto-generado con las credenciales de todos los alumnos para distribuir al inicio del curso |
| **Versiones múltiples** | Soporte para Odoo 14.0, 15.0, 16.0, 17.0 y 18.0 con análisis de compatibilidad de módulos OCA antes de migrar |

---

## Requisitos

| Requisito | Mínimo |
|---|---|
| **Sistema operativo** | Ubuntu 22.04 LTS o Ubuntu 24.04 LTS |
| **RAM** | 4 GB (recomendado 8 GB para +30 alumnos) |
| **CPU** | 2 vCPU |
| **Disco** | 50 GB SSD |
| **Acceso** | root o usuario con privilegios sudo |
| **Conectividad** | Acceso a Internet para descargar paquetes |

---

## Instalación rápida (una línea)

Si tu servidor es nuevo y no tiene `git` ni `curl` instalados, usa este comando que se encarga de todo:

```bash
sudo apt update && sudo apt install -y git curl && git clone https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish.git && cd Odoo-Edu-Installer-Spanish && chmod +x odoo_install.sh && sudo bash odoo_install.sh
```

O si prefieres usar el **script de bootstrap** que prepara el servidor y lanza la instalación de forma completamente desatendida:

```bash
curl -sSL https://raw.githubusercontent.com/atreyu1968/Odoo-Edu-Installer-Spanish/master/bootstrap.sh | sudo bash
```

---

## Instalación paso a paso

### 1. Actualizar el servidor e instalar dependencias previas

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl
```

### 2. Clonar el repositorio

```bash
git clone https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish.git
cd Odoo-Edu-Installer-Spanish
chmod +x odoo_install.sh
```

### 3. (Opcional) Personalizar la configuración

Antes de ejecutar el instalador, puedes editar las variables de configuración al inicio del archivo `odoo_install.sh`:

```bash
nano odoo_install.sh
```

#### Variables generales

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `ODOO_VERSION` | `17.0` | Versión de Odoo (14.0, 15.0, 16.0, 17.0, 18.0) |
| `ODOO_PORT` | `8069` | Puerto de Odoo |
| `INSTALL_NGINX` | `true` | Instalar Nginx como proxy inverso (puerto 80) |
| `ENABLE_SSL` | `false` | Habilitar HTTPS con certificado SSL |
| `WEBSITE_NAME` | `_` | Dominio del servidor (para Nginx y SSL) |

#### Panel de administración

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `SUPERADMIN_USER` | `superadmin` | Usuario del panel de administración web |
| `SUPERADMIN_PASSWORD` | `SuperAdmin2024!` | Contraseña del panel (cambiar tras instalar) |

#### Centro educativo y grupos

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `EDU_CENTRO_NOMBRE` | `Centro de Formación Profesional` | Nombre del centro educativo |
| `EDU_GRUPOS` | `Grupo 1\|30\|empresa\|alumno\|Profesor\|profesor\|Profesor2024!` | Definición de grupos (ver formato abajo) |
| `EDU_BACKUP_DIR` | `/var/backups/odoo` | Directorio de backups |
| `EDU_BACKUP_RETENTION_DAYS` | `30` | Días de retención de backups |

#### Branding / Marca blanca

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `BRAND_COMPANY_NAME` | Nombre del centro | Nombre de la empresa para rebranding |
| `BRAND_COMPANY_TAGLINE` | _(vacío)_ | Eslogan del centro |
| `BRAND_COMPANY_WEBSITE` | _(vacío)_ | Sitio web del centro |
| `BRAND_COMPANY_EMAIL` | _(vacío)_ | Email de contacto |
| `BRAND_COMPANY_PHONE` | _(vacío)_ | Teléfono de contacto |
| `BRAND_COMPANY_STREET` | _(vacío)_ | Dirección |
| `BRAND_COMPANY_CITY` | _(vacío)_ | Ciudad |
| `BRAND_COMPANY_ZIP` | _(vacío)_ | Código postal |
| `BRAND_COMPANY_STATE` | _(vacío)_ | Provincia |
| `BRAND_COMPANY_COUNTRY` | `ES` | País (código ISO) |
| `BRAND_LOGO_URL` | _(vacío)_ | URL del logo del centro (PNG, 200x60px) |
| `BRAND_FAVICON_URL` | _(vacío)_ | URL del favicon (PNG/ICO, 32x32px) |
| `BRAND_PRIMARY_COLOR` | `#714B67` | Color primario de la interfaz |
| `BRAND_SECONDARY_COLOR` | `#21b799` | Color secundario |

#### Configuración fiscal

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `FISCAL_REGIME` | `iva` | Régimen fiscal: `iva` (Península y Baleares) o `igic` (Canarias) |
| `FISCAL_RECARGO_EQUIVALENCIA` | `false` | Activar recargo de equivalencia para comerciantes minoristas |

**Tipos impositivos por régimen:**

| IVA (Península y Baleares) | IGIC (Canarias) |
|---|---|
| 0% — Exento | 0% — Tipo cero |
| 4% — Superreducido | 3% — Reducido |
| 10% — Reducido | 5% — Reducido |
| 21% — General | 7% — General |
| | 9.5% — Incrementado |
| | 15% — Especial incrementado |
| | 20% — Especial |

#### VeriFactu (RD 1007/2023)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VERIFACTU_ENABLED` | `false` | Activar el sistema de verificación de facturas |
| `VERIFACTU_ENVIRONMENT` | `test` | Entorno: `test` (servidor de pruebas AEAT) o `production` (envío real) |
| `VERIFACTU_NIF_TITULAR` | _(vacío)_ | NIF/CIF del obligado tributario |
| `VERIFACTU_RAZON_SOCIAL` | _(vacío)_ | Razón social del titular |
| `VERIFACTU_NIF_REPRESENTANTE` | _(vacío)_ | NIF del representante legal (opcional) |

> **Nota**: VeriFactu será obligatorio a partir del **1 de julio de 2026** para todos los empresarios y profesionales que expidan facturas. Para entornos educativos se recomienda usar el modo de pruebas.

Cuando VeriFactu está activado se configura automáticamente:
- Generación del registro de facturación (alta/anulación) conforme al RD 1007/2023
- Código QR de verificación enlazado a la sede electrónica de la AEAT
- Hash SHA-256 encadenado entre registros para garantizar la integridad
- Envío automático o bajo demanda al sistema VeriFactu de la Agencia Tributaria
- Libro registro de facturas expedidas y recibidas
- Firma electrónica con certificado de la FNMT o DNIe

#### Formato de `EDU_GRUPOS`

Cada grupo se define con campos separados por `|`, y los grupos entre sí se separan por `;`:

```
nombre|numAlumnos|dbPrefix|passwordPrefix|profNombre|profUsuario|profPassword
```

Ejemplo con dos grupos:
```
EDU_GRUPOS="DAM Mañana|30|dam_empresa|dam_alumno|Ana García|ana.garcia|AnaGarcia2024!;DAM Tarde|25|damt_empresa|damt_alumno|Pedro López|pedro.lopez|PedroLopez2024!"
```

### 4. Ejecutar la instalación

```bash
sudo bash odoo_install.sh
```

El proceso tarda entre **10 y 20 minutos** dependiendo del servidor. El script:

1. Instala las dependencias del sistema (Python, Node.js, Less, wkhtmltopdf)
2. Instala y configura PostgreSQL
3. Clona Odoo 17 CE desde el repositorio oficial
4. Clona y configura más de 40 repositorios OCA
5. Configura la localización española, régimen fiscal (IVA/IGIC) y VeriFactu si está activado
6. Instala Nginx como proxy inverso (si está habilitado)
7. Configura el servicio systemd, logrotate y firewall UFW
8. Crea los scripts educativos auxiliares
9. Configura backups automáticos diarios

### 5. Acceder al panel de administración

Al finalizar, el script muestra las credenciales de acceso:

```
==================================================================
  INSTALACION COMPLETADA
  URL: http://TU_IP/admin
  Usuario: superadmin
  Contraseña: SuperAdmin2024!
==================================================================
```

> **Importante**: Cambia la contraseña del superadministrador en el primer acceso.

---

## Panel de administración web

El panel web (`/admin`) ofrece una interfaz completa para gestionar el entorno educativo sin necesidad de usar la terminal.

### Superadministrador

| Sección | Funcionalidad |
|---|---|
| **Grupos** | Crear, editar y eliminar grupos de alumnos. Asignar profesor a cada grupo. Crear bases de datos y descargar CSV de credenciales |
| **Branding** | Personalizar logo, favicon, colores corporativos, datos de empresa. Se aplica a todas las BD |
| **Fiscalidad** | Selector IVA/IGIC con tipos impositivos. Recargo de equivalencia. VeriFactu (activar/desactivar, entorno pruebas/producción, datos del titular) |
| **Actualizaciones** | Ver versión instalada. Analizar compatibilidad OCA para migrar versión. Actualizar módulos estables |

### Profesor

| Sección | Funcionalidad |
|---|---|
| **Su grupo** | Ver y gestionar los alumnos de su grupo asignado |
| **Reseteos** | Resetear la BD de cualquier alumno de su grupo a su estado inicial |
| **CSV** | Descargar archivo CSV con las credenciales de sus alumnos |

---

## Scripts educativos incluidos

El instalador genera automáticamente estos scripts en `/usr/local/bin/`:

| Script | Uso | Descripción |
|---|---|---|
| `odoo_crear_alumnos.sh` | `sudo bash odoo_crear_alumnos.sh` | Crea las bases de datos de todos los alumnos según la configuración de grupos |
| `odoo_reset_alumno.sh` | `sudo bash odoo_reset_alumno.sh alumno05` | Resetea la BD de un alumno a su estado inicial |
| `odoo_backup.sh` | `sudo bash odoo_backup.sh` | Backup manual de todas las bases de datos |
| `odoo_restaurar_alumno.sh` | `sudo bash odoo_restaurar_alumno.sh alumno05` | Restaura la BD de un alumno desde el último backup |
| `odoo_actualizar_oca.sh` | `sudo bash odoo_actualizar_oca.sh safe` | Actualiza los módulos OCA (solo repositorios estables) |

### Actualización de módulos OCA

El script `odoo_actualizar_oca.sh` tiene dos modos:

```bash
# Modo seguro: actualiza solo repos con rama estable confirmada
sudo bash odoo_actualizar_oca.sh safe

# Modo verificación: muestra commits pendientes sin aplicar cambios
sudo bash odoo_actualizar_oca.sh check
```

Características de seguridad:
- Solo actualiza repositorios que están en la rama de la versión instalada
- Ejecuta git como el usuario de Odoo (no como root)
- Si un repositorio falla, continúa con los demás
- Resumen detallado: actualizados, omitidos (por rama diferente o sin rama remota) y fallidos

---

## Módulos OCA incluidos

Más de **40 módulos** de la Odoo Community Association, organizados por categoría:

### Contabilidad y Finanzas
`l10n-spain` · `account-financial-tools` · `account-financial-reporting` · `account-payment` · `account-invoicing` · `account-closing` · `account-analytic` · `account-reconcile` · `bank-payment` · `credit-control` · `currency` · `mis-builder`

### Ventas y Compras
`sale-workflow` · `purchase-workflow` · `product-attribute` · `crm` · `e-commerce` · `pos`

### Logística y Almacén
`stock-logistics-workflow` · `stock-logistics-warehouse` · `delivery-carrier` · `intrastat-extrastat`

### Recursos Humanos
`hr` · `hr-attendance` · `hr-expense` · `hr-holidays`

### Producción y Proyectos
`manufacture` · `project` · `management-system`

### Sistema y Herramientas
`server-tools` · `web` · `queue` · `connector` · `edi` · `reporting-engine` · `community-data-files` · `brand` · `multi-company` · `partner-contact`

---

## Estructura de archivos

### Repositorio

```
Odoo-Edu-Installer-Spanish/
├── odoo_install.sh          # Script principal de instalación desatendida
├── bootstrap.sh             # Script de bootstrap (actualiza servidor + lanza instalación)
├── README.md                # Este archivo
└── artifacts/
    └── odoo-edu/            # Aplicación web (landing + panel de administración)
        ├── src/
        │   ├── pages/
        │   │   ├── Landing.tsx      # Página principal con instrucciones de instalación
        │   │   └── AdminPanel.tsx   # Panel de administración (grupos, branding, fiscal, actualizaciones)
        │   ├── components/          # Componentes reutilizables (CodeBlock, SectionHeading)
        │   └── App.tsx              # Router principal (/ y /admin)
        └── public/
            └── images/              # Logo, favicon, imágenes de fondo
```

### Tras la instalación (en el servidor)

```
/opt/odoo17/                         # Directorio principal de Odoo
├── odoo17-server/                   # Código fuente de Odoo CE
├── OCA/                             # Repositorios OCA clonados
├── custom/addons/                   # Módulos personalizados
└── credenciales_odoo.txt            # Credenciales completas (protegido con chmod 600)

/usr/local/bin/
├── odoo_crear_alumnos.sh            # Crear BDs de alumnos por grupo
├── odoo_reset_alumno.sh             # Resetear BD de un alumno
├── odoo_backup.sh                   # Backup manual de todas las BD
├── odoo_restaurar_alumno.sh         # Restaurar BD desde backup
└── odoo_actualizar_oca.sh           # Actualizar módulos OCA (modo safe/check)

/var/backups/odoo/                   # Backups automáticos diarios
/var/log/odoo17/                     # Logs de Odoo y backups
/etc/odoo17.conf                     # Archivo de configuración de Odoo
```

---

## Versiones de Odoo soportadas

| Versión | Estado | Soporte hasta | Compatibilidad OCA |
|---|---|---|---|
| 14.0 | EOL | Oct 2023 | ~75% módulos estables |
| 15.0 | EOL | Oct 2024 | ~85% módulos estables |
| 16.0 | LTS | Oct 2025 | ~95% módulos estables |
| 17.0 | **Actual (LTS)** | Nov 2026 | ~92% módulos estables |
| 18.0 | Desarrollo | Oct 2028 | ~70% módulos estables |

> Para cambiar de versión, usa el panel de administración web que analiza la compatibilidad de todos los módulos OCA antes de la migración.

---

## Solución de problemas

### El servicio de Odoo no arranca

```bash
sudo systemctl status odoo17
sudo journalctl -u odoo17 --no-pager -n 50
sudo tail -f /var/log/odoo17/odoo-server.log
```

### Comprobar que PostgreSQL está activo

```bash
sudo systemctl status postgresql
sudo -u odoo17 psql -l
```

### Comprobar que Nginx está activo

```bash
sudo systemctl status nginx
sudo nginx -t
```

### Reiniciar todos los servicios

```bash
sudo systemctl restart postgresql
sudo systemctl restart odoo17
sudo systemctl restart nginx
```

### Ver las credenciales guardadas

```bash
sudo cat /opt/odoo17/credenciales_odoo.txt
```

### Verificar la configuración fiscal

```bash
# Comprobar que los módulos de localización están instalados
sudo -u odoo17 psql -d NOMBRE_BD -c "SELECT name, state FROM ir_module_module WHERE name LIKE 'l10n_es%';"
```

---

## Licencias

- **Scripts de instalación**: [MIT License](LICENSE)
- **Odoo Community Edition**: [LGPL-3.0](https://www.gnu.org/licenses/lgpl-3.0.html)
- **Módulos OCA**: [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) o [LGPL-3.0](https://www.gnu.org/licenses/lgpl-3.0.html)

---

## Créditos

Desarrollado por **Atreyu Servicios Digitales**

Una iniciativa del **Departamento de Administración de Empresas** del **IES Manuel Martín González**

---

<p align="center">
  <a href="https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish">
    <img src="https://img.shields.io/badge/GitHub-Repositorio-black?style=for-the-badge&logo=github" alt="GitHub" />
  </a>
</p>
