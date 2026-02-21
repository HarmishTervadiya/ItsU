import { ApiError, ApiSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  type GetVersionedTransactionConfig,
} from "@solana/web3.js";
import { logger } from "../utils/logger";
import { prisma } from "@itsu/shared/src/lib/prisma";

// Todo: Change this with env or db config
const destination = "9uUYYvkEjEQTd7T5VgqEFkiWgFnTsRfiDqVEdwz5BEDS";

export const pushToGameQueue = asyncHandler(async (req, res) => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const { signature } = req.body;
  let config: GetVersionedTransactionConfig = {
    commitment: "finalized",
    maxSupportedTransactionVersion: 0,
  };

  logger.debug({ path: req.originalUrl }, "[Join Queue] Verifying transaction");

  const transaction = await connection.getParsedTransaction(signature, config);

  if (!transaction) {
    throw new ApiError(400, "Transaction not found");
  }

  logger.debug(
    { path: req.originalUrl, transaction },
    "[Join Queue] Transaction found in blockchain",
  );

  const existingTransaction = await prisma.transaction.findUnique({
    where: { txSignature: signature },
  });

  if (!existingTransaction)
    throw new ApiError(404, "Transaction not found in database");

  if (existingTransaction.status !== "PENDING") {
    throw new ApiError(400, "Transaction has already been processed.");
  }

  logger.debug(
    { path: req.originalUrl },
    "[Join Queue] Transaction found in db",
  );

  const { accountKeys, instructions } = transaction.transaction.message;
  const referenceKey = new PublicKey(existingTransaction.reference);
  const signatureInstruction: any = instructions[0];

  const isValid = accountKeys.some(
    (account) => account.pubkey.toBase58() === referenceKey.toBase58(),
  );
  logger.debug(
    { referenceKey, isValid },
    "[Join Queue] Transaction validated successfully",
  );

  if (
    !isValid ||
    !signatureInstruction ||
    signatureInstruction.parsed.info.destination !== destination
  ) {
    throw new ApiError(400, "Invalid transaction details");
  }

  logger.debug(
    { referenceKey, isValid },
    "[Join Queue] Transaction validated successfully",
  );

  const [updatedTransaction, newQueueEntry] = await prisma.$transaction([
    prisma.transaction.update({
      where: { id: existingTransaction.id },
      data: { status: "CONFIRMED" },
    }),
    prisma.queueEntry.create({
      data: {
        userId: req.user?.id!,
        currency: existingTransaction.currency,
        intent: "PENDING",
      },
    }),
  ]);
  logger.debug(
    { updatedTransaction },
    "[Join Queue] Transaction status updated to CONFIRMED",
  );

  if (!newQueueEntry) {
    await prisma.transaction.update({
      where: { id: existingTransaction.id },
      data: { status: "FAILED" },
    });
    throw new ApiError(500, "Failed to create new queue entry");
  }

  logger.debug(
    { newQueueEntry },
    "[Join Queue] Successfully created new queue entry",
  );

  return res
    .status(201)
    .json(new ApiSuccess(newQueueEntry, "Successfully pushed to queue"));
});
