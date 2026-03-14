import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Lock, Eye, EyeOff, LogOut,
  Users, GraduationCap, Palette, RefreshCw,
  Plus, Trash2, Save, CheckCircle2, AlertTriangle,
  Building2, Image, Globe, Mail, Phone, MapPin,
  Server, Database, Shield,
  Download, RotateCcw
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

interface BrandingConfig {
  companyName: string;
  companyTagline: string;
  companyWebsite: string;
  companyEmail: string;
  companyPhone: string;
  companyStreet: string;
  companyCity: string;
  companyZip: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

type UserRole = "superadmin" | "profesor";

interface AuthState {
  authenticated: boolean;
  role: UserRole;
  username: string;
  grupoIndex?: number;
}

type Tab = "grupos" | "branding" | "actualizaciones";

const defaultBranding: BrandingConfig = {
  companyName: "Centro de Formacion Profesional",
  companyTagline: "",
  companyWebsite: "",
  companyEmail: "",
  companyPhone: "",
  companyStreet: "",
  companyCity: "",
  companyZip: "",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#714B67",
  secondaryColor: "#017e84",
};

const SUPERADMIN_USER = "superadmin";
const SUPERADMIN_PASSWORD = "SuperAdmin2024!";

export default function AdminPanel() {
  const [auth, setAuth] = useState<AuthState>({ authenticated: false, role: "superadmin", username: "" });
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("grupos");
  const [grupos, setGrupos] = useState<GrupoAlumnos[]>([
    {
      nombre: "Grupo 1",
      numAlumnos: 30,
      dbPrefix: "empresa",
      passwordPrefix: "alumno",
      profesor: { nombre: "Profesor", usuario: "profesor", password: "Profesor2024!" }
    }
  ]);
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const handleLogin = useCallback(() => {
    setLoginError("");

    if (loginUser === SUPERADMIN_USER && loginPass === SUPERADMIN_PASSWORD) {
      setAuth({ authenticated: true, role: "superadmin", username: loginUser });
      return;
    }

    const profIdx = grupos.findIndex(g => g.profesor.usuario === loginUser && g.profesor.password === loginPass);
    if (profIdx !== -1) {
      setAuth({ authenticated: true, role: "profesor", username: loginUser, grupoIndex: profIdx });
      return;
    }

    setLoginError("Usuario o contraseña incorrectos.");
  }, [loginUser, loginPass, grupos]);

  const handleLogout = useCallback(() => {
    setAuth({ authenticated: false, role: "superadmin", username: "" });
    setLoginUser("");
    setLoginPass("");
    setLoginError("");
  }, []);

  const handleSave = useCallback(() => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
  }, []);

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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
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
  const visibleGrupos = isSuperadmin ? grupos : [grupos[auth.grupoIndex!]];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* TOP BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
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
                const realIdx = isSuperadmin ? displayIdx : auth.grupoIndex!;
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
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
                        <Download className="w-4 h-4" />
                        Descargar CSV credenciales
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
                        <Database className="w-4 h-4" />
                        Crear bases de datos
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-50 transition-colors">
                        <RotateCcw className="w-4 h-4" />
                        Resetear todas las BDs
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
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900">Actualizaciones</h2>
              <p className="text-slate-500 text-sm mt-1">Gestiona las actualizaciones de Odoo y los módulos OCA.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Odoo 17.0 CE</h3>
                      <p className="text-xs text-slate-500">Community Edition</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    Actualizado
                  </span>
                </div>
                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Buscar actualizaciones
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Módulos OCA</h3>
                      <p className="text-xs text-slate-500">40+ repositorios</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    Actualizado
                  </span>
                </div>
                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Actualizar módulos OCA
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Estado del Sistema</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Servicio Odoo", status: "Activo", color: "emerald" },
                  { label: "PostgreSQL", status: "Activo", color: "emerald" },
                  { label: "Nginx", status: "Activo", color: "emerald" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className={`w-3 h-3 rounded-full bg-${item.color}-500`} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className={`text-xs text-${item.color}-600`}>{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
