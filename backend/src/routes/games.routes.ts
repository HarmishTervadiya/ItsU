import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewate";
import { validateReqBody } from "../middlewares/validation.middleware";
import { joinQueueSchema } from "@itsu/shared/src/zod/games.validation";
import {
  pushToGameQueue,
  pushToGameQueueTest,
  createPracticeGame,
  getActiveGame,
} from "../controllers/games.controller";

const router = Router();

router.route("/active").get(verifyJwt, getActiveGame);

// router
//   .route("/queue/join")
//   .post(verifyJwt, validateReqBody(joinQueueSchema), pushToGameQueue);

router
  .route("/queue/join")
  .post(verifyJwt, validateReqBody(joinQueueSchema), pushToGameQueue);

// TEMPORARY: Test endpoint — no transaction required
// router.route("/queue/join-test").post(verifyJwt, pushToGameQueueTest);

router.route("/practice").post(verifyJwt, createPracticeGame);

export default router;
