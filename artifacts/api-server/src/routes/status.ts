import { Router, type IRouter, type Response } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import { requireAuth, type AuthRequest } from "../lib/auth-middleware.js";
import { readConfig } from "../lib/config.js";

const execAsync = promisify(exec);
const router: IRouter = Router();

async function checkService(name: string): Promise<{ active: boolean; status: string }> {
  try {
    const { stdout } = await execAsync(`systemctl is-active ${name} 2>/dev/null`);
    const status = stdout.trim();
    return { active: status === "active", status };
  } catch {
    return { active: false, status: "inactive" };
  }
}

router.get("/status", requireAuth as any, async (_req: AuthRequest, res: Response) => {
  const config = readConfig();

  const [odoo, postgresql, nginx] = await Promise.all([
    checkService("odoo17"),
    checkService("postgresql"),
    checkService("nginx"),
  ]);

  let odooVersion = config.odoo.version;
  let databases: string[] = [];

  try {
    const { stdout } = await execAsync(
      `sudo -u postgres psql -t -A -c "SELECT datname FROM pg_database WHERE datistemplate = false AND datname NOT IN ('postgres','template0','template1')" 2>/dev/null`
    );
    databases = stdout.trim().split("\n").filter(Boolean);
  } catch {}

  res.json({
    services: { odoo, postgresql, nginx },
    odooVersion,
    databases,
    grupos: config.grupos.length,
  });
});

export default router;
