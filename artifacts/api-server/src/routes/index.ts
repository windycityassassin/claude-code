import { Router, type IRouter } from "express";
import healthRouter from "./health";
import anthropicRouter from "./anthropic";
import agentsRouter from "./agents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(anthropicRouter);
router.use(agentsRouter);

export default router;
