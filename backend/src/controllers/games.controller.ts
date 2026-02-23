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
import { startMatchMaker } from "../workers/matchmaker";

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

  startMatchMaker();
  return res
    .status(201)
    .json(new ApiSuccess(newQueueEntry, "Successfully pushed to queue"));
});

export const getUserGameHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  logger.debug(
    { path: req.originalUrl },
    "[User Game History] Fetching initated ",
  );
  const gamesHistory = await prisma.gamePlayer.findMany({
    where: { userId },
    select: {
      gameId: true,
      role: true,
      isDead: true,
      roundsSurvived: true,
      winnings: true,
      game: {
        select: {
          currency: true,
          potAmount: true,
          winnerRole: true,
          totalRounds: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: {
      game: {
        startTime: "desc",
      },
    },
  });

  const userGames = gamesHistory.map((item) => ({
    gameId: item.gameId,
    role: item.role,
    isDead: item.isDead,
    roundsSurvived: item.roundsSurvived,
    winnings: item.winnings,
    Currency: item.game.currency,
    potAmount: item.game.potAmount,
    totalRounds: item.game.totalRounds,
    winnerRole: item.game.winnerRole,
    startTime: item.game.startTime,
    endTime: item.game.endTime,
  }));

  logger.debug(
    { path: req.originalUrl },
    "[User Game History] Fetching successful ",
  );

  return res
    .status(200)
    .json(new ApiSuccess(userGames, "User game history fetched successfully"));
});
