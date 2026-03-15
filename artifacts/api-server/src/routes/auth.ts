import { Router, type IRouter, type Request, type Response } from "express";
import fs from "fs";
import crypto from "crypto";
import { getConfigPath, readConfig } from "../lib/config.js";

const router: IRouter = Router();

const sessions: Map<string, { user: string; role: string; grupo?: string; expiresAt: number }> = new Map();

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}

router.post("/auth/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Usuario y contraseña requeridos" });
    return;
  }

  const config = readConfig();

  if (username === config.superadmin.username && password === config.superadmin.password) {
    cleanExpiredSessions();
    const token = generateToken();
    sessions.set(token, {
      user: username,
      role: "superadmin",
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
    res.json({ token, role: "superadmin", user: username });
    return;
  }

  const grupo = config.grupos.find(
    (g: any) => g.profesorUsuario === username && g.profesorPassword === password
  );

  if (grupo) {
    cleanExpiredSessions();
    const token = generateToken();
    sessions.set(token, {
      user: username,
      role: "profesor",
      grupo: grupo.nombre,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
    res.json({ token, role: "profesor", user: username, grupo: grupo.nombre });
    return;
  }

  res.status(401).json({ error: "Credenciales inválidas" });
});

router.post("/auth/student-lookup", (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({ error: "Usuario requerido" });
    return;
  }

  const config = readConfig();
  const login = username.trim().toLowerCase();

  for (const grupo of config.grupos) {
    const prefix = grupo.passwordPrefix.toLowerCase();
    if (login.startsWith(prefix)) {
      const numPart = login.slice(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num >= 1 && num <= grupo.numAlumnos) {
        const dbName = `${grupo.dbPrefix}_${String(num).padStart(2, "0")}`;
        res.json({
          database: dbName,
          grupo: grupo.nombre,
          odooUrl: "/web",
        });
        return;
      }
    }
  }

  res.status(404).json({ error: "Usuario no encontrado. Verifica tu nombre de usuario." });
});

router.post("/auth/logout", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    sessions.delete(token);
  }
  res.json({ message: "Sesión cerrada" });
});

router.get("/auth/me", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(token);
    res.status(401).json({ error: "Sesión expirada" });
    return;
  }

  res.json({ user: session.user, role: session.role, grupo: session.grupo });
});

export { sessions };
export default router;
