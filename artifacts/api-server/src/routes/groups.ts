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

async function pgExec(sql: string, timeout = 30000): Promise<string> {
  const { stdout } = await execAsync(
    `psql -d postgres -t -A -c ${JSON.stringify(sql)}`,
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

async function createStudentDatabase(dbName: string, _adminPassword?: string): Promise<void> {
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
    "project",
    "calendar",
    "board",
    "web",
  ].join(",");
  await execAsync(
    `${pythonBin} ${odooBin} -c ${confPath} -d ${safeName} --init ${modules} --stop-after-init --without-demo=all --http-port=0 --no-http 2>&1`,
    { timeout: 900000 }
  );
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
    const dbName = `${grupo.dbPrefix}_${String(i).padStart(2, "0")}`;
    try {
      await createStudentDatabase(dbName, config.odoo.adminPassword);
      results.push({ db: dbName, status: "created" });
    } catch (e: any) {
      results.push({ db: dbName, status: "error", error: e.message });
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
    const dbName = `${grupo.dbPrefix}_${String(i).padStart(2, "0")}`;
    try {
      await dropDatabase(dbName);
      await createStudentDatabase(dbName, config.odoo.adminPassword);
      results.push({ db: dbName, status: "reset" });
    } catch (e: any) {
      results.push({ db: dbName, status: "error", error: e.message });
    }
  }

  res.json({ message: "Proceso completado", results });
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
