import { prisma } from "@itsu/shared/src/lib/prisma";
import { type GameState } from "@itsu/shared/src/types/game";
import { gameManager } from "../state/gameStore";
import { Currency, Role } from "@itsu/shared/generated/prisma/enums";
import { ApiError } from "../utils/apiResponse";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { STAKE_AMOUNT_LAMPORTS } from "@itsu/shared/src/constants";

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

const TICK_TIME = 5000;
let isRunning = true;
let matchMakerTimer: NodeJS.Timeout | null = null;

// Fisher-Yates shuffle to randomize queue selection
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i]!, shuffled[j]!] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

export async function matchMaker() {
  if (!isRunning) return;

  try {
    const entries = await prisma.queueEntry.findMany({
      take: 50,
      orderBy: { joinedAt: "asc" },
    });
    const solEntries = entries.filter((e) => e.currency === Currency.SOL);

    let selectedEntries: typeof solEntries = [];
    let botCount = 0;

    if (solEntries.length >= 6) {
      logger.debug("[Match Making] 6+ players found, picking 6 randomly");
      // Shuffle to avoid friends who joined together always matching
      const shuffled = shuffleArray(solEntries);
      selectedEntries = shuffled.slice(0, 6);
      botCount = 0;
    } else if (solEntries.length > 0) {
      // Still check the oldest entry for the 60s timeout (entries are ordered by joinedAt asc)
      const timeElapsed = Date.now() - solEntries[0]!.joinedAt.getTime();
      if (timeElapsed > 30000) {
        logger.debug("[Match Making] Timeout reached, adding bot players");
        selectedEntries = shuffleArray(solEntries);
        botCount = 6 - selectedEntries.length;
      }
    }

    if (selectedEntries.length === 0) {
      if (solEntries.length === 0) {
        // Queue is empty — stop the matchmaker
        stopMatchMaker();
      }
      // Entries exist but < 6 and timeout not reached yet — let the next tick retry
      return;
    }
    logger.debug("[Match Making] Entries found");

    const userIds = selectedEntries.map((e) => e.userId);
    const itemsCount = await prisma.item.count({ where: { isActive: true } });

    if (itemsCount === 0)
      throw new ApiError(500, "NO_ACTIVE_ITEMS", "No active items found");

    const randomItem = await prisma.item.findFirst({
      where: { isActive: true },
      skip: Math.floor(Math.random() * itemsCount),
    });
    const randomHint =
      randomItem!.hints[Math.floor(Math.random() * randomItem!.hints.length)];
    logger.debug("[Match Making] Creating new game");

    const result = await prisma.$transaction(async (tx) => {
      const userTxs = await tx.transaction.findMany({
        where: {
          userId: { in: userIds },
          status: "CONFIRMED",
          gameId: null,
        },
        orderBy: { createdAt: "desc" },
      });

      // Deduplicate: get only the latest unassigned transaction per user
      const userTxMap = new Map();
      for (const t of userTxs) {
        if (!userTxMap.has(t.userId)) userTxMap.set(t.userId, t);
      }

      let calculatedPot = 0n;
      const txIdsToUpdate: string[] = [];

      for (const userId of userIds) {
        const t = userTxMap.get(userId);
        if (t) {
          calculatedPot += t.amount;
          txIdsToUpdate.push(t.id);
        } else {
          // Fallback for test queues where no transaction exists
          calculatedPot += STAKE_AMOUNT_LAMPORTS;
        }
      }

      const newGame = await tx.game.create({
        data: {
          currency: Currency.SOL,
          hint: randomHint!,
          itemName: randomItem!.name,
          potAmount: calculatedPot,
          timeLimit: 600,
          status: "ONGOING",
          itemId: randomItem!.id,
        },
      });

      if (txIdsToUpdate.length > 0) {
        await tx.transaction.updateMany({
          where: { id: { in: txIdsToUpdate } },
          data: { gameId: newGame.id },
        });
      }

      logger.debug("[Match Making] Assigning wolf role");

      const wolfIndex = Math.floor(Math.random() * 6);
      const realPlayersData: { gameId: string; userId: string; role: Role }[] =
        [];
      const inMemoryPlayers: GameState["players"] = [];

      // Preload user names so we can attach real display names
      const users = await tx.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      });
      const userNameMap = new Map(users.map((u) => [u.id, u.name]));

      for (let i = 0; i < 6; i++) {
        const assignedRole = i === wolfIndex ? Role.WOLF : Role.CITIZEN;

        if (i < selectedEntries.length) {
          const userId = selectedEntries[i]!.userId;
          realPlayersData.push({
            gameId: newGame.id,
            userId,
            role: assignedRole,
          });

          const realName = userNameMap.get(userId) || null;
          const fallbackName = `PLAYER_${i + 1}`;

          inMemoryPlayers.push({
            playerId: userId,
            role: assignedRole,
            isDead: false,
            isBot: false,
            displayName: realName || fallbackName,
          });
        } else {
          // Bot: Add to Memory ONLY with a random but stable display name
          const botId = `bot_${uuidv4()}`;
          const nameIndex =
            Math.abs(botId.charCodeAt(0) + i) % BOT_NAMES.length;
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

      await tx.gamePlayer.createMany({ data: realPlayersData });
      logger.debug("[Match Making] Added game players");
      await tx.queueEntry.deleteMany({ where: { userId: { in: userIds } } });

      return { newGame, inMemoryPlayers };
    });
    gameManager.createGame(result.newGame.id, {
      id: result.newGame.id,
      status: "LOBBY",
      currency: "SOL",
      potAmount: result.newGame.potAmount,
      phaseEndTime: Date.now() + 30000,
      players: result.inMemoryPlayers,
      item: randomItem?.name!,
      hint: randomHint!,
      chat: [],
      votes: {},
      totalRounds: 0,
      round: 1,
      lastActivity: Date.now(),
    });

    // Notify all real players that their match is ready
    const { io } = require("../app");
    for (const p of result.inMemoryPlayers) {
      if (!p.isBot) {
        io.to(`lobby_${p.playerId}`).emit("matchFound", {
          gameId: result.newGame.id,
        });
      }
    }

    logger.debug(
      `Game ${result.newGame.id} initialized: ${selectedEntries.length} Humans, ${botCount} Bots.`,
    );
  } catch (error: any) {
    logger.error("Matchmaker Error:", error);
  } finally {
    if (isRunning) {
      matchMakerTimer = setTimeout(matchMaker, TICK_TIME);
    }
  }
}

export function stopMatchMaker() {
  isRunning = false; // Flip the kill-switch

  if (matchMakerTimer) {
    clearTimeout(matchMakerTimer);
    matchMakerTimer = null;
  }
  logger.debug("Matchmaker stopped cleanly.");
}

export function startMatchMaker() {
  if (!isRunning) {
    isRunning = true;
    matchMaker();
    logger.debug("Matchmaker started.");
  }
}
