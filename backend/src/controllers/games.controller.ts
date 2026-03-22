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
import { gameManager } from "../state/gameStore";
import { Role, Currency } from "@itsu/shared/generated/prisma/enums";
import { v4 as uuidv4 } from "uuid";
import type { GameState } from "@itsu/shared/src/types/game";
import { config } from "../config";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const BOT_NAMES = [
  "DEGEN",
  "HODLR",
  "WHALE",
  "PEPE",
  "CHAD",
  "ALEX.SOL",
  "VITALIK",
  "Satoshi",
  "MoonBoy",
  "DiamondHands",
];

// Todo: Change this with env or db config
const destination = config.ITSU_MAIN_WALLET;

export const pushToGameQueue = asyncHandler(async (req, res) => {
  const rpcUrl = config.SOLANA_RPC_URL || clusterApiUrl(config.SOLANA_NETWORK);
  const connection = new Connection(rpcUrl, "confirmed");
  const { signature } = req.body;

  logger.debug(
    { path: req.originalUrl, signature },
    "[Join Queue] Verifying transaction",
  );

  const transaction = await connection.getParsedTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!transaction) {
    throw new ApiError(
      400,
      "TRANSACTION_NOT_FOUND",
      "Transaction not found on-chain",
    );
  }

  const { accountKeys } = transaction.transaction.message;
  const pubkeys = accountKeys.map((k) => k.pubkey.toBase58());

  // Find a pending transaction for this user that matches one of the reference keys in the on-chain tx
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      userId: req.user?.id,
      status: "PENDING",
      reference: { in: pubkeys },
    },
  });

  if (!existingTransaction) {
    throw new ApiError(
      404,
      "TRANSACTION_NOT_MATCHED",
      "No pending transaction found matching this signature's reference keys",
    );
  }

  logger.debug(
    { reference: existingTransaction.reference },
    "[Join Queue] Transaction matched with DB record",
  );

  // Basic validation: check if destination matches
  if (existingTransaction.currency === Currency.SOL) {
    const transferInstruction: any =
      transaction.transaction.message.instructions.find(
        (ix: any) => ix.program === "system" && ix.parsed?.type === "transfer",
      );

    if (
      !transferInstruction ||
      transferInstruction.parsed.info.destination !== destination
    ) {
      throw new ApiError(
        400,
        "INVALID_DESTINATION",
        "Transaction sent to wrong wallet",
      );
    }
  } else if (existingTransaction.currency === Currency.SKR) {
    const mintPublicKey = new PublicKey(config.SKR_MINT);
    const platformAta = await getAssociatedTokenAddress(
      mintPublicKey,
      new PublicKey(destination),
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const tokenTransferIx: any =
      transaction.transaction.message.instructions.find(
        (ix: any) =>
          ix.program === "spl-token" &&
          (ix.parsed?.type === "transfer" ||
            ix.parsed?.type === "transferChecked"),
      );

    if (
      !tokenTransferIx ||
      tokenTransferIx.parsed.info.destination !== platformAta.toBase58()
    ) {
      throw new ApiError(
        400,
        "INVALID_DESTINATION",
        "SKR Token transaction sent to wrong destination ATA",
      );
    }
  }

  const [updatedTransaction, newQueueEntry] = await prisma.$transaction([
    prisma.transaction.update({
      where: { id: existingTransaction.id },
      data: {
        status: "CONFIRMED",
        txSignature: signature,
      },
    }),
    prisma.queueEntry.upsert({
      where: { userId: req.user?.id! },
      update: {},
      create: {
        userId: req.user?.id!,
        currency: existingTransaction.currency,
        intent: "PENDING",
      },
    }),
  ]);

  logger.debug(
    { txId: updatedTransaction.id },
    "[Join Queue] Transaction confirmed and user added to queue",
  );

  startMatchMaker();
  return res
    .status(201)
    .json(new ApiSuccess(newQueueEntry, "Successfully pushed to queue"));
});

// ──────────────────────────────────────────────────────────
// TEMPORARY TEST ENDPOINT — bypasses transaction verification
// TODO: Disable / remove this once real staking is required
// ──────────────────────────────────────────────────────────
export const pushToGameQueueTest = asyncHandler(async (req, res) => {
  console.log("Hello");
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "UNAUTHORIZED", "User not found");
  }

  logger.debug(
    { userId },
    "[Join Queue TEST] Pushing user to queue without transaction verification",
  );

  // If already in queue, just return success and re-trigger matchmaker
  const existing = await prisma.queueEntry.findUnique({
    where: { userId },
  });
  if (existing) {
    startMatchMaker();
    return res
      .status(200)
      .json(new ApiSuccess(existing, "Already in queue — resuming search"));
  }

  const newQueueEntry = await prisma.queueEntry.create({
    data: {
      userId,
      currency: "SOL", // placeholder
      intent: "PENDING",
    },
  });

  logger.debug(
    { newQueueEntry },
    "[Join Queue TEST] Successfully created new queue entry",
  );

  startMatchMaker();
  return res
    .status(201)
    .json(new ApiSuccess(newQueueEntry, "Successfully pushed to queue (test)"));
});

import { MatchStatus } from "@itsu/shared/generated/prisma/enums";

export const getActiveGame = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "UNAUTHORIZED", "User not found");
  }

  const activeGamePlayer = await prisma.gamePlayer.findFirst({
    where: {
      userId,
      game: {
        status: {
          in: [MatchStatus.ONGOING],
        },
      },
    },
    select: {
      gameId: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!activeGamePlayer) {
    return res
      .status(200)
      .json(new ApiSuccess({ gameId: null }, "No active game"));
  }

  return res
    .status(200)
    .json(
      new ApiSuccess({ gameId: activeGamePlayer.gameId }, "Active game found"),
    );
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
    winnings: item.winnings.toString(),
    Currency: item.game.currency,
    potAmount: item.game.potAmount.toString(),
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

export const createPracticeGame = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "UNAUTHORIZED", "User not found");
  }

  logger.debug(
    { path: req.originalUrl },
    "[Practice Game] Creating practice game",
  );

  const itemsCount = await prisma.item.count({ where: { isActive: true } });
  if (itemsCount === 0) {
    throw new ApiError(500, "NO_ACTIVE_ITEMS", "No active items found");
  }

  const randomItem = await prisma.item.findFirst({
    where: { isActive: true },
    skip: Math.floor(Math.random() * itemsCount),
  });

  const randomHint =
    randomItem!.hints[Math.floor(Math.random() * randomItem!.hints.length)];
  const gameId = `practice_${uuidv4()}`;

  const inMemoryPlayers: GameState["players"] = [];
  const wolfIndex = Math.floor(Math.random() * 6);

  // Load the real username for the human player, fall back if missing
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  const humanDisplayName = userRecord?.name || "You";

  for (let i = 0; i < 6; i++) {
    const assignedRole = i === wolfIndex ? Role.WOLF : Role.CITIZEN;
    if (i === 0) {
      inMemoryPlayers.push({
        playerId: userId,
        role: assignedRole,
        isDead: false,
        isBot: false,
        displayName: humanDisplayName,
      });
    } else {
      const botId = `bot_${uuidv4()}`;
      const nameIndex = Math.abs(botId.charCodeAt(0) + i) % BOT_NAMES.length;
      const displayName = BOT_NAMES[nameIndex] || "Bot";

      inMemoryPlayers.push({
        playerId: botId,
        role: assignedRole,
        isDead: false,
        isBot: true,
        displayName,
      });
    }
  }

  // Shuffle players so human isn't always player 1 in UI
  inMemoryPlayers.sort(() => Math.random() - 0.5);

  gameManager.createGame(gameId, {
    id: gameId,
    status: "LOBBY",
    currency: "SOL",
    potAmount: 0n,
    phaseEndTime: Date.now() + 5000,
    players: inMemoryPlayers,
    item: randomItem!.name,
    hint: randomHint!,
    chat: [],
    votes: {},
    totalRounds: 0,
    round: 1,
    lastActivity: Date.now(),
    isPractice: true,
  });

  logger.debug(`Practice Game ${gameId} initialized with 1 Human, 5 Bots.`);

  return res
    .status(201)
    .json(new ApiSuccess({ gameId }, "Practice game created successfully"));
});

export const abortMatchFinding = async (userId: string) => {
  try {
    await prisma.queueEntry.delete({ where: { userId } });
    console.debug(
      { path: `Abort User ${userId}` },
      "User abortted successfully",
    );
    return true;
  } catch (error) {
    logger.error({ path: `Abort User ${userId}`, err: error });
  }
};
