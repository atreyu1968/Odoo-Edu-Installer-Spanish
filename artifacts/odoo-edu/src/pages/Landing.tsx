import { motion } from "framer-motion";
import { 
  Terminal, Server, Building2, Palette, Users, Shield, 
  CheckCircle2,
  Database, Lock, MonitorSmartphone, Globe, Settings, BookOpen, LayoutDashboard
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { SectionHeading } from "@/components/SectionHeading";
import StudentLogin from "@/components/StudentLogin";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-200">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={`${import.meta.env.BASE_URL}images/odoo-edu-logo.png`}
              alt="OdooEdu"
              className="w-10 h-10 object-contain"
            />
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">
              Odoo<span className="text-blue-600">Edu</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Características</a>
            <a href="#modules" className="hover:text-blue-600 transition-colors">Módulos OCA</a>
            <a href="#educator" className="hover:text-blue-600 transition-colors">Para Profesores</a>
            <a href="#instructions" className="hover:text-blue-600 transition-colors">Instalación</a>
            <a href="#acceso" className="hover:text-blue-600 transition-colors">Acceso</a>
          </div>
          <a 
            href="https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish" 
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-300 flex items-center gap-2"
          >
            GitHub
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-slate-50/80 to-slate-50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-medium mb-6">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Versión 17.0 Community Edition
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
                La plataforma ERP para{" "}
                <span className="text-gradient">centros de formación</span>
              </h1>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Instalación desatendida profesional con localización española, soporte multiempresa aislado para alumnos, panel de administración web, rebranding y la suite completa de módulos OCA.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a 
                  href="#instructions"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <Terminal className="w-5 h-5 group-hover:animate-bounce" />
                  Instrucciones de Instalación
                </a>
                <a 
                  href="https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-700 border border-slate-200 font-semibold text-lg shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Database className="w-5 h-5 text-slate-400" />
                  Ver en GitHub
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <StudentLogin />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            badge="Características Principales"
            title="Diseñado específicamente para la docencia"
            description="Todo lo necesario para impartir módulos de gestión empresarial, contabilidad y administración sin dolores de cabeza técnicos."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Server,
                title: "Instalación Automática",
                description: "Un solo comando configura Odoo 17, PostgreSQL, Nginx como proxy inverso, certificados SSL y dependencias de sistema sin intervención manual."
              },
              {
                icon: Building2,
                title: "Localización Española",
                description: "Incluye Plan General Contable (l10n_es), modelos AEAT (303, 347, 390), Suministro Inmediato de Información (SII) y Factura-e listos para usar."
              },
              {
                icon: Users,
                title: "Aislamiento Multiempresa",
                description: "Cada alumno recibe su propia base de datos o empresa aislada con datos de demostración españoles precargados (clientes, facturas, productos)."
              },
              {
                icon: Palette,
                title: "Rebranding del Centro",
                description: "Personaliza logo, colores corporativos, datos de empresa y favicon. Se aplica automáticamente a todas las bases de datos de alumnos."
              },
              {
                icon: MonitorSmartphone,
                title: "Panel de Administración",
                description: "Panel web para el superadministrador: gestiona grupos, profesores, branding y actualizaciones sin tocar la terminal."
              },
              {
                icon: Shield,
                title: "Backups y Reseteos",
                description: "Copias de seguridad diarias automatizadas. El profesor puede resetear la empresa de cualquier alumno a su estado inicial desde el panel."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-100 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EDUCATOR SECTION */}
      <section id="educator" className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block py-1 px-3 mb-4 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-semibold tracking-wide uppercase">
                Control Total
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 leading-tight">
                El entorno perfecto <br/>para el profesor
              </h2>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                Olvídate de gestionar decenas de instalaciones. Con OdooEdu tienes una sola plataforma potente, estable y fácil de administrar para todos tus alumnos.
              </p>
              
              <ul className="space-y-5">
                {[
                  "Panel de administración web para el superadministrador.",
                  "Cada profesor gestiona solo su grupo de alumnos.",
                  "Archivo CSV auto-generado con las contraseñas de los alumnos.",
                  "Reseteo de bases de datos y gestión de backups desde el panel.",
                  "Rebranding y actualizaciones centralizadas."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 to-cyan-400/20 blur-3xl rounded-full" />
              <img 
                src={`${import.meta.env.BASE_URL}images/educator-dashboard.png`}
                alt="Teacher Dashboard Mockup" 
                className="relative z-10 w-full rounded-2xl shadow-2xl shadow-black/50 border border-slate-700/50"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* INSTRUCTIONS SECTION */}
      <section id="instructions" className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            badge="Guía de Instalación"
            title="Instalación en 3 pasos"
            description="Despliega el entorno completo en un servidor Ubuntu limpio en menos de 15 minutos."
          />

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-12 flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Requisitos previos</h4>
              <p className="text-blue-800/80 text-sm">
                Servidor VPS o Máquina Virtual con <strong>Ubuntu 22.04 LTS o 24.04 LTS</strong>. <br/>
                Mínimo 4GB de RAM, 2 vCPU y 50GB de disco SSD. Acceso root o sudo.
              </p>
            </div>
          </div>

          <div className="space-y-12">
            {[
              {
                title: "Clonar el repositorio",
                desc: "Descarga el instalador desde GitHub en tu servidor.",
                code: "git clone https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish.git\ncd Odoo-Edu-Installer-Spanish\nchmod +x odoo_install.sh"
              },
              {
                title: "Ejecutar la instalación",
                desc: "El script instalará Odoo 17, PostgreSQL, Nginx, módulos OCA y todas las dependencias de forma automática. El proceso tarda entre 10 y 20 minutos.",
                code: "sudo bash odoo_install.sh"
              },
              {
                title: "Acceder al panel de administración",
                desc: "Al finalizar la instalación, el script te mostrará la URL del panel y las credenciales del superadministrador. Desde el panel podrás crear grupos de alumnos, asignar profesores, configurar el branding y gestionar actualizaciones.",
                code: "# Al finalizar veras algo como:\n# URL: http://TU_IP/admin\n# Usuario: superadmin\n# Contraseña: SuperAdmin2024!\n#\n# Cambia la contraseña por defecto en el primer acceso."
              }
            ].map((step, idx) => (
              <div key={idx} className="relative pl-10 md:pl-0">
                <div className="absolute left-[19px] top-10 bottom-[-40px] w-0.5 bg-slate-200 md:hidden" />
                
                <div className="md:grid md:grid-cols-[100px_1fr] md:gap-6 items-start">
                  <div className="absolute left-0 md:static flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg shadow-md shadow-blue-600/30 z-10">
                    {idx + 1}
                  </div>
                  <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-slate-600 mb-6">{step.desc}</p>
                    <CodeBlock code={step.code} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Post-install callout */}
          <div className="mt-12 bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex items-start gap-4">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900 mb-1">Después de la instalación</h4>
              <p className="text-emerald-800/80 text-sm">
                Lo primero que debes hacer es <strong>acceder al panel como superadministrador</strong> y cambiar la contraseña por defecto.
                Desde el panel podrás crear los grupos de alumnos, asignar un profesor a cada grupo y personalizar la marca del centro.
                Cada profesor recibirá sus credenciales para acceder a su propio panel donde gestiona únicamente su grupo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ACCESS ROUTES SECTION */}
      <section id="acceso" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            badge="Rutas de Acceso"
            title="Todo desde una sola dirección"
            description="Tras la instalación, tu servidor sirve todas las herramientas desde una misma IP o dominio. Aquí tienes el mapa completo."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              {
                icon: Globe,
                route: "/",
                title: "Portal de Acceso",
                description: "Página principal con login para alumnos. El alumno introduce sus credenciales y accede directamente a su empresa en Odoo, sin necesidad de seleccionar base de datos.",
                color: "blue",
                badge: "Alumnos"
              },
              {
                icon: Settings,
                route: "/admin",
                title: "Panel de Administración",
                description: "Panel web para gestionar grupos de alumnos, profesores, branding del centro y estado de los servicios. Requiere login.",
                color: "violet",
                badge: "Superadmin / Profesor"
              },
              {
                icon: BookOpen,
                route: "/web",
                title: "Odoo ERP",
                description: "El ERP Odoo 17. Los alumnos acceden desde la página principal (/) y son redirigidos aquí automáticamente ya autenticados en su empresa.",
                color: "emerald",
                badge: "Acceso automático"
              },
              {
                icon: LayoutDashboard,
                route: "/api/",
                title: "API del Panel",
                description: "Endpoints internos del servidor API que alimentan el panel de administración. No requiere acceso directo.",
                color: "slate",
                badge: "Interno"
              }
            ].map((item, idx) => {
              const colorMap: Record<string, { bg: string; border: string; icon: string; badgeBg: string; badgeText: string }> = {
                blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600", badgeBg: "bg-blue-100", badgeText: "text-blue-700" },
                violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600", badgeBg: "bg-violet-100", badgeText: "text-violet-700" },
                emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
                slate: { bg: "bg-slate-50", border: "border-slate-200", icon: "text-slate-500", badgeBg: "bg-slate-100", badgeText: "text-slate-600" },
              };
              const c = colorMap[item.color];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`relative rounded-2xl border ${c.border} ${c.bg} p-6 hover:shadow-lg transition-shadow duration-300`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${c.badgeBg} ${c.icon} flex items-center justify-center shrink-0`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.badgeBg} ${c.badgeText}`}>
                          {item.badge}
                        </span>
                      </div>
                      <code className={`inline-block text-sm font-mono ${c.icon} font-semibold mb-2`}>
                        http://tu-servidor{item.route}
                      </code>
                      <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              Arquitectura del servidor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                <div className="text-blue-400 font-semibold mb-2">Nginx (puerto 80/443)</div>
                <p className="text-slate-400">Proxy inverso que distribuye las peticiones a cada servicio. Sirve los archivos estáticos de la landing y el panel.</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                <div className="text-violet-400 font-semibold mb-2">API Node.js (puerto 3001)</div>
                <p className="text-slate-400">Servidor Express que gestiona la autenticación, grupos, branding y estado del sistema. Nginx lo expone en <code className="text-violet-300">/api/</code></p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                <div className="text-emerald-400 font-semibold mb-2">Odoo 17 (puerto 8069)</div>
                <p className="text-slate-400">El ERP principal. Nginx lo expone en <code className="text-emerald-300">/web</code>, <code className="text-emerald-300">/longpolling</code> y <code className="text-emerald-300">/websocket</code></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODULES SECTION */}
      <section id="modules" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            badge="Ecosistema Completo"
            title="Más de 40 módulos OCA incluidos"
            description="El instalador clona y preconfigura automáticamente los mejores repositorios de la Odoo Community Association."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                category: "Contabilidad y Finanzas",
                color: "bg-emerald-50 border-emerald-200 text-emerald-800",
                modules: ["l10n-spain", "account-financial-tools", "account-financial-reporting", "account-payment", "account-invoicing", "account-closing", "account-analytic", "account-reconcile", "bank-payment", "credit-control", "currency", "mis-builder"]
              },
              {
                category: "Ventas y Compras",
                color: "bg-blue-50 border-blue-200 text-blue-800",
                modules: ["sale-workflow", "purchase-workflow", "product-attribute", "crm", "e-commerce", "pos"]
              },
              {
                category: "Logística y Almacén",
                color: "bg-amber-50 border-amber-200 text-amber-800",
                modules: ["stock-logistics-workflow", "stock-logistics-warehouse", "delivery-carrier", "intrastat-extrastat"]
              },
              {
                category: "Recursos Humanos",
                color: "bg-rose-50 border-rose-200 text-rose-800",
                modules: ["hr", "hr-attendance", "hr-expense", "hr-holidays"]
              },
              {
                category: "Producción y Proyectos",
                color: "bg-indigo-50 border-indigo-200 text-indigo-800",
                modules: ["manufacture", "project", "management-system"]
              },
              {
                category: "Sistema y Herramientas",
                color: "bg-slate-100 border-slate-300 text-slate-800",
                modules: ["server-tools", "web", "queue", "connector", "edi", "reporting-engine", "community-data-files", "brand", "multi-company"]
              }
            ].map((group, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="rounded-2xl border border-slate-200 p-6 flex flex-col h-full bg-white hover:shadow-lg transition-shadow duration-300"
              >
                <div className={`px-4 py-2 rounded-lg font-semibold mb-6 inline-flex w-fit border ${group.color}`}>
                  {group.category}
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {group.modules.map(mod => (
                    <span key={mod} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                      {mod}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GITHUB CTA */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Preparado para tu centro
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Clona el repositorio, ejecuta el script y accede al panel de administración.
          </p>

          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-8 mb-10 text-left max-w-2xl mx-auto">
            <CodeBlock code={`git clone https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish.git
cd Odoo-Edu-Installer-Spanish
sudo bash odoo_install.sh`} />
          </div>

          <a 
            href="https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish"
            target="_blank"
            rel="noreferrer"
            className="inline-flex px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 items-center gap-3"
          >
            Ver en GitHub
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <img 
                src={`${import.meta.env.BASE_URL}images/asd-logo.png`}
                alt="Atreyu Servicios Digitales" 
                className="h-14 object-contain"
              />
              <div className="flex items-center gap-2">
                <img 
                  src={`${import.meta.env.BASE_URL}images/odoo-edu-logo.png`}
                  alt="OdooEdu"
                  className="w-8 h-8 object-contain"
                />
                <span className="font-display font-bold text-xl text-white">
                  Odoo<span className="text-blue-500">Edu</span>
                </span>
              </div>
            </div>

            <div className="text-center space-y-3 max-w-2xl">
              <p className="text-slate-300 text-sm">
                Script desarrollado por <strong className="text-white">Atreyu Servicios Digitales</strong>
              </p>
              <p className="text-slate-400 text-sm">
                Una iniciativa del <strong className="text-slate-300">Departamento de Administración de Empresas</strong> del <strong className="text-slate-300">IES Manuel Martín González</strong>
              </p>
              <p className="text-xs text-slate-500 mt-4">
                Scripts bajo licencia MIT. Odoo CE bajo LGPL-3. Módulos OCA bajo AGPL-3 o LGPL-3.
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-400">
              <a href="https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
              <span>•</span>
              <a href="https://www.odoo.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Odoo CE</a>
              <span>•</span>
              <a href="https://odoo-community.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">OCA</a>
              <span>•</span>
              <a href="https://github.com/OCA/l10n-spain" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">l10n-spain</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
