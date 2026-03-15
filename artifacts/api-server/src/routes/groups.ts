import { Router, type IRouter, type Response } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import { readConfig, writeConfig, type GrupoConfig } from "../lib/config.js";
import { requireAuth, requireSuperadmin, type AuthRequest } from "../lib/auth-middleware.js";

const execAsync = promisify(exec);
const router: IRouter = Router();

function getPgEnv(): Record<string, string> {
  const config = readConfig();
  return {
    ...process.env as Record<string, string>,
    PGUSER: config.odoo.dbUser || "odoo17",
    PGPASSWORD: config.odoo.dbPassword || "",
    PGHOST: config.odoo.dbHost || "localhost",
    PGPORT: String(config.odoo.dbPort || 5432),
  };
}

async function pgExec(sql: string, dbName = "postgres", timeout = 30000): Promise<string> {
  const { stdout } = await execAsync(
    `psql -d ${dbName} -t -A -c ${JSON.stringify(sql)}`,
    { timeout, env: getPgEnv() }
  );
  return stdout.trim();
}

function sanitizeDbName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "");
}

function isValidDbName(name: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(name) && name.length > 0 && name.length <= 63;
}

async function dbExists(safeName: string): Promise<boolean> {
  try {
    const result = await pgExec(`SELECT 1 FROM pg_database WHERE datname='${safeName}'`);
    return result === "1";
  } catch {
    return false;
  }
}

async function createOdooUser(
  dbName: string,
  login: string,
  password: string,
  name: string,
  isAdmin = false
): Promise<void> {
  const config = readConfig();
  const pythonBin = `${config.odoo.home}/venv/bin/python3`;
  const odooServer = `${config.odoo.home}/odoo17-server`;
  const confPath = config.odoo.confPath;

  const pyScript = `
import sys, os
sys.path.insert(0, ${JSON.stringify(odooServer)})
import odoo
odoo.tools.config.parse_config(['-c', ${JSON.stringify(confPath)}, '--no-http', '--http-port=0'])
from odoo.modules.registry import Registry
from odoo import api, SUPERUSER_ID
registry = Registry(${JSON.stringify(dbName)})
with registry.cursor() as cr:
    env = api.Environment(cr, SUPERUSER_ID, {})
    existing = env['res.users'].search([('login', '=', ${JSON.stringify(login)})])
    if not existing:
        vals = {
            'login': ${JSON.stringify(login)},
            'name': ${JSON.stringify(name)},
            'company_id': 1,
            'company_ids': [(6, 0, [1])],
        }
        if ${isAdmin ? "True" : "False"}:
            admin_group = env.ref('base.group_system', raise_if_not_found=False)
            if admin_group:
                vals['groups_id'] = [(4, admin_group.id)]
        user = env['res.users'].with_context(no_reset_password=True).create(vals)
        user.password = ${JSON.stringify(password)}
    cr.commit()
`.trim();

  await execAsync(
    `${pythonBin} -c ${JSON.stringify(pyScript)} 2>&1`,
    { timeout: 120000 }
  );
}

async function createStudentDatabase(
  dbName: string,
  studentLogin?: string,
  studentPassword?: string,
  studentName?: string,
): Promise<void> {
  if (!isValidDbName(dbName)) throw new Error(`Nombre de base de datos invalido: ${dbName}`);
  const config = readConfig();
  const pythonBin = `${config.odoo.home}/venv/bin/python3`;
  const odooBin = `${config.odoo.home}/odoo17-server/odoo-bin`;
  const confPath = config.odoo.confPath;
  const safeName = sanitizeDbName(dbName);

  if (await dbExists(safeName)) {
    return;
  }

  const modules = [
    "base",
    "base_setup",
    "mail",
    "contacts",
    "account",
    "account_payment",
    "l10n_es",
    "sale_management",
    "purchase",
    "stock",
    "hr",
    "hr_holidays",
    "hr_expense",
    "hr_recruitment",
    "hr_attendance",
    "hr_timesheet",
    "project",
    "calendar",
    "board",
    "crm",
    "mrp",
    "point_of_sale",
    "website",
    "website_sale",
    "website_blog",
    "website_event",
    "website_slides",
    "event",
    "survey",
    "note",
    "mass_mailing",
    "im_livechat",
    "fleet",
    "maintenance",
    "lunch",
    "membership",
    "web",
  ].join(",");
  await execAsync(
    `${pythonBin} ${odooBin} -c ${confPath} -d ${safeName} --init ${modules} --stop-after-init --without-demo=all --http-port=0 --no-http 2>&1`,
    { timeout: 1800000 }
  );

  await pgExec(`
    UPDATE ir_module_module SET application = false WHERE state = 'uninstallable';
    INSERT INTO ir_config_parameter (key, value, create_uid, create_date, write_uid, write_date)
    VALUES ('module_auto_install_disabled', 'true', 1, NOW(), 1, NOW())
    ON CONFLICT (key) DO UPDATE SET value = 'true';
  `, safeName);

  if (studentLogin && studentPassword) {
    await createOdooUser(
      safeName,
      studentLogin,
      studentPassword,
      studentName || studentLogin,
    );
  }
}

async function dropDatabase(dbName: string): Promise<void> {
  if (!isValidDbName(dbName)) throw new Error(`Nombre de base de datos invalido: ${dbName}`);
  const safeName = sanitizeDbName(dbName);
  if (!(await dbExists(safeName))) return;
  await pgExec(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${safeName}' AND pid <> pg_backend_pid()`);
  await pgExec(`DROP DATABASE "${safeName}"`);
}

async function listDatabases(): Promise<string[]> {
  const result = await pgExec(
    `SELECT datname FROM pg_database WHERE datistemplate = false AND datname NOT IN ('postgres','template0','template1')`
  );
  return result.split("\n").filter(Boolean);
}

router.get("/groups", requireAuth as any, (req: AuthRequest, res: Response) => {
  const config = readConfig();

  if (req.session?.role === "profesor") {
    const grupo = config.grupos.find((g: GrupoConfig) => g.nombre === req.session?.grupo);
    if (grupo) {
      res.json({ grupos: [grupo] });
    } else {
      res.json({ grupos: [] });
    }
    return;
  }

  res.json({ grupos: config.grupos });
});

router.post("/groups", requireSuperadmin as any, async (req: AuthRequest, res: Response) => {
  const config = readConfig();
  const grupo: GrupoConfig = req.body;

  if (!grupo.nombre) {
    res.status(400).json({ error: "El nombre del grupo es requerido" });
    return;
  }

  const exists = config.grupos.find((g: GrupoConfig) => g.nombre === grupo.nombre);
  if (exists) {
    res.status(409).json({ error: "Ya existe un grupo con ese nombre" });
    return;
  }

  config.grupos.push(grupo);
  writeConfig(config);
  res.json({ message: "Grupo creado", grupo });
});

router.put("/groups/bulk", requireSuperadmin as any, (req: AuthRequest, res: Response) => {
  const config = readConfig();
  const { grupos } = req.body;

  if (!Array.isArray(grupos)) {
    res.status(400).json({ error: "Se esperaba un array de grupos" });
    return;
  }

  config.grupos = grupos;
  writeConfig(config);
  res.json({ message: "Grupos actualizados", count: grupos.length });
});

router.put("/groups/:nombre", requireSuperadmin as any, (req: AuthRequest, res: Response) => {
  const config = readConfig();
  const { nombre } = req.params;
  const updates = req.body;

  const idx = config.grupos.findIndex((g: GrupoConfig) => g.nombre === nombre);
  if (idx === -1) {
    res.status(404).json({ error: "Grupo no encontrado" });
    return;
  }

  config.grupos[idx] = { ...config.grupos[idx], ...updates };
  writeConfig(config);
  res.json({ message: "Grupo actualizado", grupo: config.grupos[idx] });
});

router.delete("/groups/:nombre", requireSuperadmin as any, (req: AuthRequest, res: Response) => {
  const config = readConfig();
  const { nombre } = req.params;

  const idx = config.grupos.findIndex((g: GrupoConfig) => g.nombre === nombre);
  if (idx === -1) {
    res.status(404).json({ error: "Grupo no encontrado" });
    return;
  }

  config.grupos.splice(idx, 1);
  writeConfig(config);
  res.json({ message: "Grupo eliminado" });
});

router.post("/groups/:nombre/create-databases", requireSuperadmin as any, async (req: AuthRequest, res: Response) => {
  const config = readConfig();
  const { nombre } = req.params;

  const grupo = config.grupos.find((g: GrupoConfig) => g.nombre === nombre);
  if (!grupo) {
    res.status(404).json({ error: "Grupo no encontrado" });
    return;
  }

  const results: { db: string; status: string; error?: string }[] = [];

  for (let i = 1; i <= grupo.numAlumnos; i++) {
    const num = String(i).padStart(2, "0");
    const dbName = `${grupo.dbPrefix}_${num}`;
    const studentLogin = `${grupo.passwordPrefix}${num}`;
    const studentName = `${grupo.nombre} - Alumno ${num}`;
    try {
      await createStudentDatabase(dbName, studentLogin, studentLogin, studentName);
      results.push({ db: dbName, status: "created" });
    } catch (e: any) {
      results.push({ db: dbName, status: "error", error: e.message });
    }
  }

  if (grupo.profesorUsuario) {
    for (let i = 1; i <= grupo.numAlumnos; i++) {
      const num = String(i).padStart(2, "0");
      const dbName = `${grupo.dbPrefix}_${num}`;
      try {
        if (await dbExists(sanitizeDbName(dbName))) {
          await createOdooUser(
            sanitizeDbName(dbName),
            grupo.profesorUsuario,
            grupo.profesorPassword,
            grupo.profesorNombre,
            true,
          );
        }
      } catch {
      }
    }
  }

  res.json({ message: "Proceso completado", results });
});

router.post("/groups/:nombre/reset-databases", requireSuperadmin as any, async (req: AuthRequest, res: Response) => {
  const config = readConfig();
  const { nombre } = req.params;

  const grupo = config.grupos.find((g: GrupoConfig) => g.nombre === nombre);
  if (!grupo) {
    res.status(404).json({ error: "Grupo no encontrado" });
    return;
  }

  const results: { db: string; status: string; error?: string }[] = [];

  for (let i = 1; i <= grupo.numAlumnos; i++) {
    const num = String(i).padStart(2, "0");
    const dbName = `${grupo.dbPrefix}_${num}`;
    const studentLogin = `${grupo.passwordPrefix}${num}`;
    const studentName = `${grupo.nombre} - Alumno ${num}`;
    try {
      await dropDatabase(dbName);
      await createStudentDatabase(dbName, studentLogin, studentLogin, studentName);
      results.push({ db: dbName, status: "reset" });
    } catch (e: any) {
      results.push({ db: dbName, status: "error", error: e.message });
    }
  }

  res.json({ message: "Proceso completado", results });
});

async function changeOdooPassword(
  dbName: string,
  login: string,
  newPassword: string,
): Promise<void> {
  const config = readConfig();
  const pythonBin = `${config.odoo.home}/venv/bin/python3`;
  const odooServer = `${config.odoo.home}/odoo17-server`;
  const confPath = config.odoo.confPath;

  const pyScript = `
import sys, os
sys.path.insert(0, ${JSON.stringify(odooServer)})
import odoo
odoo.tools.config.parse_config(['-c', ${JSON.stringify(confPath)}, '--no-http', '--http-port=0'])
from odoo.modules.registry import Registry
from odoo import api, SUPERUSER_ID
registry = Registry(${JSON.stringify(dbName)})
with registry.cursor() as cr:
    env = api.Environment(cr, SUPERUSER_ID, {})
    users = env['res.users'].search([('login', '=', ${JSON.stringify(login)})])
    if users:
        users[0].password = ${JSON.stringify(newPassword)}
    else:
        raise Exception('Usuario no encontrado: ' + ${JSON.stringify(login)})
    cr.commit()
`.trim();

  await execAsync(
    `${pythonBin} -c ${JSON.stringify(pyScript)} 2>&1`,
    { timeout: 120000 }
  );
}

function validateStudentNum(num: string, grupo: GrupoConfig): string | null {
  if (!/^\d{2}$/.test(num)) return "Número de alumno inválido (debe ser 2 dígitos)";
  const n = parseInt(num, 10);
  if (n < 1 || n > grupo.numAlumnos) return `Número de alumno fuera de rango (1-${grupo.numAlumnos})`;
  return null;
}

router.delete("/groups/:nombre/student/:num", requireAuth as any, async (req: AuthRequest, res: Response) => {
  const config = readConfig();
  const { nombre, num } = req.params;

  const grupo = config.grupos.find((g: GrupoConfig) => g.nombre === nombre);
  if (!grupo) {
    res.status(404).json({ error: "Grupo no encontrado" });
    return;
  }

  const numError = validateStudentNum(num, grupo);
  if (numError) {
    res.status(400).json({ error: numError });
    return;
  }

  if (req.session?.role === "profesor" && req.session?.grupo !== nombre) {
    res.status(403).json({ error: "No tienes permiso para este grupo" });
    return;
  }

  const dbName = `${grupo.dbPrefix}_${num}`;
  try {
    await dropDatabase(dbName);
    res.json({ message: `Base de datos ${dbName} eliminada` });
  } catch (e: any) {
    res.status(500).json({ error: "Error al eliminar la base de datos" });
  }
});

router.post("/groups/:nombre/student/:num/password", requireAuth as any, async (req: AuthRequest, res: Response) => {
  const config = readConfig();
  const { nombre, num } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres" });
    return;
  }

  const grupo = config.grupos.find((g: GrupoConfig) => g.nombre === nombre);
  if (!grupo) {
    res.status(404).json({ error: "Grupo no encontrado" });
    return;
  }

  const numError = validateStudentNum(num, grupo);
  if (numError) {
    res.status(400).json({ error: numError });
    return;
  }

  if (req.session?.role === "profesor" && req.session?.grupo !== nombre) {
    res.status(403).json({ error: "No tienes permiso para este grupo" });
    return;
  }

  const dbName = `${grupo.dbPrefix}_${num}`;
  const studentLogin = `${grupo.passwordPrefix}${num}`;

  try {
    const safeName = sanitizeDbName(dbName);
    if (!(await dbExists(safeName))) {
      res.status(404).json({ error: `Base de datos ${dbName} no existe` });
      return;
    }
    await changeOdooPassword(safeName, studentLogin, newPassword);
    res.json({ message: `Contraseña de ${studentLogin} actualizada` });
  } catch (e: any) {
    res.status(500).json({ error: "Error al cambiar la contraseña" });
  }
});

router.get("/groups/databases", requireAuth as any, async (_req: AuthRequest, res: Response) => {
  try {
    const databases = await listDatabases();
    res.json({ databases });
  } catch (e: any) {
    res.json({ databases: [], error: e.message });
  }
});

export default router;
