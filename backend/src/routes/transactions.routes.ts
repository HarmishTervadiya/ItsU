import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewate";
import { validateReqBody } from "../middlewares/validation.middleware";
import { insertStakeTransactionSchema } from "@itsu/shared/src/zod/transaction.validation";
import { pushToGameQueue } from "../controllers/games.controller";
import { addStakeTransaction } from "../controllers/transactions.controller";

const router = Router();

router
  .route("/stake/request")
  .post(verifyJwt, validateReqBody(insertStakeTransactionSchema), addStakeTransaction);

export default router;
