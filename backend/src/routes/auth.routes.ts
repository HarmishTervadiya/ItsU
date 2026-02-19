import { Router } from "express";
import {
  getUserNonce,
  login,
  refreshAccessToken,
} from "../controllers/auth.controller";
import { validateReqBody } from "../middlewares/validation.middleware";
import {
  loginSchema,
  refreshAccessTokenSchema,
} from "@itsu/shared/src/zod/auth.validation";

const router = Router();

router.get("/nonce/:walletAddress", getUserNonce);

router.post("/login", validateReqBody(loginSchema), login);
router.post(
  "/refreshAccessToken",
  validateReqBody(refreshAccessTokenSchema),
  refreshAccessToken,
);

export default router;
