import { prisma } from "@itsu/shared/src/lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError, ApiSuccess } from "../utils/apiResponse";
import { logger } from "../utils/logger";

export const addStakeTransaction = asyncHandler(async (req, res) => {
  const { reference, currency, amount } = req.body;
  logger.debug(
    { path: req.originalUrl },
    "[Stake Trasaction Init] Stake transaction initiated",
  );

  const insertedTransaction = await prisma.transaction.create({
    data: {
      reference,
      currency,
      type: "DEPOSIT_STANDARD",
      status: "PENDING",
      amount,
      userId: req.user?.id!,
    },
  });

  if (!insertedTransaction) {
    throw new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Something went wrong while inserting transaction",
    );
  }

  logger.debug(
    { path: req.originalUrl },
    "[Stake Trasaction Init] Stake transaction initated successfully",
  );

  return res
    .status(201)
    .json(new ApiSuccess({}, "Trnsaction inserted successully"));
});
