import { Router, type IRouter } from "express";
import healthRouter from "./health";
import installRouter from "./install";

const router: IRouter = Router();

router.use(healthRouter);
router.use(installRouter);

export default router;
