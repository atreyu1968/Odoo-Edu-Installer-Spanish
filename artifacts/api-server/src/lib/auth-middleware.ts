import { type Request, type Response, type NextFunction } from "express";
import { sessions } from "../routes/auth.js";

export interface AuthRequest extends Request {
  session?: {
    user: string;
    role: string;
    grupo?: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
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

  req.session = { user: session.user, role: session.role, grupo: session.grupo };
  next();
}

export function requireSuperadmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.session?.role !== "superadmin") {
      res.status(403).json({ error: "Se requiere rol de superadmin" });
      return;
    }
    next();
  });
}
