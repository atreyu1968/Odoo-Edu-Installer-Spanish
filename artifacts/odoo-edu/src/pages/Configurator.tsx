import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Server, Package, Download,
  ChevronLeft, Eye, EyeOff, Copy, Check, GraduationCap,
  RefreshCw, Info, Play, Square, Terminal,
  CheckCircle2, XCircle, AlertTriangle, Loader2,
  Palette, Building2, Upload, Image, Globe, Mail, Phone, MapPin,
  Trash2, Plus, Users
} from "lucide-react";
import { Link } from "wouter";

interface Profesor {
  nombre: string;
  usuario: string;
  password: string;
}

interface GrupoAlumnos {
  nombre: string;
  numAlumnos: number;
  dbPrefix: string;
  passwordPrefix: string;
}

interface ConfigState {
  odooVersion: string;
  odooPort: string;
  longpollingPort: string;
  installNginx: boolean;
  websiteName: string;
  enableSsl: boolean;
  installWkhtmltopdf: boolean;
  eduMode: boolean;
  eduProfesores: Profesor[];
  eduGrupos: GrupoAlumnos[];
  eduCentroNombre: string;
  eduBackupDir: string;
  eduBackupRetentionDays: number;
  brandCompanyName: string;
  brandCompanyTagline: string;
  brandCompanyWebsite: string;
  brandCompanyEmail: string;
  brandCompanyPhone: string;
  brandCompanyStreet: string;
  brandCompanyCity: string;
  brandCompanyZip: string;
  brandCompanyState: string;
  brandCompanyCountry: string;
  brandLogoUrl: string;
  brandFaviconUrl: string;
  brandPrimaryColor: string;
  brandSecondaryColor: string;
  ocaL10nSpain: boolean;
  ocaAccountFinancialTools: boolean;
  ocaAccountPayment: boolean;
  ocaBankPayment: boolean;
  ocaReportingEngine: boolean;
  ocaCommunityDataFiles: boolean;
  ocaServerTools: boolean;
  ocaWeb: boolean;
  ocaQueue: boolean;
  ocaPartnerContact: boolean;
  ocaMisBuilder: boolean;
  ocaMultiCompany: boolean;
  ocaBrand: boolean;
}

const defaultConfig: ConfigState = {
  odooVersion: "17.0",
  odooPort: "8069",
  longpollingPort: "8072",
  installNginx: true,
  websiteName: "_",
  enableSsl: false,
  installWkhtmltopdf: true,
  eduMode: true,
  eduProfesores: [
    { nombre: "Profesor", usuario: "profesor", password: "Profesor2024!" },
  ],
  eduGrupos: [
    { nombre: "Grupo 1", numAlumnos: 30, dbPrefix: "empresa", passwordPrefix: "alumno" },
  ],
  eduCentroNombre: "Centro de Formacion Profesional",
  eduBackupDir: "/var/backups/odoo",
  eduBackupRetentionDays: 30,
  brandCompanyName: "Centro de Formacion Profesional",
  brandCompanyTagline: "",
  brandCompanyWebsite: "",
  brandCompanyEmail: "",
  brandCompanyPhone: "",
  brandCompanyStreet: "",
  brandCompanyCity: "",
  brandCompanyZip: "",
  brandCompanyState: "",
  brandCompanyCountry: "ES",
  brandLogoUrl: "",
  brandFaviconUrl: "",
  brandPrimaryColor: "#714B67",
  brandSecondaryColor: "#21b799",
  ocaL10nSpain: true,
  ocaAccountFinancialTools: true,
  ocaAccountPayment: true,
  ocaBankPayment: true,
  ocaReportingEngine: true,
  ocaCommunityDataFiles: true,
  ocaServerTools: true,
  ocaWeb: true,
  ocaQueue: true,
  ocaPartnerContact: true,
  ocaMisBuilder: true,
  ocaMultiCompany: true,
  ocaBrand: true,
};

const ocaModules: { key: keyof ConfigState; label: string; description: string }[] = [
  { key: "ocaL10nSpain", label: "Localización Española (l10n-spain)", description: "Plan General Contable, modelos AEAT, SII, Factura-e" },
  { key: "ocaAccountFinancialTools", label: "Herramientas Financieras", description: "Herramientas contables avanzadas" },
  { key: "ocaAccountPayment", label: "Pagos Contables", description: "Módulos de gestión de pagos" },
  { key: "ocaBankPayment", label: "Pagos Bancarios", description: "Órdenes de pago y extractos bancarios" },
  { key: "ocaReportingEngine", label: "Motor de Informes", description: "Informes avanzados y plantillas" },
  { key: "ocaCommunityDataFiles", label: "Datos Comunitarios", description: "Datos maestros compartidos" },
  { key: "ocaServerTools", label: "Herramientas de Servidor", description: "Utilidades técnicas del servidor" },
  { key: "ocaWeb", label: "Extensiones Web", description: "Mejoras de interfaz web" },
  { key: "ocaQueue", label: "Cola de Trabajos", description: "Procesamiento en segundo plano" },
  { key: "ocaPartnerContact", label: "Contactos", description: "Gestión avanzada de contactos" },
  { key: "ocaMisBuilder", label: "MIS Builder", description: "Constructor de informes MIS" },
  { key: "ocaMultiCompany", label: "Multiempresa", description: "Reglas y funciones multiempresa" },
  { key: "ocaBrand", label: "Rebranding (Brand)", description: "Personalizar logo y nombre de Odoo" },
];

type InstallStatus = "idle" | "running" | "completed" | "failed";

const API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/").replace(/\/$/, "");

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? "bg-blue-600" : "bg-slate-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SectionCard({ icon: Icon, title, children, color = "blue" }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-violet-500 to-violet-600",
    orange: "from-orange-500 to-orange-600",
    cyan: "from-cyan-500 to-cyan-600",
    red: "from-red-500 to-red-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className={`bg-gradient-to-r ${colorMap[color]} px-6 py-4 flex items-center gap-3`}>
        <Icon className="w-5 h-5 text-white" />
        <h3 className="text-lg font-semibold text-white font-display">{title}</h3>
      </div>
      <div className="p-6 space-y-5">
        {children}
      </div>
    </motion.div>
  );
}

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="sm:w-72 flex-shrink-0">
        {children}
      </div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", disabled }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative">
      <input
        type={isPassword && showPassword ? "text" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function ColorInput({ value, onChange, disabled }: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed p-0.5"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="#714B67"
        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function NumberInput({ value, onChange, min, max, disabled }: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

function generateConfigBlock(config: ConfigState): string {
  const b = (v: boolean) => v ? "true" : "false";

  return `ODOO_VERSION="${config.odooVersion}"
ODOO_USER="odoo17"
ODOO_HOME="/opt/$ODOO_USER"
ODOO_HOME_EXT="$ODOO_HOME/\${ODOO_USER}-server"
ODOO_CONF="/etc/\${ODOO_USER}.conf"
ODOO_PORT="${config.odooPort}"
ODOO_LONGPOLLING_PORT="${config.longpollingPort}"

INSTALL_NGINX=${b(config.installNginx)}
WEBSITE_NAME="${config.websiteName}"
ENABLE_SSL=${b(config.enableSsl)}

DB_HOST="localhost"
DB_PORT="5432"
DB_USER="$ODOO_USER"
DB_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

INSTALL_WKHTMLTOPDF=${b(config.installWkhtmltopdf)}
WKHTMLTOPDF_VERSION="0.12.6.1-3"

# --- Configuracion educativa ---
EDU_MODE=${b(config.eduMode)}
EDU_CENTRO_NOMBRE="${config.eduCentroNombre}"
EDU_BACKUP_DIR="${config.eduBackupDir}"
EDU_BACKUP_RETENTION_DAYS=${config.eduBackupRetentionDays}

# Profesores: nombre|usuario|password (separados por ;)
EDU_PROFESORES="${config.eduProfesores.map(p => `${p.nombre}|${p.usuario}|${p.password}`).join(";")}"

# Grupos: nombre|numAlumnos|dbPrefix|passwordPrefix (separados por ;)
EDU_GRUPOS="${config.eduGrupos.map(g => `${g.nombre}|${g.numAlumnos}|${g.dbPrefix}|${g.passwordPrefix}`).join(";")}"

# --- Branding / Marca Blanca ---
BRAND_COMPANY_NAME="${config.brandCompanyName}"
BRAND_COMPANY_TAGLINE="${config.brandCompanyTagline}"
BRAND_COMPANY_WEBSITE="${config.brandCompanyWebsite}"
BRAND_COMPANY_EMAIL="${config.brandCompanyEmail}"
BRAND_COMPANY_PHONE="${config.brandCompanyPhone}"
BRAND_COMPANY_STREET="${config.brandCompanyStreet}"
BRAND_COMPANY_CITY="${config.brandCompanyCity}"
BRAND_COMPANY_ZIP="${config.brandCompanyZip}"
BRAND_COMPANY_STATE="${config.brandCompanyState}"
BRAND_COMPANY_COUNTRY="${config.brandCompanyCountry}"
BRAND_LOGO_URL="${config.brandLogoUrl}"
BRAND_FAVICON_URL="${config.brandFaviconUrl}"
BRAND_PRIMARY_COLOR="${config.brandPrimaryColor}"
BRAND_SECONDARY_COLOR="${config.brandSecondaryColor}"

# --- Modulos OCA ---
OCA_L10N_SPAIN=${b(config.ocaL10nSpain)}
OCA_ACCOUNT_FINANCIAL_TOOLS=${b(config.ocaAccountFinancialTools)}
OCA_ACCOUNT_PAYMENT=${b(config.ocaAccountPayment)}
OCA_BANK_PAYMENT=${b(config.ocaBankPayment)}
OCA_REPORTING_ENGINE=${b(config.ocaReportingEngine)}
OCA_COMMUNITY_DATA_FILES=${b(config.ocaCommunityDataFiles)}
OCA_SERVER_TOOLS=${b(config.ocaServerTools)}
OCA_WEB=${b(config.ocaWeb)}
OCA_QUEUE=${b(config.ocaQueue)}
OCA_PARTNER_CONTACT=${b(config.ocaPartnerContact)}
OCA_MIS_BUILDER=${b(config.ocaMisBuilder)}
OCA_MULTI_COMPANY=${b(config.ocaMultiCompany)}
OCA_BRAND=${b(config.ocaBrand)}

CUSTOM_ADDONS_DIR="$ODOO_HOME/custom/addons"
OCA_DIR="$ODOO_HOME/OCA"

PYTHON_VERSION="python3"`;
}

function generatePreviewScript(config: ConfigState): string {
  return `#!/bin/bash
################################################################################
# Script de Instalacion Desatendida de Odoo ${config.odooVersion} Community Edition
# EDICION EDUCATIVA con Multiempresa
#
# Generado con OdooEdu Configurator
# Fecha: ${new Date().toISOString().split("T")[0]}
################################################################################

set -euo pipefail

#===============================================================================
# CONFIGURACION — Generada con OdooEdu Configurator
#===============================================================================

${generateConfigBlock(config)}

#===============================================================================
# ... (resto del instalador: funciones, PostgreSQL, Nginx, OCA, etc.)
#===============================================================================`;
}

function ScriptPreview({ script }: { script: string }) {
  const [copied, setCopied] = useState(false);
  const lines = script.split("\n");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [script]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-slate-400 ml-2">odoo_install.sh (sección de configuración)</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <div className="overflow-x-auto overflow-y-auto max-h-[500px] p-4">
        <pre className="text-sm font-mono leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="text-slate-600 select-none w-8 text-right mr-4 flex-shrink-0">{i + 1}</span>
              <span className={
                line.startsWith("#") ? "text-slate-500" :
                line.includes("=true") || line.includes("=false") ? "text-cyan-400" :
                line.includes('="') ? "text-emerald-400" :
                line.includes("=$(") ? "text-yellow-400" :
                "text-slate-300"
              }>{line}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function LogViewer({ logs, status }: { logs: string[]; status: InstallStatus }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs.length, autoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  };

  const getLineColor = (line: string) => {
    if (line.includes("[ERROR]") || line.includes("[STDERR]")) return "text-red-400";
    if (line.includes("[AVISO]") || line.includes("[WARN]")) return "text-yellow-400";
    if (line.includes("[OK]")) return "text-emerald-400";
    if (line.includes("[INFO]")) return "text-blue-400";
    return "text-slate-300";
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className={`w-3 h-3 rounded-full ${status === "running" ? "bg-green-500 animate-pulse" : status === "failed" ? "bg-red-500" : status === "completed" ? "bg-green-500" : "bg-slate-500"}`} />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-slate-600" />
          </div>
          <span className="text-xs text-slate-400 ml-2 font-mono">
            {status === "running" ? "Instalando..." : status === "completed" ? "Instalación completada" : status === "failed" ? "Instalación fallida" : "Terminal"}
          </span>
        </div>
        <span className="text-xs text-slate-500">{logs.length} líneas</span>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto max-h-[500px] p-4 font-mono text-xs leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="text-slate-500 text-center py-8">
            Esperando inicio de la instalación...
          </div>
        ) : (
          logs.map((line, i) => (
            <div key={i} className={`${getLineColor(line)} whitespace-pre-wrap break-all`}>
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: InstallStatus }) {
  const map: Record<InstallStatus, { icon: React.ElementType; label: string; className: string }> = {
    idle: { icon: Terminal, label: "Listo para instalar", className: "bg-slate-100 text-slate-600" },
    running: { icon: Loader2, label: "Instalando...", className: "bg-blue-100 text-blue-700" },
    completed: { icon: CheckCircle2, label: "Completado", className: "bg-emerald-100 text-emerald-700" },
    failed: { icon: XCircle, label: "Error", className: "bg-red-100 text-red-700" },
  };
  const s = map[status];
  const Icon = s.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${s.className}`}>
      <Icon className={`w-3.5 h-3.5 ${status === "running" ? "animate-spin" : ""}`} />
      {s.label}
    </span>
  );
}

export default function Configurator() {
  const [config, setConfig] = useState<ConfigState>(defaultConfig);
  const [showPreview, setShowPreview] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("general");
  const [installStatus, setInstallStatus] = useState<InstallStatus>("idle");
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [showInstallPanel, setShowInstallPanel] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confirmInstall, setConfirmInstall] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const isRunning = installStatus === "running";
  const formDisabled = isRunning;

  useEffect(() => {
    fetch(`${API_BASE}/install/status`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status && data.status !== "idle") {
          setInstallStatus(data.status);
          setShowInstallPanel(true);
          if (data.config) setConfig(data.config);
          fetch(`${API_BASE}/install/logs`)
            .then((r) => r.json())
            .then((d) => setInstallLogs(d.logs || []));
          if (data.status === "running") {
            connectSSE();
          }
        }
      })
      .catch(() => {});

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const connectSSE = () => {
    eventSourceRef.current?.close();
    const es = new EventSource(`${API_BASE}/install/stream`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "log") {
          setInstallLogs((prev) => [...prev, msg.data]);
        } else if (msg.type === "status") {
          setInstallStatus(msg.data.status);
          if (msg.data.status === "completed" || msg.data.status === "failed") {
            es.close();
          }
        }
      } catch {}
    };

    es.onerror = () => {
      setTimeout(() => {
        fetch(`${API_BASE}/install/status`)
          .then((r) => r.json())
          .then((data) => {
            setInstallStatus(data.status);
            if (data.status === "running") {
              connectSSE();
            }
          })
          .catch(() => {});
      }, 3000);
      es.close();
    };
  };

  const updateConfig = <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const selectAllOca = () => {
    setConfig((prev) => ({
      ...prev,
      ocaL10nSpain: true, ocaAccountFinancialTools: true, ocaAccountPayment: true,
      ocaBankPayment: true, ocaReportingEngine: true, ocaCommunityDataFiles: true,
      ocaServerTools: true, ocaWeb: true, ocaQueue: true, ocaPartnerContact: true,
      ocaMisBuilder: true, ocaMultiCompany: true, ocaBrand: true,
    }));
  };

  const deselectAllOca = () => {
    setConfig((prev) => ({
      ...prev,
      ocaL10nSpain: false, ocaAccountFinancialTools: false, ocaAccountPayment: false,
      ocaBankPayment: false, ocaReportingEngine: false, ocaCommunityDataFiles: false,
      ocaServerTools: false, ocaWeb: false, ocaQueue: false, ocaPartnerContact: false,
      ocaMisBuilder: false, ocaMultiCompany: false, ocaBrand: false,
    }));
  };

  const resetToDefaults = () => {
    setConfig(defaultConfig);
  };

  const startInstall = async () => {
    setConfirmInstall(false);
    setShowInstallPanel(true);
    setInstallLogs([]);
    setInstallStatus("running");
    setActiveSection("install");

    try {
      const resp = await fetch(`${API_BASE}/install/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!resp.ok) {
        const err = await resp.json();
        setInstallLogs((prev) => [...prev, `[ERROR] ${err.error || "Error desconocido"}`]);
        setInstallStatus("failed");
        return;
      }

      connectSSE();
    } catch (err) {
      setInstallLogs((prev) => [...prev, `[ERROR] No se pudo conectar con el servidor: ${err}`]);
      setInstallStatus("failed");
    }
  };

  const stopInstall = async () => {
    try {
      await fetch(`${API_BASE}/install/stop`, { method: "POST" });
    } catch {}
  };

  const resetInstall = async () => {
    try {
      await fetch(`${API_BASE}/install/reset`, { method: "POST" });
      setInstallStatus("idle");
      setInstallLogs([]);
      setShowInstallPanel(false);
    } catch {}
  };

  const downloadScript = async () => {
    setDownloading(true);
    try {
      const resp = await fetch(`${API_BASE}/install/generate-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!resp.ok) throw new Error("Error generando script");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "odoo_install.sh";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading:", err);
    } finally {
      setDownloading(false);
    }
  };

  const activeOcaCount = ocaModules.filter((m) => config[m.key] as boolean).length;

  const sections = [
    { id: "general", label: "General", icon: Server },
    { id: "education", label: "Educación", icon: GraduationCap },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "oca", label: "Módulos OCA", icon: Package },
    { id: "preview", label: "Vista Previa", icon: Eye },
    ...(showInstallPanel ? [{ id: "install", label: "Instalación", icon: Terminal }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Volver</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold font-display text-slate-900">Configurador</h1>
            </div>
            {installStatus !== "idle" && <StatusBadge status={installStatus} />}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              disabled={formDisabled}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
            <button
              onClick={downloadScript}
              disabled={downloading || formDisabled}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">{downloading ? "Generando..." : "Descargar"}</span>
            </button>
            {!isRunning ? (
              <button
                onClick={() => setConfirmInstall(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Play className="w-4 h-4" />
                Instalar
              </button>
            ) : (
              <button
                onClick={stopInstall}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
              >
                <Square className="w-4 h-4" />
                Detener
              </button>
            )}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {confirmInstall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmInstall(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold font-display text-slate-900">Confirmar Instalación</h3>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                Vas a ejecutar la instalación de Odoo {config.odooVersion} en este servidor con la siguiente configuración:
              </p>
              <ul className="text-sm text-slate-600 mb-6 space-y-1 ml-4">
                <li>• Centro: <strong>{config.eduCentroNombre}</strong></li>
                <li>• <strong>{config.eduProfesores.length}</strong> {config.eduProfesores.length === 1 ? "profesor" : "profesores"}: {config.eduProfesores.map(p => p.usuario).join(", ")}</li>
                <li>• <strong>{config.eduGrupos.length}</strong> {config.eduGrupos.length === 1 ? "grupo" : "grupos"} con <strong>{config.eduGrupos.reduce((s, g) => s + g.numAlumnos, 0)}</strong> alumnos total</li>
                {config.eduGrupos.map((g, i) => (
                  <li key={i} className="ml-4 text-xs">— {g.nombre}: {g.numAlumnos} alumnos ({g.passwordPrefix}01...{g.passwordPrefix}{String(g.numAlumnos).padStart(2, "0")})</li>
                ))}
                <li>• <strong>{activeOcaCount}</strong> módulos OCA</li>
                <li>• Nginx: {config.installNginx ? "Sí" : "No"}</li>
              </ul>
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 mb-6">
                Este proceso instalará paquetes del sistema, creará usuarios y bases de datos. Asegúrate de estar ejecutando esto en un servidor Ubuntu 22.04/24.04 limpio.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmInstall(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={startInstall}
                  className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Instalación
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 flex-shrink-0">
            <div className="lg:sticky lg:top-20 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSection(s.id);
                      if (s.id === "preview") setShowPreview(true);
                      document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      activeSection === s.id
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {s.label}
                    {s.id === "oca" && (
                      <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                        {activeOcaCount}
                      </span>
                    )}
                    {s.id === "install" && installStatus === "running" && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </button>
                );
              })}

              <div className="hidden lg:block mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">Nota</span>
                </div>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Configura los parámetros y pulsa "Instalar" para ejecutar la instalación directamente en este servidor. También puedes descargar el script.
                </p>
              </div>
            </div>
          </aside>

          <main className="flex-1 space-y-6">
            <div id="section-general">
              <SectionCard icon={Server} title="Configuración General" color="blue">
                <FieldRow label="Versión de Odoo" description="Solo se soporta la rama 17.0 CE">
                  <select
                    value={config.odooVersion}
                    onChange={(e) => updateConfig("odooVersion", e.target.value)}
                    disabled={formDisabled}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="17.0">17.0 (Community Edition)</option>
                  </select>
                </FieldRow>
                <div className="border-t border-slate-100" />
                <FieldRow label="Puerto HTTP" description="Puerto principal de Odoo">
                  <TextInput value={config.odooPort} onChange={(v) => updateConfig("odooPort", v)} disabled={formDisabled} />
                </FieldRow>
                <FieldRow label="Puerto Longpolling" description="Para chat en vivo y notificaciones">
                  <TextInput value={config.longpollingPort} onChange={(v) => updateConfig("longpollingPort", v)} disabled={formDisabled} />
                </FieldRow>
                <div className="border-t border-slate-100" />
                <FieldRow label="Instalar Nginx" description="Proxy inverso con soporte HTTPS">
                  <ToggleSwitch checked={config.installNginx} onChange={(v) => updateConfig("installNginx", v)} disabled={formDisabled} />
                </FieldRow>
                {config.installNginx && (
                  <>
                    <FieldRow label="Nombre del dominio" description="Usa _ para aceptar cualquier dominio">
                      <TextInput value={config.websiteName} onChange={(v) => updateConfig("websiteName", v)} placeholder="micentro.es" disabled={formDisabled} />
                    </FieldRow>
                    <FieldRow label="Habilitar SSL" description="Requiere dominio configurado y certificado">
                      <ToggleSwitch checked={config.enableSsl} onChange={(v) => updateConfig("enableSsl", v)} disabled={formDisabled} />
                    </FieldRow>
                  </>
                )}
                <div className="border-t border-slate-100" />
                <FieldRow label="Instalar wkhtmltopdf" description="Necesario para generar PDF de facturas e informes">
                  <ToggleSwitch checked={config.installWkhtmltopdf} onChange={(v) => updateConfig("installWkhtmltopdf", v)} disabled={formDisabled} />
                </FieldRow>
              </SectionCard>
            </div>

            <div id="section-education">
              <SectionCard icon={GraduationCap} title="Configuración Educativa" color="green">
                <FieldRow label="Modo Educativo" description="Habilita funciones de multiempresa por alumno">
                  <ToggleSwitch checked={config.eduMode} onChange={(v) => updateConfig("eduMode", v)} disabled={formDisabled} />
                </FieldRow>

                {config.eduMode && (
                  <>
                    <div className="border-t border-slate-100" />

                    <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                      <h4 className="text-sm font-semibold text-violet-800 mb-1">Centro Educativo</h4>
                      <p className="text-xs text-violet-600 mb-4">Nombre del centro para identificar la instalación.</p>
                      <div className="space-y-4">
                        <FieldRow label="Nombre del centro">
                          <TextInput value={config.eduCentroNombre} onChange={(v) => updateConfig("eduCentroNombre", v)} disabled={formDisabled} />
                        </FieldRow>
                      </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <h4 className="text-sm font-semibold text-blue-800">Profesores</h4>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {config.eduProfesores.length} {config.eduProfesores.length === 1 ? "profesor" : "profesores"}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mb-4">Cada profesor tendrá acceso de administrador a todas las bases de datos de todos los grupos.</p>

                      <div className="space-y-3">
                        {config.eduProfesores.map((prof, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-blue-700">Profesor {idx + 1}</span>
                              {config.eduProfesores.length > 1 && (
                                <button
                                  type="button"
                                  disabled={formDisabled}
                                  onClick={() => {
                                    const updated = config.eduProfesores.filter((_, i) => i !== idx);
                                    updateConfig("eduProfesores", updated);
                                  }}
                                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                  title="Eliminar profesor"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
                                <TextInput
                                  value={prof.nombre}
                                  onChange={(v) => {
                                    const updated = [...config.eduProfesores];
                                    updated[idx] = { ...updated[idx], nombre: v };
                                    updateConfig("eduProfesores", updated);
                                  }}
                                  placeholder="Nombre completo"
                                  disabled={formDisabled}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Usuario</label>
                                <TextInput
                                  value={prof.usuario}
                                  onChange={(v) => {
                                    const updated = [...config.eduProfesores];
                                    updated[idx] = { ...updated[idx], usuario: v };
                                    updateConfig("eduProfesores", updated);
                                  }}
                                  placeholder="login"
                                  disabled={formDisabled}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Contraseña</label>
                                <TextInput
                                  value={prof.password}
                                  onChange={(v) => {
                                    const updated = [...config.eduProfesores];
                                    updated[idx] = { ...updated[idx], password: v };
                                    updateConfig("eduProfesores", updated);
                                  }}
                                  type="password"
                                  disabled={formDisabled}
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          disabled={formDisabled}
                          onClick={() => {
                            const n = config.eduProfesores.length + 1;
                            updateConfig("eduProfesores", [
                              ...config.eduProfesores,
                              { nombre: `Profesor ${n}`, usuario: `profesor${n}`, password: `Profesor${n}2024!` },
                            ]);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-blue-300 text-blue-600 text-sm font-medium hover:bg-blue-100/50 hover:border-blue-400 transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                          Añadir profesor
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-sm font-semibold text-emerald-800">Grupos de Alumnos</h4>
                        </div>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          {config.eduGrupos.length} {config.eduGrupos.length === 1 ? "grupo" : "grupos"} · {config.eduGrupos.reduce((sum, g) => sum + g.numAlumnos, 0)} alumnos total
                        </span>
                      </div>
                      <p className="text-xs text-emerald-600 mb-4">
                        Cada grupo puede representar una clase, ciclo o asignatura. Cada alumno de cada grupo recibe su propia base de datos y empresa aislada. Los prefijos deben ser únicos entre grupos.
                      </p>

                      <div className="space-y-3">
                        {config.eduGrupos.map((grupo, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-emerald-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-emerald-700">{grupo.nombre || `Grupo ${idx + 1}`}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-emerald-600">{grupo.numAlumnos} alumnos</span>
                                {config.eduGrupos.length > 1 && (
                                  <button
                                    type="button"
                                    disabled={formDisabled}
                                    onClick={() => {
                                      const updated = config.eduGrupos.filter((_, i) => i !== idx);
                                      updateConfig("eduGrupos", updated);
                                    }}
                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                    title="Eliminar grupo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del grupo</label>
                                <TextInput
                                  value={grupo.nombre}
                                  onChange={(v) => {
                                    const updated = [...config.eduGrupos];
                                    updated[idx] = { ...updated[idx], nombre: v };
                                    updateConfig("eduGrupos", updated);
                                  }}
                                  placeholder="Ej: 1º DAM, 2º DAW"
                                  disabled={formDisabled}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Nº de alumnos</label>
                                <NumberInput
                                  value={grupo.numAlumnos}
                                  onChange={(v) => {
                                    const updated = [...config.eduGrupos];
                                    updated[idx] = { ...updated[idx], numAlumnos: v };
                                    updateConfig("eduGrupos", updated);
                                  }}
                                  min={1}
                                  max={200}
                                  disabled={formDisabled}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Prefijo de BD</label>
                                <TextInput
                                  value={grupo.dbPrefix}
                                  onChange={(v) => {
                                    const updated = [...config.eduGrupos];
                                    updated[idx] = { ...updated[idx], dbPrefix: v };
                                    updateConfig("eduGrupos", updated);
                                  }}
                                  placeholder="empresa"
                                  disabled={formDisabled}
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">BD: {grupo.dbPrefix}01, {grupo.dbPrefix}02...</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Prefijo de usuario</label>
                                <TextInput
                                  value={grupo.passwordPrefix}
                                  onChange={(v) => {
                                    const updated = [...config.eduGrupos];
                                    updated[idx] = { ...updated[idx], passwordPrefix: v };
                                    updateConfig("eduGrupos", updated);
                                  }}
                                  placeholder="alumno"
                                  disabled={formDisabled}
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">User/Pass: {grupo.passwordPrefix}01, {grupo.passwordPrefix}02...</p>
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          disabled={formDisabled}
                          onClick={() => {
                            const n = config.eduGrupos.length + 1;
                            updateConfig("eduGrupos", [
                              ...config.eduGrupos,
                              { nombre: `Grupo ${n}`, numAlumnos: 30, dbPrefix: `grupo${n}_empresa`, passwordPrefix: `grupo${n}_alumno` },
                            ]);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-emerald-300 text-emerald-600 text-sm font-medium hover:bg-emerald-100/50 hover:border-emerald-400 transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                          Añadir grupo
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100" />
                    <FieldRow label="Directorio de backups" description="Ruta donde se almacenan las copias de seguridad">
                      <TextInput value={config.eduBackupDir} onChange={(v) => updateConfig("eduBackupDir", v)} disabled={formDisabled} />
                    </FieldRow>
                    <FieldRow label="Retención de backups (días)" description="Los backups más antiguos se eliminan automáticamente">
                      <NumberInput value={config.eduBackupRetentionDays} onChange={(v) => updateConfig("eduBackupRetentionDays", v)} min={1} max={365} disabled={formDisabled} />
                    </FieldRow>
                  </>
                )}
              </SectionCard>
            </div>

            <div id="section-branding">
              <SectionCard icon={Palette} title="Branding / Marca Blanca" color="purple">
                <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4 text-violet-600" />
                    <h4 className="text-sm font-semibold text-violet-800">Personalización de Odoo</h4>
                  </div>
                  <p className="text-xs text-violet-600 leading-relaxed">
                    Configura la identidad visual de tu centro en Odoo. El logo, colores y datos de empresa se aplicarán automáticamente a todas las bases de datos durante la instalación. Requiere el módulo OCA <strong>Brand</strong> activado.
                  </p>
                </div>

                <div className="border-t border-slate-100" />

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <h4 className="text-sm font-semibold text-slate-800">Datos de la Empresa</h4>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Información de la empresa que aparecerá en informes, facturas y comunicaciones.</p>
                  <div className="space-y-4">
                    <FieldRow label="Nombre de la empresa" description="Nombre oficial que aparece en Odoo">
                      <TextInput value={config.brandCompanyName} onChange={(v) => updateConfig("brandCompanyName", v)} placeholder="IES Manuel Martín González" disabled={formDisabled} />
                    </FieldRow>
                    <FieldRow label="Eslogan / Lema" description="Texto breve bajo el nombre (opcional)">
                      <TextInput value={config.brandCompanyTagline} onChange={(v) => updateConfig("brandCompanyTagline", v)} placeholder="Formación Profesional de calidad" disabled={formDisabled} />
                    </FieldRow>
                    <div className="border-t border-slate-100" />
                    <FieldRow label="Sitio web" description="URL pública del centro">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <TextInput value={config.brandCompanyWebsite} onChange={(v) => updateConfig("brandCompanyWebsite", v)} placeholder="https://www.micentro.es" disabled={formDisabled} />
                      </div>
                    </FieldRow>
                    <FieldRow label="Email de contacto">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <TextInput value={config.brandCompanyEmail} onChange={(v) => updateConfig("brandCompanyEmail", v)} placeholder="info@micentro.es" disabled={formDisabled} />
                      </div>
                    </FieldRow>
                    <FieldRow label="Teléfono">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <TextInput value={config.brandCompanyPhone} onChange={(v) => updateConfig("brandCompanyPhone", v)} placeholder="+34 922 000 000" disabled={formDisabled} />
                      </div>
                    </FieldRow>
                    <div className="border-t border-slate-100" />
                    <FieldRow label="Dirección (calle)" description="Dirección postal del centro">
                      <TextInput value={config.brandCompanyStreet} onChange={(v) => updateConfig("brandCompanyStreet", v)} placeholder="C/ Ejemplo, 1" disabled={formDisabled} />
                    </FieldRow>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
                        <TextInput value={config.brandCompanyCity} onChange={(v) => updateConfig("brandCompanyCity", v)} placeholder="Santa Cruz de Tenerife" disabled={formDisabled} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Código Postal</label>
                        <TextInput value={config.brandCompanyZip} onChange={(v) => updateConfig("brandCompanyZip", v)} placeholder="38001" disabled={formDisabled} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Provincia / Comunidad</label>
                        <TextInput value={config.brandCompanyState} onChange={(v) => updateConfig("brandCompanyState", v)} placeholder="Santa Cruz de Tenerife" disabled={formDisabled} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">País (código ISO)</label>
                        <TextInput value={config.brandCompanyCountry} onChange={(v) => updateConfig("brandCompanyCountry", v)} placeholder="ES" disabled={formDisabled} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Image className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-semibold text-amber-800">Logo y Favicon</h4>
                  </div>
                  <p className="text-xs text-amber-600 mb-4">Proporciona URLs públicas de tus imágenes. Se descargarán durante la instalación.</p>
                  <div className="space-y-4">
                    <FieldRow label="URL del Logo" description="Formato PNG con fondo transparente. Tamaño recomendado: 200×60 px (máx. 300×100 px)">
                      <TextInput value={config.brandLogoUrl} onChange={(v) => updateConfig("brandLogoUrl", v)} placeholder="https://ejemplo.com/mi-logo.png" disabled={formDisabled} />
                    </FieldRow>
                    <div className="bg-white rounded-lg p-3 border border-amber-100">
                      <p className="text-xs text-amber-700 font-medium mb-1">Requisitos del logo:</p>
                      <ul className="text-xs text-amber-600 space-y-0.5 ml-3 list-disc">
                        <li>Formato: <strong>PNG</strong> (con transparencia) o <strong>SVG</strong></li>
                        <li>Tamaño recomendado: <strong>200 × 60 px</strong></li>
                        <li>Tamaño máximo: <strong>300 × 100 px</strong></li>
                        <li>Se muestra en la barra superior, login, informes y correos</li>
                      </ul>
                    </div>
                    {config.brandLogoUrl && (
                      <div className="bg-white rounded-lg p-4 border border-amber-100 flex items-center justify-center">
                        <img
                          src={config.brandLogoUrl}
                          alt="Vista previa del logo"
                          className="max-h-16 max-w-[250px] object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="border-t border-amber-100" />
                    <FieldRow label="URL del Favicon" description="Icono de pestaña del navegador. Formato: PNG o ICO, tamaño: 32×32 px">
                      <TextInput value={config.brandFaviconUrl} onChange={(v) => updateConfig("brandFaviconUrl", v)} placeholder="https://ejemplo.com/favicon.png" disabled={formDisabled} />
                    </FieldRow>
                    <div className="bg-white rounded-lg p-3 border border-amber-100">
                      <p className="text-xs text-amber-700 font-medium mb-1">Requisitos del favicon:</p>
                      <ul className="text-xs text-amber-600 space-y-0.5 ml-3 list-disc">
                        <li>Formato: <strong>PNG</strong> o <strong>ICO</strong></li>
                        <li>Tamaño: <strong>32 × 32 px</strong></li>
                        <li>Se muestra como icono en la pestaña del navegador</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Palette className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-blue-800">Colores Corporativos</h4>
                  </div>
                  <p className="text-xs text-blue-600 mb-4">Personaliza los colores de la interfaz de Odoo. Formato hexadecimal (#RRGGBB).</p>
                  <div className="space-y-4">
                    <FieldRow label="Color principal" description="Barra superior, botones principales y acentos">
                      <ColorInput value={config.brandPrimaryColor} onChange={(v) => updateConfig("brandPrimaryColor", v)} disabled={formDisabled} />
                    </FieldRow>
                    <FieldRow label="Color secundario" description="Elementos secundarios y hover">
                      <ColorInput value={config.brandSecondaryColor} onChange={(v) => updateConfig("brandSecondaryColor", v)} disabled={formDisabled} />
                    </FieldRow>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-blue-700 font-medium mb-2">Vista previa de colores:</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-200" style={{ backgroundColor: config.brandPrimaryColor }} />
                          <span className="text-xs text-slate-600 font-mono">{config.brandPrimaryColor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-200" style={{ backgroundColor: config.brandSecondaryColor }} />
                          <span className="text-xs text-slate-600 font-mono">{config.brandSecondaryColor}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white font-medium" style={{ backgroundColor: config.brandPrimaryColor }}>
                          Botón ejemplo
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div id="section-oca">
              <SectionCard icon={Package} title="Módulos OCA" color="purple">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-violet-700">{activeOcaCount}</span> de {ocaModules.length} módulos seleccionados
                  </p>
                  <div className="flex gap-2">
                    <button onClick={selectAllOca} disabled={formDisabled} className="text-xs px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors font-medium disabled:opacity-50">
                      Seleccionar todos
                    </button>
                    <button onClick={deselectAllOca} disabled={formDisabled} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium disabled:opacity-50">
                      Deseleccionar todos
                    </button>
                  </div>
                </div>
                <div className="border-t border-slate-100" />
                <div className="grid gap-3">
                  {ocaModules.map((mod) => (
                    <div
                      key={mod.key}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        config[mod.key]
                          ? "bg-violet-50/50 border-violet-200"
                          : "bg-slate-50/50 border-slate-200"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{mod.label}</p>
                        <p className="text-xs text-slate-500">{mod.description}</p>
                      </div>
                      <ToggleSwitch
                        checked={config[mod.key] as boolean}
                        onChange={(v) => updateConfig(mod.key, v as never)}
                        disabled={formDisabled}
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            <div id="section-preview">
              <SectionCard icon={Eye} title="Vista Previa del Script" color="cyan">
                <p className="text-sm text-slate-600 mb-4">
                  Vista previa de la sección de configuración del script que se usará para la instalación.
                </p>
                {showPreview ? (
                  <ScriptPreview script={generatePreviewScript(config)} />
                ) : (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="w-full py-8 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex flex-col items-center gap-2"
                  >
                    <Eye className="w-6 h-6" />
                    <span className="text-sm font-medium">Haz clic para ver la vista previa</span>
                  </button>
                )}
              </SectionCard>
            </div>

            {showInstallPanel && (
              <div id="section-install">
                <SectionCard icon={Terminal} title="Consola de Instalación" color="orange">
                  <div className="flex items-center justify-between mb-4">
                    <StatusBadge status={installStatus} />
                    <div className="flex gap-2">
                      {installStatus === "completed" || installStatus === "failed" ? (
                        <button
                          onClick={resetInstall}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Nueva instalación
                        </button>
                      ) : null}
                      {isRunning && (
                        <button
                          onClick={stopInstall}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
                        >
                          <Square className="w-3.5 h-3.5" />
                          Detener
                        </button>
                      )}
                    </div>
                  </div>
                  <LogViewer logs={installLogs} status={installStatus} />
                  {installStatus === "completed" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-sm font-semibold text-emerald-800">Instalación completada</h4>
                      </div>
                      <p className="text-xs text-emerald-700">
                        Odoo se ha instalado correctamente. Accede a tu instancia en el puerto {config.odooPort}.
                        Usa los scripts auxiliares para crear alumnos y gestionar las bases de datos.
                      </p>
                    </motion.div>
                  )}
                  {installStatus === "failed" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <h4 className="text-sm font-semibold text-red-800">Instalación fallida</h4>
                      </div>
                      <p className="text-xs text-red-700">
                        Revisa los logs de arriba para identificar el error. Puedes corregir la configuración y volver a intentarlo.
                      </p>
                    </motion.div>
                  )}
                </SectionCard>
              </div>
            )}

            {!showInstallPanel && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl shadow-lg"
              >
                <div>
                  <h3 className="text-lg font-bold text-white font-display">¿Listo para instalar?</h3>
                  <p className="text-sm text-emerald-200 mt-1">
                    Ejecuta la instalación directamente en este servidor o descarga el script personalizado.
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button
                    onClick={downloadScript}
                    disabled={downloading}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-800/50 text-white font-semibold hover:bg-emerald-800/70 transition-colors border border-emerald-500/30"
                  >
                    <Download className="w-5 h-5" />
                    Descargar
                  </button>
                  <button
                    onClick={() => setConfirmInstall(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors shadow-sm"
                  >
                    <Play className="w-5 h-5" />
                    Instalar Ahora
                  </button>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
