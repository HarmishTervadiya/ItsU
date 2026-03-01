import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewate";
import { validateReqBody } from "../middlewares/validation.middleware";
import { joinQueueSchema } from "@itsu/shared/src/zod/games.validation";
import {
  pushToGameQueue,
  createPracticeGame,
} from "../controllers/games.controller";

const router = Router();

router
  .route("/queue/join")
  .post(verifyJwt, validateReqBody(joinQueueSchema), pushToGameQueue);

router.route("/practice").post(verifyJwt, createPracticeGame);

export default router;
