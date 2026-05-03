import { Router, type IRouter } from "express";
import healthRouter from "./health";
import weatherRouter from "./weather";
import snarkRouter from "./snark";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/weather", weatherRouter);
router.use("/openai", snarkRouter);

export default router;
