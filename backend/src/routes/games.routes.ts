import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewate";
import { validateReqBody } from "../middlewares/validation.middleware";
import { joinQueueSchema } from "@itsu/shared/src/zod/games.validation";
import { pushToGameQueue } from "../controllers/games.controller";

const router = Router();

router
  .route("/queue/join")
  .post(verifyJwt, validateReqBody(joinQueueSchema), pushToGameQueue);

export default router;
