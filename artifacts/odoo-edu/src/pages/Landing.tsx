import { motion } from "framer-motion";
import { 
  Terminal, Server, Building2, Palette, Users, Shield, 
  ArrowRight, CheckCircle2, Download, BookOpen, Settings,
  Database, PlayCircle, Sliders
} from "lucide-react";
import { Link } from "wouter";
import { CodeBlock } from "@/components/CodeBlock";
import { SectionHeading } from "@/components/SectionHeading";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-200">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">
              Odoo<span className="text-blue-600">Edu</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Características</a>
            <a href="#modules" className="hover:text-blue-600 transition-colors">Módulos OCA</a>
            <a href="#educator" className="hover:text-blue-600 transition-colors">Para Profesores</a>
            <a href="#instructions" className="hover:text-blue-600 transition-colors">Instalación</a>
          </div>
          <a 
            href="/configurar" 
            className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-300"
          >
            Configurar
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-slate-50/80 to-slate-50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-medium mb-6">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Versión 17.0 Community Edition
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
              La plataforma ERP para <br className="hidden md:block" />
              <span className="text-gradient">centros de formación</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              Script de instalación desatendida profesional con localización española, soporte multiempresa aislado para alumnos, rebranding y la suite completa de módulos OCA.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/configurar"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <Sliders className="w-5 h-5 group-hover:animate-bounce" />
                Configurar Instalación
              </Link>
              <a 
                href="#instructions"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-700 border border-slate-200 font-semibold text-lg shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Terminal className="w-5 h-5 text-slate-400" />
                Ver Instrucciones
              </a>
            </div>
          </motion.div>
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
                description: "Módulo OCA brand preinstalado para sustituir los logotipos y colores de Odoo por la identidad corporativa de tu centro educativo."
              },
              {
                icon: Settings,
                title: "Gestión de Alumnos",
                description: "Scripts incluidos para la creación masiva de cuentas de alumnos. Genera un CSV con todas las credenciales listas para repartir en clase."
              },
              {
                icon: Shield,
                title: "Backups y Reseteos",
                description: "Copias de seguridad diarias automatizadas. Además, el profesor puede resetear la empresa de cualquier alumno a su estado inicial con un comando."
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
                  "Usuario 'profesor' con acceso administrador a todas las BDs.",
                  "Archivo CSV auto-generado con las contraseñas de los alumnos.",
                  "Script de reseteo: si un alumno rompe algo, devuélvelo al estado inicial en 5 segundos.",
                  "Políticas de retención de backups configurables (ej: 30 días)."
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
            badge="Guía Rápida"
            title="Instalación en 5 pasos"
            description="Despliega el entorno completo en un servidor Ubuntu limpio en menos de 15 minutos."
          />

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-12 flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Requisitos previos recomendados</h4>
              <p className="text-blue-800/80 text-sm">
                Servidor VPS o Máquina Virtual con Ubuntu 22.04 LTS o 24.04 LTS. <br/>
                Mínimo 4GB de RAM, 2 vCPU y 50GB de disco SSD. Acceso root o sudo.
              </p>
            </div>
          </div>

          <div className="space-y-12">
            {[
              {
                title: "Descargar el script de instalación",
                desc: "Clona el repositorio o descarga directamente el archivo odoo_install.sh en tu servidor.",
                code: "git clone https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish.git\ncd Odoo-Edu-Installer-Spanish\nchmod +x odoo_install.sh"
              },
              {
                title: "Ejecutar la instalación desatendida",
                desc: "Este proceso tardará varios minutos. Descargará Odoo, instalará dependencias, PostgreSQL, y los repositorios OCA.",
                code: "sudo bash odoo_install.sh"
              },
              {
                title: "Crear bases de datos para alumnos",
                desc: "Usa el script auxiliar para generar automáticamente el entorno de todos tus alumnos. Por ejemplo, para 30 alumnos:",
                code: "sudo odoo_crear_alumnos.sh 30"
              },
              {
                title: "Repartir credenciales",
                desc: "El paso anterior generará un archivo CSV en el directorio de Odoo. Puedes descargarlo y enviarlo a los alumnos.",
                code: "cat /opt/odoo17/credenciales_alumnos.csv"
              }
            ].map((step, idx) => (
              <div key={idx} className="relative pl-10 md:pl-0">
                {/* Timeline line on mobile */}
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
        </div>
      </section>

      {/* MODULES SECTION */}
      <section id="modules" className="py-24 bg-white">
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

      {/* DOWNLOAD / QUICKSTART */}
      <section id="download" className="py-24 bg-slate-900 relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Preparado para tu centro
            </h2>
            <p className="text-slate-400 text-lg">
              Descarga, configura las variables y ejecuta. OdooEdu hace el resto.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden mb-12">
            <div className="p-6 border-b border-slate-700 bg-slate-800/80">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Variables de configuración (odoo_install.sh)
              </h3>
              <p className="text-sm text-slate-400 mt-1">Edita el principio del script antes de ejecutarlo para adaptarlo a tu clase.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/50 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-mono font-medium">Variable</th>
                    <th className="px-6 py-4 font-medium">Valor por defecto</th>
                    <th className="px-6 py-4 font-medium">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-blue-300">EDU_NUM_ALUMNOS</td>
                    <td className="px-6 py-4 font-mono">30</td>
                    <td className="px-6 py-4">Número de bases de datos/empresas a crear.</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-blue-300">EDU_PASSWORD_PREFIX</td>
                    <td className="px-6 py-4 font-mono">"alumno"</td>
                    <td className="px-6 py-4">Prefijo para usuario y contraseña (ej: alumno01).</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-blue-300">EDU_DB_PREFIX</td>
                    <td className="px-6 py-4 font-mono">"empresa"</td>
                    <td className="px-6 py-4">Prefijo para la base de datos (ej: empresa01).</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-blue-300">EDU_PROFESOR_USER</td>
                    <td className="px-6 py-4 font-mono">"profesor"</td>
                    <td className="px-6 py-4">Usuario maestro con acceso global.</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-blue-300">EDU_CENTRO_NOMBRE</td>
                    <td className="px-6 py-4 font-mono">"Centro FP"</td>
                    <td className="px-6 py-4">Nombre que aparecerá por defecto en las empresas.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/configurar"
                className="px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center gap-3"
              >
                <Sliders className="w-6 h-6" />
                Configurador Visual
              </Link>
              <a 
                href="https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish/archive/refs/heads/main.zip" 
                className="px-8 py-4 rounded-xl bg-slate-700 text-white font-bold text-lg hover:bg-slate-600 transition-all duration-300 flex items-center gap-3 border border-slate-600"
              >
                <Download className="w-6 h-6" />
                Descargar .zip
              </a>
            </div>
            <a 
              href="https://github.com/atreyu1968/Odoo-Edu-Installer-Spanish"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 text-sm hover:text-blue-400 transition-colors flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              O clona el repositorio desde GitHub
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <span className="font-display font-bold text-xl text-white">
              Odoo<span className="text-blue-500">Edu</span>
            </span>
          </div>
          
          <div className="text-center md:text-left text-slate-400 text-sm">
            <p className="mb-2">Herramienta de código abierto para la Formación Profesional.</p>
            <p className="text-xs text-slate-500">
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
      </footer>
    </div>
  );
}
