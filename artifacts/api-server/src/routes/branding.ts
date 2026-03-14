import { Router, type IRouter, type Response } from "express";
import { readConfig, writeConfig, type BrandingConfig } from "../lib/config.js";
import { requireSuperadmin, requireAuth, type AuthRequest } from "../lib/auth-middleware.js";

const router: IRouter = Router();

router.get("/branding", requireAuth as any, (_req: AuthRequest, res: Response) => {
  const config = readConfig();
  res.json({ branding: config.branding });
});

router.put("/branding", requireSuperadmin as any, (req: AuthRequest, res: Response) => {
  const config = readConfig();
  const updates: Partial<BrandingConfig> = req.body;

  config.branding = { ...config.branding, ...updates };
  writeConfig(config);

  res.json({ message: "Branding actualizado", branding: config.branding });
});

export default router;
