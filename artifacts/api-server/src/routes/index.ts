import { Router, type IRouter } from "express";
import healthRouter from "./health";
import installRouter from "./install";
import authRouter from "./auth";
import groupsRouter from "./groups";
import brandingRouter from "./branding";
import statusRouter from "./status";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(groupsRouter);
router.use(brandingRouter);
router.use(statusRouter);
router.use(installRouter);

export default router;
