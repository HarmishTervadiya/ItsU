import { prisma } from "@itsu/shared/src/lib/prisma";
import { type GameState } from '@itsu/shared/src/types/game';
import { gameManager } from "../state/gameStore";
import { Currency, Role } from "@itsu/shared/generated/prisma/enums";
import { ApiError } from "../utils/apiResponse";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from 'uuid';

const TICK_TIME = 5000;
let isRunning = true;
let matchMakerTimer: NodeJS.Timeout | null = null;

export async function matchMaker() {
  if (!isRunning) return;
  
  try {
    const entries = await prisma.queueEntry.findMany({ take: 50, orderBy: { joinedAt: 'asc' } });
    const solEntries = entries.filter((e) => e.currency === Currency.SOL);
    
    let selectedEntries: typeof solEntries = [];
    let botCount = 0;

    if (solEntries.length >= 6) {
        logger.debug("[Match Making] 6 players found")
      selectedEntries = solEntries.slice(0, 6);
      botCount = 0;
    } else if (solEntries.length > 0) {
        const timeElapsed = Date.now() - solEntries[0]!.joinedAt.getTime();
        if (timeElapsed > 60000) {
          logger.debug("[Match Making] Adding bot players found")
        selectedEntries = solEntries; 
        botCount = 6 - selectedEntries.length;
      }
    }

    if (selectedEntries.length === 0) {
        stopMatchMaker()
        return
    };
    logger.debug("[Match Making] Entries found")

    const userIds = selectedEntries.map(e => e.userId);
    const itemsCount = await prisma.item.count({ where: { isActive: true } });
    
    if (itemsCount === 0) throw new ApiError(500, "No active items found");
    
    const randomItem = await prisma.item.findFirst({ 
      where: { isActive: true }, 
      skip: Math.floor(Math.random() * itemsCount) 
    });
    const randomHint = randomItem!.hints[Math.floor(Math.random() * randomItem!.hints.length)];
    logger.debug("[Match Making] Creating new game")

    const result = await prisma.$transaction(async (tx) => {
      const newGame = await tx.game.create({
        data: {
          currency: Currency.SOL,
          hint: randomHint!,
          itemName: randomItem!.name,
          potAmount: BigInt(LAMPORTS_PER_SOL * 0.5 * selectedEntries.length), 
          timeLimit: 600,
          status: "ONGOING",
          itemId: randomItem!.id,
        }
      });

      logger.debug("[Match Making] Assigning wolf role")

      const wolfIndex = Math.floor(Math.random() * 6);
      const realPlayersData: { gameId: string; userId: string; role: Role }[] = [];
      const inMemoryPlayers: GameState["players"] = [];

      for (let i = 0; i < 6; i++) {
        const assignedRole = (i === wolfIndex) ? Role.WOLF : Role.CITIZEN;

        if (i < selectedEntries.length) {
          const userId = selectedEntries[i]!.userId;
          realPlayersData.push({ gameId: newGame.id, userId, role: assignedRole, });
          inMemoryPlayers.push({ playerId: userId, role: assignedRole, isDead: false, isBot: false });
        } else {
          // It's a Bot -> Add to Memory ONLY
          inMemoryPlayers.push({ playerId: `bot_${uuidv4()}`, role: assignedRole, isDead: false, isBot: true });
        }
      }

      
      await tx.gamePlayer.createMany({ data: realPlayersData });
      logger.debug("[Match Making] Added game players")
      await tx.queueEntry.deleteMany({ where: { userId: { in: userIds } } });
      
      return { newGame, inMemoryPlayers };
    });
-
    gameManager.createGame(result.newGame.id, {
      id: result.newGame.id,
      status: 'LOBBY',
      currency: 'SOL',
      potAmount: result.newGame.potAmount,
      phaseEndTime: Date.now() + 30000,
      players: result.inMemoryPlayers,
      chat: [],
      votes: {},
      totalRounds: 0,
      lastActivity: Date.now()
    });

    logger.debug(`Game ${result.newGame.id} initialized: ${selectedEntries.length} Humans, ${botCount} Bots.`);

  } catch (error:any) {
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