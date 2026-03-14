import { Router, type IRouter, type Request, type Response } from "express";
import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const router: IRouter = Router();

interface InstallConfig {
  odooVersion: string;
  odooPort: string;
  longpollingPort: string;
  installNginx: boolean;
  websiteName: string;
  enableSsl: boolean;
  installWkhtmltopdf: boolean;
  eduMode: boolean;
  eduNumAlumnos: number;
  eduPasswordPrefix: string;
  eduDbPrefix: string;
  eduProfesorUser: string;
  eduProfesorPassword: string;
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

interface InstallState {
  status: "idle" | "running" | "completed" | "failed";
  startedAt: string | null;
  finishedAt: string | null;
  config: InstallConfig | null;
  logs: string[];
  exitCode: number | null;
  scriptPath: string | null;
  process: ChildProcess | null;
  sseClients: Response[];
}

const state: InstallState = {
  status: "idle",
  startedAt: null,
  finishedAt: null,
  config: null,
  logs: [],
  exitCode: null,
  scriptPath: null,
  process: null,
  sseClients: [],
};

const INSTALL_DIR = path.join(os.homedir(), "odoo-install");
const SCRIPT_TEMPLATE_PATH = path.resolve(
  process.cwd(),
  "..",
  "..",
  "odoo_install.sh",
);

function b(v: boolean): string {
  return v ? "true" : "false";
}

function generateConfigBlock(config: InstallConfig): string {
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
EDU_NUM_ALUMNOS=${config.eduNumAlumnos}
EDU_PASSWORD_PREFIX="${config.eduPasswordPrefix}"
EDU_DB_PREFIX="${config.eduDbPrefix}"
EDU_PROFESOR_USER="${config.eduProfesorUser}"
EDU_PROFESOR_PASSWORD="${config.eduProfesorPassword}"
EDU_CENTRO_NOMBRE="${config.eduCentroNombre}"
EDU_BACKUP_DIR="${config.eduBackupDir}"
EDU_BACKUP_RETENTION_DAYS=${config.eduBackupRetentionDays}

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

function patchScript(originalScript: string, config: InstallConfig): string {
  const configStartMarker =
    "#===============================================================================\n# CONFIGURACION";
  const configEndMarker = 'PYTHON_VERSION="python3"';

  const startIdx = originalScript.indexOf(configStartMarker);
  const endIdx = originalScript.indexOf(configEndMarker);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error("No se encontraron los marcadores de configuración en el script plantilla");
  }

  const before = originalScript.substring(0, startIdx);
  const after = originalScript.substring(endIdx + configEndMarker.length);

  return (
    before +
    `#===============================================================================\n# CONFIGURACION — Generada por OdooEdu Configurator (${new Date().toISOString().split("T")[0]})\n#===============================================================================\n\n` +
    generateConfigBlock(config) +
    after
  );
}

function broadcastLog(line: string) {
  state.logs.push(line);
  const data = JSON.stringify({ type: "log", data: line });
  for (const client of state.sseClients) {
    client.write(`data: ${data}\n\n`);
  }
}

function broadcastStatus(
  status: InstallState["status"],
  exitCode?: number | null,
) {
  state.status = status;
  if (exitCode !== undefined) state.exitCode = exitCode;
  const data = JSON.stringify({
    type: "status",
    data: {
      status,
      exitCode: exitCode ?? null,
      startedAt: state.startedAt,
      finishedAt: state.finishedAt,
    },
  });
  for (const client of state.sseClients) {
    client.write(`data: ${data}\n\n`);
  }
}

router.get("/install/status", (_req: Request, res: Response) => {
  res.json({
    status: state.status,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    exitCode: state.exitCode,
    config: state.config,
    logCount: state.logs.length,
  });
});

router.get("/install/logs", (_req: Request, res: Response) => {
  res.json({ logs: state.logs });
});

router.get("/install/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  for (const line of state.logs) {
    const data = JSON.stringify({ type: "log", data: line });
    res.write(`data: ${data}\n\n`);
  }

  const statusData = JSON.stringify({
    type: "status",
    data: {
      status: state.status,
      exitCode: state.exitCode,
      startedAt: state.startedAt,
      finishedAt: state.finishedAt,
    },
  });
  res.write(`data: ${statusData}\n\n`);

  state.sseClients.push(res);

  req.on("close", () => {
    const idx = state.sseClients.indexOf(res);
    if (idx !== -1) state.sseClients.splice(idx, 1);
  });
});

router.post("/install/start", async (req: Request, res: Response) => {
  if (state.status === "running") {
    res.status(409).json({
      error: "Ya hay una instalación en curso",
      status: state.status,
    });
    return;
  }

  const config = req.body as InstallConfig;

  if (!config || !config.odooVersion) {
    res.status(400).json({ error: "Configuración inválida" });
    return;
  }

  state.status = "running";
  state.startedAt = new Date().toISOString();
  state.finishedAt = null;
  state.config = config;
  state.logs = [];
  state.exitCode = null;

  try {
    if (!fs.existsSync(INSTALL_DIR)) {
      fs.mkdirSync(INSTALL_DIR, { recursive: true });
    }

    let templateScript: string;
    if (fs.existsSync(SCRIPT_TEMPLATE_PATH)) {
      templateScript = fs.readFileSync(SCRIPT_TEMPLATE_PATH, "utf-8");
    } else {
      res.status(500).json({
        error: "No se encontró el script plantilla odoo_install.sh",
        path: SCRIPT_TEMPLATE_PATH,
      });
      state.status = "failed";
      return;
    }

    const patchedScript = patchScript(templateScript, config);
    const scriptPath = path.join(INSTALL_DIR, "odoo_install.sh");
    fs.writeFileSync(scriptPath, patchedScript, { mode: 0o755 });
    state.scriptPath = scriptPath;

    broadcastLog(
      `[INFO] ${new Date().toISOString()} - Script generado en: ${scriptPath}`,
    );
    broadcastLog(
      `[INFO] ${new Date().toISOString()} - Iniciando instalación de Odoo ${config.odooVersion}...`,
    );
    broadcastStatus("running");

    const child = spawn("sudo", ["bash", scriptPath], {
      cwd: INSTALL_DIR,
      env: { ...process.env, DEBIAN_FRONTEND: "noninteractive" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    state.process = child;

    child.stdout?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        broadcastLog(line);
      }
    });

    child.stderr?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        broadcastLog(`[STDERR] ${line}`);
      }
    });

    child.on("close", (code) => {
      state.finishedAt = new Date().toISOString();
      state.process = null;
      if (code === 0) {
        broadcastLog(
          `[OK] ${new Date().toISOString()} - Instalación completada exitosamente`,
        );
        broadcastStatus("completed", code);
      } else {
        broadcastLog(
          `[ERROR] ${new Date().toISOString()} - Instalación fallida con código de salida: ${code}`,
        );
        broadcastStatus("failed", code);
      }
    });

    child.on("error", (err) => {
      state.finishedAt = new Date().toISOString();
      state.process = null;
      broadcastLog(
        `[ERROR] ${new Date().toISOString()} - Error al ejecutar el script: ${err.message}`,
      );
      broadcastStatus("failed", -1);
    });

    res.json({
      message: "Instalación iniciada",
      scriptPath,
      status: "running",
    });
  } catch (err: unknown) {
    state.status = "failed";
    state.finishedAt = new Date().toISOString();
    const msg = err instanceof Error ? err.message : String(err);
    broadcastLog(`[ERROR] ${new Date().toISOString()} - ${msg}`);
    broadcastStatus("failed", -1);
    res.status(500).json({ error: msg });
  }
});

router.post("/install/stop", (_req: Request, res: Response) => {
  if (state.status !== "running" || !state.process) {
    res.status(400).json({
      error: "No hay instalación en curso",
      status: state.status,
    });
    return;
  }

  state.process.kill("SIGTERM");
  broadcastLog(
    `[AVISO] ${new Date().toISOString()} - Instalación cancelada por el usuario`,
  );
  res.json({ message: "Señal de parada enviada" });
});

router.post("/install/reset", (_req: Request, res: Response) => {
  if (state.status === "running") {
    res.status(409).json({
      error: "No se puede resetear mientras hay una instalación en curso",
    });
    return;
  }

  state.status = "idle";
  state.startedAt = null;
  state.finishedAt = null;
  state.config = null;
  state.logs = [];
  state.exitCode = null;
  state.scriptPath = null;

  res.json({ message: "Estado reseteado", status: "idle" });
});

router.get("/install/download-script", (req: Request, res: Response) => {
  if (!state.scriptPath || !fs.existsSync(state.scriptPath)) {
    res.status(404).json({ error: "No hay script generado" });
    return;
  }

  res.setHeader("Content-Type", "text/x-shellscript");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="odoo_install.sh"',
  );
  res.sendFile(state.scriptPath);
});

router.post("/install/generate-script", (req: Request, res: Response) => {
  const config = req.body as InstallConfig;

  if (!config || !config.odooVersion) {
    res.status(400).json({ error: "Configuración inválida" });
    return;
  }

  try {
    if (!fs.existsSync(INSTALL_DIR)) {
      fs.mkdirSync(INSTALL_DIR, { recursive: true });
    }

    let templateScript: string;
    if (fs.existsSync(SCRIPT_TEMPLATE_PATH)) {
      templateScript = fs.readFileSync(SCRIPT_TEMPLATE_PATH, "utf-8");
    } else {
      res.status(500).json({
        error: "No se encontró el script plantilla odoo_install.sh",
      });
      return;
    }

    const patchedScript = patchScript(templateScript, config);
    const scriptPath = path.join(INSTALL_DIR, "odoo_install.sh");
    fs.writeFileSync(scriptPath, patchedScript, { mode: 0o755 });

    res.setHeader("Content-Type", "text/x-shellscript");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="odoo_install.sh"',
    );
    res.send(patchedScript);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
