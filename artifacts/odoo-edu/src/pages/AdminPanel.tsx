import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

const API_BASE = `${import.meta.env.BASE_URL}api`;
import {
  Lock, Eye, EyeOff, LogOut,
  Users, GraduationCap, Palette, RefreshCw,
  Plus, Trash2, Save, CheckCircle2, AlertTriangle,
  Building2, Image, Globe, Mail, Phone, MapPin, Landmark,
  Server, Database, Shield,
  Download, RotateCcw, ChevronDown, Info,
  ShieldCheck, ShieldAlert, ShieldX, GitBranch,
  ArrowUpCircle, Clock, ExternalLink, Ban,
  FileCheck, FileWarning, CalendarClock
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
  profesor: Profesor;
}

type FiscalRegime = "iva" | "igic";

interface VerifactuConfig {
  enabled: boolean;
  environment: "production" | "test";
  nifRepresentante: string;
  nombreRazonSocial: string;
  nifTitular: string;
  softwareName: string;
  softwareVersion: string;
}

interface FiscalConfig {
  regime: FiscalRegime;
  recargo: boolean;
  verifactu: VerifactuConfig;
}

interface BrandingConfig {
  companyName: string;
  companyTagline: string;
  companyWebsite: string;
  companyEmail: string;
  companyPhone: string;
  companyStreet: string;
  companyCity: string;
  companyZip: string;
  companyState: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fiscal: FiscalConfig;
}

type UserRole = "superadmin" | "profesor";

interface AuthState {
  authenticated: boolean;
  role: UserRole;
  username: string;
  grupoIndex?: number;
  token?: string;
  grupoNombre?: string;
}

type Tab = "grupos" | "branding" | "actualizaciones";

type OdooVersionId = "14.0" | "15.0" | "16.0" | "17.0" | "18.0";
type StabilityLevel = "stable" | "beta" | "unavailable";

interface OdooVersion {
  id: OdooVersionId;
  name: string;
  releaseDate: string;
  eolDate: string;
  isLTS: boolean;
  current: boolean;
}

interface OcaModuleStatus {
  repo: string;
  category: string;
  branches: Record<OdooVersionId, StabilityLevel>;
  lastUpdate: string;
  pendingCommits: number;
}

const ODOO_VERSIONS: OdooVersion[] = [
  { id: "14.0", name: "Odoo 14.0 CE", releaseDate: "Oct 2020", eolDate: "Oct 2023", isLTS: false, current: false },
  { id: "15.0", name: "Odoo 15.0 CE", releaseDate: "Oct 2021", eolDate: "Oct 2024", isLTS: false, current: false },
  { id: "16.0", name: "Odoo 16.0 CE", releaseDate: "Oct 2022", eolDate: "Oct 2025", isLTS: true, current: false },
  { id: "17.0", name: "Odoo 17.0 CE", releaseDate: "Nov 2023", eolDate: "Nov 2026", isLTS: true, current: true },
  { id: "18.0", name: "Odoo 18.0 CE", releaseDate: "Oct 2025", eolDate: "Oct 2028", isLTS: false, current: false },
];

const OCA_MODULES: OcaModuleStatus[] = [
  { repo: "l10n-spain", category: "Localización", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 3 días", pendingCommits: 0 },
  { repo: "account-financial-tools", category: "Contabilidad", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 5 días", pendingCommits: 2 },
  { repo: "account-financial-reporting", category: "Contabilidad", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 1 semana", pendingCommits: 0 },
  { repo: "account-payment", category: "Contabilidad", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "stable" }, lastUpdate: "Hace 2 días", pendingCommits: 1 },
  { repo: "account-invoicing", category: "Contabilidad", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 4 días", pendingCommits: 0 },
  { repo: "bank-payment", category: "Contabilidad", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "stable" }, lastUpdate: "Hace 6 días", pendingCommits: 0 },
  { repo: "reporting-engine", category: "Sistema", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "stable" }, lastUpdate: "Hace 1 día", pendingCommits: 3 },
  { repo: "server-tools", category: "Sistema", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "stable" }, lastUpdate: "Hace 2 días", pendingCommits: 5 },
  { repo: "web", category: "Sistema", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 3 días", pendingCommits: 1 },
  { repo: "multi-company", category: "Multiempresa", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 1 semana", pendingCommits: 0 },
  { repo: "brand", category: "Branding", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "unavailable" }, lastUpdate: "Hace 2 semanas", pendingCommits: 0 },
  { repo: "sale-workflow", category: "Ventas", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 4 días", pendingCommits: 2 },
  { repo: "purchase-workflow", category: "Compras", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 5 días", pendingCommits: 0 },
  { repo: "stock-logistics-workflow", category: "Logística", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 1 semana", pendingCommits: 0 },
  { repo: "stock-logistics-warehouse", category: "Logística", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "unavailable" }, lastUpdate: "Hace 2 semanas", pendingCommits: 0 },
  { repo: "hr", category: "RRHH", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "stable" }, lastUpdate: "Hace 3 días", pendingCommits: 1 },
  { repo: "project", category: "Proyectos", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 5 días", pendingCommits: 0 },
  { repo: "manufacture", category: "Producción", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "unavailable" }, lastUpdate: "Hace 3 semanas", pendingCommits: 0 },
  { repo: "connector", category: "Sistema", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 1 semana", pendingCommits: 0 },
  { repo: "queue", category: "Sistema", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "stable" }, lastUpdate: "Hace 4 días", pendingCommits: 0 },
  { repo: "crm", category: "Ventas", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 6 días", pendingCommits: 0 },
  { repo: "community-data-files", category: "Sistema", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "stable" }, lastUpdate: "Hace 1 día", pendingCommits: 0 },
  { repo: "partner-contact", category: "Contactos", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "stable" }, lastUpdate: "Hace 2 días", pendingCommits: 0 },
  { repo: "mis-builder", category: "Contabilidad", branches: { "14.0": "stable", "15.0": "stable", "16.0": "stable", "17.0": "stable", "18.0": "beta" }, lastUpdate: "Hace 1 semana", pendingCommits: 0 },
];

const IGIC_TAXES = [
  { name: "IGIC 0% (Tipo cero)", rate: "0%", description: "Productos de primera necesidad, libros, medicamentos" },
  { name: "IGIC 3% (Reducido)", rate: "3%", description: "Transporte, hostelería, industria" },
  { name: "IGIC 5% (Reducido)", rate: "5%", description: "Otros bienes y servicios reducidos" },
  { name: "IGIC 7% (General)", rate: "7%", description: "Tipo general aplicable a la mayoría de operaciones" },
  { name: "IGIC 9.5% (Incrementado)", rate: "9.5%", description: "Vehículos, embarcaciones, tabaco" },
  { name: "IGIC 15% (Especial incrementado)", rate: "15%", description: "Artículos de lujo y joyería" },
  { name: "IGIC 20% (Especial)", rate: "20%", description: "Tabaco negro y rubio" },
];

const IVA_TAXES = [
  { name: "IVA 0% (Exento)", rate: "0%", description: "Operaciones exentas (sanidad, educación, seguros)" },
  { name: "IVA 4% (Superreducido)", rate: "4%", description: "Pan, leche, frutas, libros, medicamentos" },
  { name: "IVA 10% (Reducido)", rate: "10%", description: "Alimentación, transporte, hostelería, vivienda" },
  { name: "IVA 21% (General)", rate: "21%", description: "Tipo general aplicable a la mayoría de operaciones" },
];

const SPANISH_STATES: Record<FiscalRegime, string[]> = {
  iva: [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona",
    "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ceuta", "Ciudad Real", "Córdoba",
    "A Coruña", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca",
    "Illes Balears", "Jaén", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Melilla", "Murcia",
    "Navarra", "Ourense", "Palencia", "Pontevedra", "La Rioja", "Salamanca", "Segovia", "Sevilla",
    "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
  ],
  igic: [
    "Las Palmas de Gran Canaria", "Santa Cruz de Tenerife"
  ],
};

const defaultBranding: BrandingConfig = {
  companyName: "Centro de Formacion Profesional",
  companyTagline: "",
  companyWebsite: "",
  companyEmail: "",
  companyPhone: "",
  companyStreet: "",
  companyCity: "",
  companyZip: "",
  companyState: "",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#714B67",
  secondaryColor: "#017e84",
  fiscal: {
    regime: "iva",
    recargo: false,
    verifactu: {
      enabled: false,
      environment: "test",
      nifRepresentante: "",
      nombreRazonSocial: "",
      nifTitular: "",
      softwareName: "OdooEdu",
      softwareVersion: "17.0",
    },
  },
};

export default function AdminPanel() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem("odoo-edu-auth");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return { authenticated: false, role: "superadmin" as UserRole, username: "" };
  });
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("grupos");
  const [grupos, setGrupos] = useState<GrupoAlumnos[]>([]);
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [dbAction, setDbAction] = useState<Record<string, "creating" | "resetting" | "done" | "error" | null>>({});

  const apiFetch = useCallback(async (path: string, options?: RequestInit) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth.token) headers["Authorization"] = `Bearer ${auth.token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...options?.headers } });
    return res;
  }, [auth.token]);

  useEffect(() => {
    if (auth.authenticated && auth.token) {
      apiFetch("/groups").then(r => r.json()).then(data => {
        if (data.grupos) {
          setGrupos(data.grupos.map((g: any) => ({
            nombre: g.nombre,
            numAlumnos: g.numAlumnos,
            dbPrefix: g.dbPrefix,
            passwordPrefix: g.passwordPrefix,
            profesor: { nombre: g.profesorNombre, usuario: g.profesorUsuario, password: g.profesorPassword }
          })));
        }
      }).catch(() => {});
      apiFetch("/branding").then(r => r.json()).then(data => {
        if (data.branding) {
          const b = data.branding;
          setBranding({
            companyName: b.companyName || "",
            companyTagline: b.companyTagline || "",
            companyWebsite: b.companyWebsite || "",
            companyEmail: b.companyEmail || "",
            companyPhone: b.companyPhone || "",
            companyStreet: b.companyStreet || "",
            companyCity: b.companyCity || "",
            companyZip: b.companyZip || "",
            companyState: b.companyState || "",
            logoUrl: b.logoUrl || "",
            faviconUrl: b.faviconUrl || "",
            primaryColor: b.primaryColor || "#714B67",
            secondaryColor: b.secondaryColor || "#017e84",
            fiscal: {
              regime: b.fiscalRegime || "iva",
              recargo: b.fiscalRecargo || false,
              verifactu: {
                enabled: b.verifactuEnabled || false,
                environment: b.verifactuEnvironment || "test",
                nifRepresentante: b.verifactuNifRepresentante || "",
                nombreRazonSocial: b.verifactuRazonSocial || "",
                nifTitular: b.verifactuNifTitular || "",
                softwareName: "OdooEdu",
                softwareVersion: "17.0",
              },
            },
          });
        }
      }).catch(() => {});
    }
  }, [auth.authenticated, auth.token]);

  const handleLogin = useCallback(async () => {
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Error de autenticación");
        return;
      }
      const newAuth: AuthState = {
        authenticated: true,
        role: data.role,
        username: data.user,
        token: data.token,
        grupoNombre: data.grupo,
      };
      setAuth(newAuth);
      localStorage.setItem("odoo-edu-auth", JSON.stringify(newAuth));
    } catch {
      setLoginError("No se pudo conectar con el servidor.");
    }
  }, [loginUser, loginPass]);

  const handleLogout = useCallback(async () => {
    if (auth.token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("odoo-edu-auth");
    setAuth({ authenticated: false, role: "superadmin", username: "" });
    setLoginUser("");
    setLoginPass("");
    setLoginError("");
  }, [auth.token]);

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const gruposApi = grupos.map(g => ({
        nombre: g.nombre,
        numAlumnos: g.numAlumnos,
        dbPrefix: g.dbPrefix,
        passwordPrefix: g.passwordPrefix,
        profesorNombre: g.profesor.nombre,
        profesorUsuario: g.profesor.usuario,
        profesorPassword: g.profesor.password,
      }));

      const groupRes = await apiFetch("/groups/bulk", {
        method: "PUT",
        body: JSON.stringify({ grupos: gruposApi }),
      });
      if (!groupRes.ok) throw new Error("Error al guardar grupos");

      const brandingApi = {
        companyName: branding.companyName,
        companyTagline: branding.companyTagline,
        companyWebsite: branding.companyWebsite,
        companyEmail: branding.companyEmail,
        companyPhone: branding.companyPhone,
        companyStreet: branding.companyStreet,
        companyCity: branding.companyCity,
        companyZip: branding.companyZip,
        companyState: branding.companyState,
        companyCountry: "ES",
        logoUrl: branding.logoUrl,
        faviconUrl: branding.faviconUrl,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        fiscalRegime: branding.fiscal.regime,
        fiscalRecargo: branding.fiscal.recargo,
        verifactuEnabled: branding.fiscal.verifactu.enabled,
        verifactuEnvironment: branding.fiscal.verifactu.environment,
        verifactuNifTitular: branding.fiscal.verifactu.nifTitular,
        verifactuRazonSocial: branding.fiscal.verifactu.nombreRazonSocial,
        verifactuNifRepresentante: branding.fiscal.verifactu.nifRepresentante,
      };

      const brandRes = await apiFetch("/branding", {
        method: "PUT",
        body: JSON.stringify(brandingApi),
      });
      if (!brandRes.ok) throw new Error("Error al guardar branding");

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [grupos, branding, apiFetch]);

  const addGrupo = useCallback(() => {
    const n = grupos.length + 1;
    setGrupos(prev => [...prev, {
      nombre: `Grupo ${n}`,
      numAlumnos: 30,
      dbPrefix: `grupo${n}_empresa`,
      passwordPrefix: `grupo${n}_alumno`,
      profesor: { nombre: `Profesor ${n}`, usuario: `profesor${n}`, password: `Profesor${n}2024!` }
    }]);
  }, [grupos.length]);

  const removeGrupo = useCallback((idx: number) => {
    setGrupos(prev => prev.filter((_, i) => i !== idx));
    setConfirmDelete(null);
  }, []);

  const updateGrupo = useCallback((idx: number, field: string, value: any) => {
    setGrupos(prev => {
      const updated = [...prev];
      if (field.startsWith("profesor.")) {
        const profField = field.split(".")[1];
        updated[idx] = { ...updated[idx], profesor: { ...updated[idx].profesor, [profField]: value } };
      } else {
        updated[idx] = { ...updated[idx], [field]: value };
      }
      return updated;
    });
  }, []);

  const downloadCsv = useCallback((grupo: GrupoAlumnos) => {
    const rows = [["Usuario", "Contraseña", "Base de datos", "Grupo", "Profesor"]];
    for (let i = 1; i <= grupo.numAlumnos; i++) {
      const num = String(i).padStart(2, "0");
      rows.push([
        `${grupo.passwordPrefix}${num}`,
        `${grupo.passwordPrefix}${num}`,
        `${grupo.dbPrefix}_${num}`,
        grupo.nombre,
        grupo.profesor.nombre,
      ]);
    }
    rows.push([grupo.profesor.usuario, grupo.profesor.password, "", grupo.nombre, "(Profesor)"]);
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credenciales_${grupo.nombre.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleCreateDatabases = useCallback(async (grupo: GrupoAlumnos) => {
    setDbAction(prev => ({ ...prev, [grupo.nombre]: "creating" }));
    try {
      const res = await apiFetch(`/groups/${encodeURIComponent(grupo.nombre)}/create-databases`, { method: "POST" });
      if (!res.ok) throw new Error("Error al crear bases de datos");
      setDbAction(prev => ({ ...prev, [grupo.nombre]: "done" }));
      setTimeout(() => setDbAction(prev => ({ ...prev, [grupo.nombre]: null })), 3000);
    } catch {
      setDbAction(prev => ({ ...prev, [grupo.nombre]: "error" }));
      setTimeout(() => setDbAction(prev => ({ ...prev, [grupo.nombre]: null })), 3000);
    }
  }, [apiFetch]);

  const handleResetDatabases = useCallback(async (grupo: GrupoAlumnos) => {
    setDbAction(prev => ({ ...prev, [grupo.nombre]: "resetting" }));
    try {
      const res = await apiFetch(`/groups/${encodeURIComponent(grupo.nombre)}/reset-databases`, { method: "POST" });
      if (!res.ok) throw new Error("Error al resetear bases de datos");
      setDbAction(prev => ({ ...prev, [grupo.nombre]: "done" }));
      setTimeout(() => setDbAction(prev => ({ ...prev, [grupo.nombre]: null })), 3000);
    } catch {
      setDbAction(prev => ({ ...prev, [grupo.nombre]: "error" }));
      setTimeout(() => setDbAction(prev => ({ ...prev, [grupo.nombre]: null })), 3000);
    }
  }, [apiFetch]);

  if (!auth.authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <img 
              src={`${import.meta.env.BASE_URL}images/odoo-edu-logo.png`}
              alt="OdooEdu"
              className="w-20 h-20 object-contain mx-auto mb-4 drop-shadow-lg"
            />
            <h1 className="text-2xl font-display font-bold text-white">
              Odoo<span className="text-blue-400">Edu</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Panel de Administración</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Iniciar sesión</h2>
                <p className="text-xs text-slate-500">Superadministrador o Profesor</p>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {loginError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Usuario</label>
                <input
                  type="text"
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="superadmin"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleLogin}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
              >
                Acceder
              </button>
            </div>
          </div>

          <p className="text-center text-slate-500 text-xs mt-6">
            <Link href="/" className="hover:text-blue-400 transition-colors">
              ← Volver a OdooEdu
            </Link>
          </p>
        </motion.div>
      </div>
    );
  }

  const isSuperadmin = auth.role === "superadmin";
  const visibleGrupos = isSuperadmin ? grupos : grupos.filter(g => g.nombre === auth.grupoNombre);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* TOP BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={`${import.meta.env.BASE_URL}images/odoo-edu-logo.png`}
              alt="OdooEdu"
              className="w-8 h-8 object-contain"
            />
            <span className="font-display font-bold text-lg text-slate-900">
              Odoo<span className="text-blue-600">Edu</span>
            </span>
            <span className="hidden sm:inline-block text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
              {isSuperadmin ? "Superadministrador" : "Profesor"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:block">
              {auth.username}
            </span>
            <div className={`w-2 h-2 rounded-full ${isSuperadmin ? "bg-emerald-500" : "bg-blue-500"}`} />
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TABS - only for superadmin */}
        {isSuperadmin && (
          <div className="flex gap-1 bg-white rounded-xl p-1.5 shadow-sm border border-slate-200 mb-8 w-fit">
            {([
              { id: "grupos" as Tab, label: "Grupos y Profesores", icon: Users },
              { id: "branding" as Tab, label: "Branding", icon: Palette },
              { id: "actualizaciones" as Tab, label: "Actualizaciones", icon: RefreshCw },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* GRUPOS TAB */}
        {(activeTab === "grupos" || !isSuperadmin) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  {isSuperadmin ? "Grupos y Profesores" : `Mi Grupo: ${visibleGrupos[0]?.nombre}`}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {isSuperadmin
                    ? `${grupos.length} ${grupos.length === 1 ? "grupo" : "grupos"} · ${grupos.reduce((s, g) => s + g.numAlumnos, 0)} alumnos total`
                    : `${visibleGrupos[0]?.numAlumnos} alumnos`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isSuperadmin && (
                  <button
                    onClick={addGrupo}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/25"
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo grupo
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saveStatus === "saving"}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    saveStatus === "saved"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                  }`}
                >
                  {saveStatus === "saving" ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : saveStatus === "saved" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saveStatus === "saved" ? "Guardado" : "Guardar cambios"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {visibleGrupos.map((grupo, displayIdx) => {
                const realIdx = isSuperadmin ? displayIdx : grupos.findIndex(g => g.nombre === auth.grupoNombre);
                return (
                  <div key={realIdx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{grupo.nombre}</h3>
                            <p className="text-xs text-slate-500">{grupo.numAlumnos} alumnos · BD: {grupo.dbPrefix}XX</p>
                          </div>
                        </div>
                        {isSuperadmin && grupos.length > 1 && (
                          confirmDelete === realIdx ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-600 font-medium">¿Eliminar grupo?</span>
                              <button
                                onClick={() => removeGrupo(realIdx)}
                                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                              >
                                Sí, eliminar
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(realIdx)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar grupo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>

                      {/* Group fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <InputField
                          label="Nombre del grupo"
                          value={grupo.nombre}
                          onChange={v => updateGrupo(realIdx, "nombre", v)}
                          disabled={!isSuperadmin}
                        />
                        <InputField
                          label="Nº de alumnos"
                          value={String(grupo.numAlumnos)}
                          onChange={v => updateGrupo(realIdx, "numAlumnos", parseInt(v) || 0)}
                          type="number"
                          disabled={!isSuperadmin}
                        />
                        <InputField
                          label="Prefijo de BD"
                          value={grupo.dbPrefix}
                          onChange={v => updateGrupo(realIdx, "dbPrefix", v)}
                          hint={`${grupo.dbPrefix}01, ${grupo.dbPrefix}02...`}
                          disabled={!isSuperadmin}
                        />
                        <InputField
                          label="Prefijo de usuario"
                          value={grupo.passwordPrefix}
                          onChange={v => updateGrupo(realIdx, "passwordPrefix", v)}
                          hint={`${grupo.passwordPrefix}01, ${grupo.passwordPrefix}02...`}
                          disabled={!isSuperadmin}
                        />
                      </div>
                    </div>

                    {/* Professor section */}
                    <div className="p-6 bg-blue-50/50">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">Profesor asignado</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputField
                          label="Nombre"
                          value={grupo.profesor.nombre}
                          onChange={v => updateGrupo(realIdx, "profesor.nombre", v)}
                          disabled={!isSuperadmin}
                        />
                        <InputField
                          label="Usuario"
                          value={grupo.profesor.usuario}
                          onChange={v => updateGrupo(realIdx, "profesor.usuario", v)}
                          disabled={!isSuperadmin}
                        />
                        <InputField
                          label="Contraseña"
                          value={grupo.profesor.password}
                          onChange={v => updateGrupo(realIdx, "profesor.password", v)}
                          type="password"
                          disabled={!isSuperadmin}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => downloadCsv(grupo)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Descargar CSV credenciales
                      </button>
                      <button
                        onClick={() => handleCreateDatabases(grupo)}
                        disabled={dbAction[grupo.nombre] === "creating" || dbAction[grupo.nombre] === "resetting"}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        {dbAction[grupo.nombre] === "creating" ? <RefreshCw className="w-4 h-4 animate-spin" /> : dbAction[grupo.nombre] === "done" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Database className="w-4 h-4" />}
                        {dbAction[grupo.nombre] === "creating" ? "Creando..." : dbAction[grupo.nombre] === "done" ? "Completado" : dbAction[grupo.nombre] === "error" ? "Error" : "Crear bases de datos"}
                      </button>
                      <button
                        onClick={() => handleResetDatabases(grupo)}
                        disabled={dbAction[grupo.nombre] === "creating" || dbAction[grupo.nombre] === "resetting"}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-50 transition-colors disabled:opacity-50"
                      >
                        {dbAction[grupo.nombre] === "resetting" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        {dbAction[grupo.nombre] === "resetting" ? "Reseteando..." : "Resetear todas las BDs"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BRANDING TAB */}
        {activeTab === "branding" && isSuperadmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-900">Branding / Marca Blanca</h2>
                <p className="text-slate-500 text-sm mt-1">Personaliza la identidad visual de Odoo. Los cambios se aplicarán a todas las bases de datos.</p>
              </div>
              <button
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  saveStatus === "saved"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                }`}
              >
                {saveStatus === "saving" ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveStatus === "saved" ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saveStatus === "saved" ? "Guardado" : "Guardar y aplicar"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
              {/* Company Data */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-bold text-slate-900">Datos de la Empresa</h3>
                </div>
                <div className="space-y-4">
                  <InputField label="Nombre de la empresa" value={branding.companyName} onChange={v => setBranding(b => ({ ...b, companyName: v }))} />
                  <InputField label="Eslogan / Lema" value={branding.companyTagline} onChange={v => setBranding(b => ({ ...b, companyTagline: v }))} />
                  <InputField label="Sitio web" value={branding.companyWebsite} onChange={v => setBranding(b => ({ ...b, companyWebsite: v }))} icon={<Globe className="w-4 h-4 text-slate-400" />} />
                  <InputField label="Email" value={branding.companyEmail} onChange={v => setBranding(b => ({ ...b, companyEmail: v }))} icon={<Mail className="w-4 h-4 text-slate-400" />} />
                  <InputField label="Teléfono" value={branding.companyPhone} onChange={v => setBranding(b => ({ ...b, companyPhone: v }))} icon={<Phone className="w-4 h-4 text-slate-400" />} />
                  <InputField label="Dirección" value={branding.companyStreet} onChange={v => setBranding(b => ({ ...b, companyStreet: v }))} icon={<MapPin className="w-4 h-4 text-slate-400" />} />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Ciudad" value={branding.companyCity} onChange={v => setBranding(b => ({ ...b, companyCity: v }))} />
                    <InputField label="Código Postal" value={branding.companyZip} onChange={v => setBranding(b => ({ ...b, companyZip: v }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Provincia</label>
                    <select
                      value={branding.companyState}
                      onChange={e => setBranding(b => ({ ...b, companyState: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Seleccionar provincia...</option>
                      {SPANISH_STATES[branding.fiscal.regime].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Fiscal Regime */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Landmark className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-bold text-slate-900">Régimen Fiscal</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {([
                    { id: "iva" as FiscalRegime, label: "IVA (Península y Baleares)", desc: "Impuesto sobre el Valor Añadido" },
                    { id: "igic" as FiscalRegime, label: "IGIC (Canarias)", desc: "Impuesto General Indirecto Canario" },
                  ]).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setBranding(b => ({ ...b, companyState: "", fiscal: { ...b.fiscal, regime: opt.id } }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        branding.fiscal.regime === opt.id
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className={`font-semibold text-sm ${branding.fiscal.regime === opt.id ? "text-blue-700" : "text-slate-800"}`}>
                        {opt.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {branding.fiscal.regime === "igic" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <strong>Canarias:</strong> Se configurará el IGIC en lugar del IVA en todas las bases de datos de alumnos. 
                      Se instalarán las posiciones fiscales y los tipos impositivos específicos de Canarias del módulo <code className="bg-amber-100 px-1 rounded">l10n_es</code>.
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={branding.fiscal.recargo}
                      onChange={e => setBranding(b => ({ ...b, fiscal: { ...b.fiscal, recargo: e.target.checked } }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                  <div>
                    <span className="text-sm font-medium text-slate-800">Recargo de equivalencia</span>
                    <p className="text-xs text-slate-500">Activa los recargos de equivalencia para comerciantes minoristas</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700">
                      Tipos impositivos que se preconfigurarán — {branding.fiscal.regime === "igic" ? "IGIC" : "IVA"}
                    </h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {(branding.fiscal.regime === "igic" ? IGIC_TAXES : IVA_TAXES).map(tax => (
                      <div key={tax.name} className="px-4 py-3 flex items-center gap-4">
                        <span className={`inline-flex items-center justify-center w-14 py-1 rounded-full text-xs font-bold ${
                          branding.fiscal.regime === "igic" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {tax.rate}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800">{tax.name}</div>
                          <div className="text-xs text-slate-500">{tax.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-slate-600" />
                      <h4 className="text-base font-bold text-slate-900">VeriFactu</h4>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Reglamento Veri*Factu</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={branding.fiscal.verifactu.enabled}
                        onChange={e => setBranding(b => ({
                          ...b,
                          fiscal: { ...b.fiscal, verifactu: { ...b.fiscal.verifactu, enabled: e.target.checked } }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>

                  <p className="text-xs text-slate-500 mb-4">
                    Sistema de verificación de facturas de la AEAT (RD 1007/2023). Obligatorio a partir del <strong>1 de julio de 2026</strong> para 
                    todos los empresarios y profesionales que expidan facturas.
                  </p>

                  {!branding.fiscal.verifactu.enabled && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                      <CalendarClock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-600">
                        <strong>Pendiente de activar.</strong> VeriFactu será obligatorio para la mayoría de contribuyentes a partir del 1 de julio de 2026. 
                        Al activarlo se configurarán los módulos OCA necesarios (<code className="bg-slate-200 px-1 rounded text-xs">l10n_es_aeat_verifactu</code>) 
                        y se habilitará el envío de registros de facturación a la AEAT.
                      </div>
                    </div>
                  )}

                  {branding.fiscal.verifactu.enabled && (
                    <div className="space-y-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 mb-4">
                        <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-emerald-800">
                          <strong>VeriFactu activado.</strong> Se instalarán y configurarán los módulos de facturación verificable en todas las bases de datos.
                          Las facturas generarán automáticamente el registro de facturación y el código QR de verificación.
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-2">
                        {([
                          { id: "test" as const, label: "Entorno de pruebas", desc: "Envíos al servidor de pruebas de la AEAT" },
                          { id: "production" as const, label: "Producción", desc: "Envíos reales al sistema VeriFactu de la AEAT" },
                        ]).map(env => (
                          <button
                            key={env.id}
                            onClick={() => setBranding(b => ({
                              ...b,
                              fiscal: { ...b.fiscal, verifactu: { ...b.fiscal.verifactu, environment: env.id } }
                            }))}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              branding.fiscal.verifactu.environment === env.id
                                ? env.id === "production"
                                  ? "border-amber-500 bg-amber-50 ring-1 ring-amber-200"
                                  : "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className={`font-semibold text-sm ${
                              branding.fiscal.verifactu.environment === env.id
                                ? env.id === "production" ? "text-amber-700" : "text-blue-700"
                                : "text-slate-800"
                            }`}>
                              {env.label}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{env.desc}</div>
                          </button>
                        ))}
                      </div>

                      {branding.fiscal.verifactu.environment === "production" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                          <FileWarning className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800">
                            <strong>Modo producción:</strong> Las facturas se enviarán al sistema real de la AEAT. 
                            Asegúrate de que el NIF y los datos fiscales son correctos antes de activar este modo.
                            Para entornos educativos se recomienda usar el modo de pruebas.
                          </p>
                        </div>
                      )}

                      <div className="space-y-3 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <InputField
                            label="NIF/CIF del titular"
                            value={branding.fiscal.verifactu.nifTitular}
                            onChange={v => setBranding(b => ({
                              ...b,
                              fiscal: { ...b.fiscal, verifactu: { ...b.fiscal.verifactu, nifTitular: v } }
                            }))}
                          />
                          <InputField
                            label="Razón social"
                            value={branding.fiscal.verifactu.nombreRazonSocial}
                            onChange={v => setBranding(b => ({
                              ...b,
                              fiscal: { ...b.fiscal, verifactu: { ...b.fiscal.verifactu, nombreRazonSocial: v } }
                            }))}
                          />
                        </div>
                        <InputField
                          label="NIF del representante (opcional)"
                          value={branding.fiscal.verifactu.nifRepresentante}
                          onChange={v => setBranding(b => ({
                            ...b,
                            fiscal: { ...b.fiscal, verifactu: { ...b.fiscal.verifactu, nifRepresentante: v } }
                          }))}
                        />
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                          <h5 className="text-sm font-semibold text-slate-700">Funcionalidad VeriFactu incluida</h5>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {[
                            { feature: "Registro de facturación", desc: "Generación automática del registro de alta/anulación conforme al RD 1007/2023" },
                            { feature: "Código QR en facturas", desc: "Código QR de verificación enlazado a la sede electrónica de la AEAT" },
                            { feature: "Huella y encadenamiento", desc: "Hash SHA-256 encadenado entre registros para garantizar la integridad" },
                            { feature: "Envío a la AEAT", desc: "Remisión automática o bajo demanda al sistema VeriFactu de la Agencia Tributaria" },
                            { feature: "Libro de facturas", desc: "Consulta del libro registro de facturas expedidas y recibidas" },
                            { feature: "Certificado digital", desc: "Firma electrónica con certificado de la FNMT o DNIe del titular" },
                          ].map(item => (
                            <div key={item.feature} className="px-4 py-3 flex items-start gap-3">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-800">{item.feature}</div>
                                <div className="text-xs text-slate-500">{item.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              </div>

              {/* Visual Identity */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Image className="w-5 h-5 text-slate-600" />
                    <h3 className="text-lg font-bold text-slate-900">Logo y Favicon</h3>
                  </div>
                  <div className="space-y-4">
                    <InputField label="URL del Logo (PNG 200x60px)" value={branding.logoUrl} onChange={v => setBranding(b => ({ ...b, logoUrl: v }))} />
                    {branding.logoUrl && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-center">
                        <img src={branding.logoUrl} alt="Logo preview" className="max-h-16 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                      </div>
                    )}
                    <InputField label="URL del Favicon (PNG 32x32px)" value={branding.faviconUrl} onChange={v => setBranding(b => ({ ...b, faviconUrl: v }))} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Palette className="w-5 h-5 text-slate-600" />
                    <h3 className="text-lg font-bold text-slate-900">Colores Corporativos</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Color Principal</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.primaryColor}
                          onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))}
                          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={branding.primaryColor}
                          onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Color Secundario</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.secondaryColor}
                          onChange={e => setBranding(b => ({ ...b, secondaryColor: e.target.value }))}
                          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={branding.secondaryColor}
                          onChange={e => setBranding(b => ({ ...b, secondaryColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl overflow-hidden border border-slate-200">
                    <div className="h-12 flex">
                      <div className="flex-1" style={{ backgroundColor: branding.primaryColor }} />
                      <div className="flex-1" style={{ backgroundColor: branding.secondaryColor }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPDATES TAB */}
        {activeTab === "actualizaciones" && isSuperadmin && (
          <UpdatesTab />
        )}
      </div>
    </div>
  );
}

function UpdatesTab() {
  const [installedVersion, setInstalledVersion] = useState<OdooVersionId>("17.0");
  const [selectedVersion, setSelectedVersion] = useState<OdooVersionId>("17.0");
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [ocaFilter, setOcaFilter] = useState<"all" | "pending" | "unstable">("all");
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updatingModules, setUpdatingModules] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [showMigrationWarning, setShowMigrationWarning] = useState(false);
  const [moduleUpdateResults, setModuleUpdateResults] = useState<Record<string, "success" | "skipped" | null>>({});

  const currentVersionData = ODOO_VERSIONS.find(v => v.id === installedVersion)!;
  const targetVersionData = ODOO_VERSIONS.find(v => v.id === selectedVersion)!;
  const isMajorUpgrade = selectedVersion !== installedVersion;

  const getCompatibility = (version: OdooVersionId) => {
    const total = OCA_MODULES.length;
    const stable = OCA_MODULES.filter(m => m.branches[version] === "stable").length;
    const beta = OCA_MODULES.filter(m => m.branches[version] === "beta").length;
    const unavailable = OCA_MODULES.filter(m => m.branches[version] === "unavailable").length;
    return { total, stable, beta, unavailable, percent: Math.round((stable / total) * 100) };
  };

  const compatibility = getCompatibility(selectedVersion);
  const pendingModules = OCA_MODULES.filter(m => m.pendingCommits > 0);
  const unstableModules = OCA_MODULES.filter(m => m.branches[selectedVersion] !== "stable");

  const filteredModules = ocaFilter === "pending"
    ? pendingModules
    : ocaFilter === "unstable"
      ? unstableModules
      : OCA_MODULES;

  const handleCheckUpdates = () => {
    setCheckingUpdates(true);
    setTimeout(() => {
      setCheckingUpdates(false);
      setLastChecked("Ahora mismo");
    }, 2000);
  };

  const handleUpdateStableModules = () => {
    const stableWithPending = OCA_MODULES.filter(
      m => m.branches[installedVersion] === "stable" && m.pendingCommits > 0
    );
    if (stableWithPending.length === 0) return;
    setUpdatingModules(true);
    setTimeout(() => {
      const results: Record<string, "success" | "skipped" | null> = {};
      stableWithPending.forEach(m => { results[m.repo] = "success"; });
      setModuleUpdateResults(results);
      setUpdatingModules(false);
    }, 3000);
  };

  const handleVersionSelect = (v: OdooVersionId) => {
    setSelectedVersion(v);
    setShowVersionDropdown(false);
    if (v !== installedVersion) {
      setShowMigrationWarning(true);
    } else {
      setShowMigrationWarning(false);
    }
  };

  const stabilityBadge = (level: StabilityLevel) => {
    switch (level) {
      case "stable":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
            <ShieldCheck className="w-3 h-3" /> Estable
          </span>
        );
      case "beta":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            <ShieldAlert className="w-3 h-3" /> Beta
          </span>
        );
      case "unavailable":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
            <ShieldX className="w-3 h-3" /> No disponible
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-slate-900">Versión y Actualizaciones</h2>
        <p className="text-slate-500 text-sm mt-1">Gestiona la versión de Odoo y el estado de los módulos OCA instalados.</p>
      </div>

      {/* VERSION MANAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Version Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">Versión Instalada</h3>
              <p className="text-xs text-slate-500">Odoo Community Edition</p>
            </div>
          </div>

          <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-display font-bold text-violet-900">{currentVersionData.name}</p>
                <p className="text-xs text-violet-600 mt-1">
                  Lanzamiento: {currentVersionData.releaseDate} · Soporte hasta: {currentVersionData.eolDate}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {currentVersionData.isLTS && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-200 text-violet-800 text-xs font-semibold">LTS</span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Actual</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckUpdates}
            disabled={checkingUpdates}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${checkingUpdates ? "animate-spin" : ""}`} />
            {checkingUpdates ? "Comprobando..." : "Buscar actualizaciones menores"}
          </button>
          {lastChecked && (
            <p className="text-center text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> Última comprobación: {lastChecked}
            </p>
          )}
        </div>

        {/* Version Selector Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">Cambiar Versión</h3>
              <p className="text-xs text-slate-500">Evalúa la compatibilidad antes de migrar</p>
            </div>
          </div>

          {/* Version dropdown */}
          <div className="relative mb-4">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Versión objetivo</label>
            <button
              onClick={() => setShowVersionDropdown(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 hover:bg-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-slate-400" />
                {targetVersionData.name}
                {selectedVersion === installedVersion && <span className="text-xs text-slate-400">(actual)</span>}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showVersionDropdown ? "rotate-180" : ""}`} />
            </button>
            {showVersionDropdown && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                {ODOO_VERSIONS.map(v => {
                  const compat = getCompatibility(v.id);
                  const isEol = new Date(v.eolDate.replace(/(\w+)\s(\d+)/, "$1 1, $2")) < new Date();
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVersionSelect(v.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                        v.id === selectedVersion ? "bg-blue-50" : ""
                      } ${isEol ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{v.name}</span>
                        {v.isLTS && <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-bold">LTS</span>}
                        {v.id === installedVersion && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">Actual</span>}
                        {isEol && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">EOL</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${compat.percent}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">{compat.percent}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Compatibility overview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-700 mb-3">Compatibilidad de módulos OCA para {selectedVersion}</p>
            <div className="flex gap-3 mb-3">
              <div className="flex-1 text-center p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-lg font-bold text-emerald-700">{compatibility.stable}</p>
                <p className="text-[10px] text-emerald-600">Estables</p>
              </div>
              <div className="flex-1 text-center p-2 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-lg font-bold text-amber-700">{compatibility.beta}</p>
                <p className="text-[10px] text-amber-600">Beta</p>
              </div>
              <div className="flex-1 text-center p-2 rounded-lg bg-red-50 border border-red-200">
                <p className="text-lg font-bold text-red-700">{compatibility.unavailable}</p>
                <p className="text-[10px] text-red-600">No disponibles</p>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: `${(compatibility.stable / compatibility.total) * 100}%` }} />
              <div className="h-full bg-amber-400" style={{ width: `${(compatibility.beta / compatibility.total) * 100}%` }} />
              <div className="h-full bg-red-400" style={{ width: `${(compatibility.unavailable / compatibility.total) * 100}%` }} />
            </div>
          </div>

          {isMajorUpgrade && (
            <button
              disabled={compatibility.unavailable > 0}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors mt-4 ${
                compatibility.unavailable > 0
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {compatibility.unavailable > 0 ? (
                <>
                  <Ban className="w-4 h-4" />
                  Migración no recomendada
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  Iniciar migración a {selectedVersion}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* MIGRATION WARNING */}
      {showMigrationWarning && isMajorUpgrade && (
        <div className={`rounded-2xl border p-6 ${
          compatibility.unavailable > 0
            ? "bg-red-50 border-red-200"
            : compatibility.beta > 3
              ? "bg-amber-50 border-amber-200"
              : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg shrink-0 ${
              compatibility.unavailable > 0
                ? "bg-red-100 text-red-600"
                : compatibility.beta > 3
                  ? "bg-amber-100 text-amber-600"
                  : "bg-blue-100 text-blue-600"
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className={`font-bold mb-2 ${
                compatibility.unavailable > 0 ? "text-red-900" : compatibility.beta > 3 ? "text-amber-900" : "text-blue-900"
              }`}>
                {compatibility.unavailable > 0
                  ? "Migración NO recomendada"
                  : compatibility.beta > 3
                    ? "Migración posible pero con riesgos"
                    : "Migración viable"}
                {" "}— de {installedVersion} a {selectedVersion}
              </h4>

              <div className="space-y-2 text-sm">
                {compatibility.unavailable > 0 && (
                  <p className="text-red-800">
                    <strong>{compatibility.unavailable} módulos no tienen rama para {selectedVersion}</strong>. Estos módulos dejarán de funcionar tras la migración, lo que puede causar errores graves en el sistema. Se recomienda esperar a que la OCA publique ramas estables.
                  </p>
                )}
                {compatibility.beta > 0 && (
                  <p className={compatibility.unavailable > 0 ? "text-red-700" : "text-amber-800"}>
                    <strong>{compatibility.beta} módulos están en fase beta</strong> para {selectedVersion}. Pueden contener errores, funcionalidades incompletas o incompatibilidades. No se garantiza estabilidad en producción.
                  </p>
                )}

                <div className="bg-white/60 rounded-lg p-4 mt-3 border border-slate-200/50">
                  <p className="font-semibold text-slate-800 mb-2">Antes de migrar, ten en cuenta:</p>
                  <ul className="space-y-1.5 text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      El cambio de versión mayor requiere <strong>migración de base de datos</strong> (openupgradelib).
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      Se creará un <strong>backup automático</strong> antes de iniciar la migración.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      Los módulos en beta pueden fallar. <strong>Prueba primero en un entorno de pruebas</strong>.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      Los módulos no disponibles se desactivarán automáticamente.
                    </li>
                  </ul>
                </div>

                {compatibility.unavailable > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-red-800 mb-1">Módulos sin soporte para {selectedVersion}:</p>
                    <div className="flex flex-wrap gap-1">
                      {OCA_MODULES.filter(m => m.branches[selectedVersion] === "unavailable").map(m => (
                        <span key={m.repo} className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-mono">{m.repo}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OCA MODULES DETAIL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Módulos OCA Instalados</h3>
                <p className="text-xs text-slate-500">{OCA_MODULES.length} repositorios · {pendingModules.length} con actualizaciones pendientes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                {([
                  { id: "all" as const, label: "Todos", count: OCA_MODULES.length },
                  { id: "pending" as const, label: "Pendientes", count: pendingModules.length },
                  { id: "unstable" as const, label: "Inestables", count: unstableModules.length },
                ]).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setOcaFilter(f.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      ocaFilter === f.id
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
              <button
                onClick={handleUpdateStableModules}
                disabled={updatingModules || pendingModules.filter(m => m.branches[installedVersion] === "stable").length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updatingModules ? "animate-spin" : ""}`} />
                {updatingModules ? "Actualizando..." : "Actualizar estables"}
              </button>
            </div>
          </div>
        </div>

        {/* Info banner about stability */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            <strong>Solo se actualizan los módulos marcados como "Estable"</strong>. Los módulos en beta o sin rama disponible para tu versión se omiten automáticamente para evitar errores en producción. Cada módulo OCA publica su código por ramas de versión (17.0, 18.0, etc.) — si la rama no existe o no ha pasado los tests de CI, no se considera estable.
          </p>
        </div>

        {/* Module list */}
        <div className="divide-y divide-slate-100">
          {filteredModules.map(mod => (
            <div key={mod.repo} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-sm font-medium text-slate-900 truncate">{mod.repo}</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium shrink-0">{mod.category}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {mod.pendingCommits > 0 && (
                  <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                    <GitBranch className="w-3 h-3" />
                    {mod.pendingCommits} {mod.pendingCommits === 1 ? "commit" : "commits"}
                  </span>
                )}
                <span className="text-xs text-slate-400 hidden sm:block">{mod.lastUpdate}</span>
                {stabilityBadge(mod.branches[selectedVersion])}
                {moduleUpdateResults[mod.repo] === "success" && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> OK
                  </span>
                )}
                <a
                  href={`https://github.com/OCA/${mod.repo}/tree/${selectedVersion}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                  title={`Ver en GitHub (rama ${selectedVersion})`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
          {filteredModules.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-500 text-sm">
              No hay módulos que coincidan con el filtro seleccionado.
            </div>
          )}
        </div>
      </div>

      {/* SYSTEM STATUS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Estado del Sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Servicio Odoo", status: "Activo", color: "bg-emerald-500", textColor: "text-emerald-600" },
            { label: "PostgreSQL", status: "Activo", color: "bg-emerald-500", textColor: "text-emerald-600" },
            { label: "Nginx", status: "Activo", color: "bg-emerald-500", textColor: "text-emerald-600" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className={`text-xs ${item.textColor}`}>{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", disabled = false, hint, icon }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input
          type={isPassword ? (showPwd ? "text" : "password") : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-100 disabled:text-slate-500 ${icon ? "pl-9" : ""} ${isPassword ? "pr-9" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
          >
            {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}
