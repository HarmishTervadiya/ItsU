import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewate";
import { validateReqBody } from "../middlewares/validation.middleware";
import { updateUserData } from "../controllers/user.controller";
import { updateUserSchema } from "@itsu/shared/src/zod/user.validation";

const router = Router();

router
  .route("/")
  .patch(verifyJwt, validateReqBody(updateUserSchema), updateUserData);

export default router;
