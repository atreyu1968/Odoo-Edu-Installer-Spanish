import { Router, type IRouter, type Response } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import { readConfig, writeConfig, type GrupoConfig } from "../lib/config.js";
import { requireAuth, requireSuperadmin, type AuthRequest } from "../lib/auth-middleware.js";

const execAsync = promisify(exec);
const router: IRouter = Router();

async function odooCommand(cmd: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
    return stdout.trim();
  } catch (e: any) {
    throw new Error(e.stderr || e.message);
  }
}

function sanitizeDbName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "");
}

function isValidDbName(name: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(name) && name.length > 0 && name.length <= 63;
}

async function createStudentDatabase(dbName: string, _adminPassword?: string): Promise<void> {
  if (!isValidDbName(dbName)) throw new Error(`Nombre de base de datos invalido: ${dbName}`);
  const config = readConfig();
  const pythonBin = `${config.odoo.home}/venv/bin/python3`;
  const odooBin = `${config.odoo.home}/odoo17-server/odoo-bin`;
  const confPath = config.odoo.confPath;

  await execAsync(
    `sudo -u ${config.odoo.dbUser || "odoo17"} ${pythonBin} ${odooBin} -c ${confPath} -d ${sanitizeDbName(dbName)} --init base --stop-after-init --without-demo=all 2>&1`,
    { timeout: 120000 }
  );
}

async function dropDatabase(dbName: string): Promise<void> {
  if (!isValidDbName(dbName)) throw new Error(`Nombre de base de datos invalido: ${dbName}`);
  const safeName = sanitizeDbName(dbName);
  const { stdout } = await execAsync(
    `psql -U odoo17 -t -A -c "SELECT 1 FROM pg_database WHERE datname='${safeName}'" 2>/dev/null`,
    { timeout: 10000 }
  );
  if (stdout.trim() === "1") {
    await execAsync(`dropdb -U odoo17 "${safeName}" 2>&1`, { timeout: 30000 });
  }
}

async function listDatabases(): Promise<string[]> {
  const result = await odooCommand(
    `psql -U odoo17 -t -A -c "SELECT datname FROM pg_database WHERE datistemplate = false AND datname NOT IN ('postgres','template0','template1')" 2>&1`
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
