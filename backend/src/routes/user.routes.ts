import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewate";
import { validateReqBody } from "../middlewares/validation.middleware";
import {
  updateUserData,
  getUserStats,
  reportIssue,
} from "../controllers/user.controller";
import { updateUserSchema } from "@itsu/shared/src/zod/user.validation";

const router = Router();

router
  .route("/")
  .patch(verifyJwt, validateReqBody(updateUserSchema), updateUserData);

router.route("/stats").get(verifyJwt, getUserStats);
router.route("/report").post(verifyJwt, reportIssue);

export default router;
