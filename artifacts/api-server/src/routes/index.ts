import { Router, type IRouter } from "express";
import healthRouter from "./health";
// The same handlers Netlify serves in production (see netlify/functions/api.mts).
import current from "../../../../api/weather/current";
import forecast from "../../../../api/weather/forecast";
import geocode from "../../../../api/weather/geocode";
import search from "../../../../api/weather/search";
import month from "../../../../api/weather/month";
import birthdays from "../../../../api/birthdays/month";
import snark from "../../../../api/openai/snark";

const router: IRouter = Router();

router.use(healthRouter);
router.get("/weather/current", current);
router.get("/weather/forecast", forecast);
router.get("/weather/geocode", geocode);
router.get("/weather/search", search);
router.get("/weather/month", month);
router.get("/birthdays/month", birthdays);
router.post("/openai/snark", snark);

export default router;
