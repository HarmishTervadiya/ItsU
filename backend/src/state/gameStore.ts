import { prisma } from "@itsu/shared/src/lib/prisma";
import { type GameState } from "@itsu/shared/src/types/game";
import { Role } from "@itsu/shared/generated/prisma/enums";
import { logger } from "../utils/logger";
import { BotEngine } from "../workers/botEngine";

const PHASE_DURATIONS = {
  LOBBY: 7000,
  CHAT_PHASE: 45000,
  NIGHT_PHASE: 10000,
  VOTE_PHASE: 15000,
};

class GameManager {
  private activeGames: Map<string, GameState> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  public onStateChange?: (gameId: string, state: GameState) => void;

  constructor() {
    // Checks for phase changes every second
    setInterval(() => this.tick(), 1000);

    // Cleans up abandoned or finished games every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private tick() {
    const NOW = Date.now();
    for (const [gameId, game] of this.activeGames.entries()) {
      BotEngine.tick(gameId, game);

      if (
        NOW >= game.phaseEndTime &&
        game.status !== "FINISHED" &&
        game.status !== "FAILED"
      ) {
        this.changePhase(gameId);
      }
    }
  }

  public getGame(id: string) {
    return this.activeGames.get(id);
  }

  public createGame(id: string, initialData: GameState) {
    this.activeGames.set(id, {
      ...initialData,
      lastActivity: Date.now(),
      round: 1,
    });
  }

  private cleanup() {
    const NOW = Date.now();
    for (const [id, game] of this.activeGames.entries()) {
      if (
        NOW - game.lastActivity > 180000 ||
        game.status === "FINISHED" ||
        game.status === "FAILED"
      ) {
        this.activeGames.delete(id);
        logger.debug(`Cleaned up game ${id} from memory.`);
      }
    }
  }

  public getAlivePlayer(game: GameState, playerId: string) {
    return game.players.find((p) => p.playerId === playerId && !p.isDead);
  }

  public handlePlayerDisconnect(gameId: string, userId: string) {
    const timerKey = `${gameId}_${userId}`;
    const timer = setTimeout(() => {
      this.executeDisconnectKill(gameId, userId);
      this.disconnectTimers.delete(timerKey);
    }, 10000); // 10 seconds
    this.disconnectTimers.set(timerKey, timer);
  }

  public handlePlayerReconnect(gameId: string, userId: string) {
    const timerKey = `${gameId}_${userId}`;
    if (this.disconnectTimers.has(timerKey)) {
      clearTimeout(this.disconnectTimers.get(timerKey)!);
      this.disconnectTimers.delete(timerKey);
      logger.debug(
        `[Game ${gameId}] Player ${userId} reconnected, penalty cancelled.`,
      );
    }
  }

  private executeDisconnectKill(gameId: string, userId: string) {
    const game = this.activeGames.get(gameId);
    if (!game) return;

    if (game.status === "FINISHED" || game.status === "FAILED") return;

    const player = this.getAlivePlayer(game, userId);
    if (player) {
      player.isDead = true;
      game.lastActivity = Date.now();
      logger.info(
        `[Game ${gameId}] Player ${userId} killed due to 10s disconnection penalty.`,
      );

      if (!game.isPractice && !player.isBot) {
        prisma.gamePlayer
          .update({
            where: { gameId_userId: { gameId, userId } },
            data: { isDead: true, roundsSurvived: game.totalRounds },
          })
          .catch((e) =>
            logger.error({ gameId }, "DB update failed for disconnect kill", e),
          );
      }

      this.isGameFinished(gameId);
      this.broadcast(gameId, game);
    }
  }

  private broadcast(gameId: string, game: GameState) {
    if (this.onStateChange) {
      this.onStateChange(gameId, game);
    }
  }

  public addChat(gameId: string, senderId: string, message: string) {
    const game = this.activeGames.get(gameId);
    if (!game) return;

    if (this.getAlivePlayer(game, senderId)) {
      // Debug Win Command - To simulate the real user win situation
      if (message.trim().toLowerCase() === "/win") {
        logger.info(
          { gameId, userId: senderId },
          "[Debug] Win command triggered",
        );
        this.executeDebugWin(gameId, senderId);
        return;
      }

      game.chat.push({ senderId, text: message, timestamp: Date.now() });
      game.lastActivity = Date.now();
      this.broadcast(gameId, game);
    }
  }

  public addVote(gameId: string, voterId: string, votedPlayerId: string) {
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== "VOTE_PHASE") return;

    const isVoterAlive = this.getAlivePlayer(game, voterId);
    const isVotedPlayerAlive = this.getAlivePlayer(game, votedPlayerId);

    if (isVoterAlive && isVotedPlayerAlive) {
      game.votes[voterId] = votedPlayerId;
      game.lastActivity = Date.now();
      this.broadcast(gameId, game);
    }
  }

  public killPlayer(gameId: string, wolfId: string, targetId: string) {
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== "NIGHT_PHASE") return;

    const isWolfAlive = game.players.find(
      (p) => p.playerId === wolfId && p.role === "WOLF" && !p.isDead,
    );
    const target = this.getAlivePlayer(game, targetId);

    if (isWolfAlive && target) {
      // Record the kill intent but don't kill yet
      game.nightKillId = targetId;
      game.lastActivity = Date.now();
      this.broadcast(gameId, game);
    }
  }

  public executeDebugWin(gameId: string, userId: string) {
    const game = this.activeGames.get(gameId);
    if (!game || game.status === "FINISHED") return;

    logger.debug(
      { gameId, userId },
      "[Debug] Executing instant win for player",
    );

    // Kill all other players
    for (const player of game.players) {
      if (player.playerId !== userId) {
        player.isDead = true;
      }
    }

    game.lastActivity = Date.now();
    this.isGameFinished(gameId);
    this.broadcast(gameId, game);
  }

  public changePhase(gameId: string) {
    const game = this.activeGames.get(gameId);
    if (!game) return;

    switch (game.status) {
      case "LOBBY":
        game.status = "CHAT_PHASE";
        game.phaseEndTime = Date.now() + PHASE_DURATIONS.CHAT_PHASE;
        break;
      case "CHAT_PHASE":
        game.status = "NIGHT_PHASE";
        game.phaseEndTime = Date.now() + PHASE_DURATIONS.NIGHT_PHASE;
        break;
      case "NIGHT_PHASE":
        if (game.nightKillId) {
          const victim = this.getAlivePlayer(game, game.nightKillId);
          if (victim) {
            victim.isDead = true;
            if (!game.isPractice && !victim.isBot) {
              prisma.gamePlayer
                .update({
                  where: {
                    gameId_userId: { gameId, userId: game.nightKillId },
                  },
                  data: { isDead: true, roundsSurvived: game.totalRounds },
                })
                .catch((e) =>
                  logger.error(
                    { gameId },
                    "DB update failed for Night execution",
                    e,
                  ),
                );
            }
          }
          game.nightKillId = undefined; // Reset for next night
        }

        if (!this.isGameFinished(gameId)) {
          game.status = "VOTE_PHASE";
          game.phaseEndTime = Date.now() + PHASE_DURATIONS.VOTE_PHASE;
        }
        break;
      case "VOTE_PHASE":
        this.processVotes(gameId);

        if (!this.isGameFinished(gameId)) {
          game.status = "CHAT_PHASE";
          game.totalRounds++;
          game.round++;
          game.phaseEndTime = Date.now() + PHASE_DURATIONS.CHAT_PHASE;
        }
        break;
    }

    game.lastActivity = Date.now();
    this.broadcast(gameId, game);
  }

  private processVotes(gameId: string) {
    const game = this.activeGames.get(gameId);
    if (!game) return;

    const voteCounts: Record<string, number> = {};

    for (const votedId of Object.values(game.votes)) {
      voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    }

    let highestVotedId: string | null = null;
    let maxVotes = 0;

    for (const [playerId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        highestVotedId = playerId;
      }
    }

    if (highestVotedId) {
      const target = this.getAlivePlayer(game, highestVotedId);
      if (target) {
        target.isDead = true;

        if (!game.isPractice && !target.isBot) {
          prisma.gamePlayer
            .update({
              where: { gameId_userId: { gameId, userId: highestVotedId } },
              data: { isDead: true, roundsSurvived: game.totalRounds },
            })
            .catch((e) =>
              logger.error(
                { gameId },
                "DB update failed for Voting execution",
                e,
              ),
            );
        }
      }
    }

    game.votes = {};
  }

  public isGameFinished(gameId: string): boolean {
    const game = this.activeGames.get(gameId);
    if (!game || game.status === "FINISHED" || game.status === "SERVER_ERROR")
      return true;

    const wolf = game.players.find((player) => player.role === "WOLF");
    const citizens = game.players.filter(
      (player) => player.role === "CITIZEN" && !player.isDead,
    );

    if (wolf?.isDead) {
      game.status = "FINISHED";
      game.winnerRole = "CITIZEN";
      this.handlePayouts(gameId, Role.CITIZEN);
      return true;
    }

    if (citizens.length <= 1) {
      game.status = "FINISHED";
      game.winnerRole = "WOLF";
      this.handlePayouts(gameId, Role.WOLF);
      return true;
    }

    if (game.isPractice) {
      const humanPlayers = game.players.filter((p) => !p.isBot);
      const humansAlive = humanPlayers.some((p) => !p.isDead);

      if (!humansAlive) {
        logger.info(
          `Practice Game ${gameId} ended early: All human players are dead.`,
        );
        game.status = "FINISHED";
        game.winnerRole = "WOLF"; // Default WOLF win if humans die in practice mode
        this.handlePayouts(gameId, Role.WOLF);
        return true;
      }
    }

    return false;
  }

  private async handlePayouts(gameId: string, winnerRole: Role) {
    logger.debug({ gameId, winnerRole }, "[Payout] Starting handlePayouts");
    const game = this.activeGames.get(gameId);
    if (!game) {
      logger.warn({ gameId }, "[Payout] Game not found in memory for payout");
      return;
    }

    if (game.isPractice) {
      logger.info(
        `Practice Game ${gameId} won by ${winnerRole}. No payouts or database transactions needed.`,
      );
      return;
    }

    try {
      // Double check status in DB to prevent race conditions across multiple server instances or quick triggers
      const dbGame = await prisma.game.findUnique({
        where: { id: gameId },
        select: { status: true },
      });

      if (dbGame?.status === "FINISHED" || dbGame?.status === "SERVER_ERROR") {
        logger.warn(
          { gameId, dbStatus: dbGame?.status },
          "[Payout] Skipping payout: Game already handled in DB",
        );
        return;
      }

      const feePct = 2n;
      const platformFee = (game.potAmount * feePct) / 100n;
      const netPot = game.potAmount - platformFee;

      logger.debug(
        {
          gameId,
          potAmount: game.potAmount.toString(),
          platformFee: platformFee.toString(),
          netPot: netPot.toString(),
        },
        "[Payout] Calculated fees",
      );

      const winners = game.players.filter(
        (p) => p.role === winnerRole && !p.isDead && !p.isBot,
      );

      logger.debug(
        {
          gameId,
          winnerCount: winners.length,
          winnerIds: winners.map((w) => w.playerId),
        },
        "[Payout] Identified human winners",
      );

      if (winners.length === 0) {
        logger.info(
          `Game ${gameId} won by Bots or all human winners dead. No payouts to process.`,
        );
        await prisma.game.update({
          where: { id: gameId },
          data: { endTime: new Date(), status: "FINISHED", winnerRole },
        });
        return;
      }

      const amountPerWinner = netPot / BigInt(winners.length);
      logger.debug(
        { gameId, amountPerWinner: amountPerWinner.toString() },
        "[Payout] Amount per winner calculated",
      );

      await prisma.$transaction(
        async (tx) => {
          logger.debug({ gameId }, "[Payout] Starting DB transaction");
          await tx.game.update({
            where: { id: gameId },
            data: { endTime: new Date(), status: "FINISHED", winnerRole },
          });

          for (const winner of winners) {
            logger.debug(
              { gameId, userId: winner.playerId },
              "[Payout] Updating winner record",
            );
            await tx.gamePlayer.update({
              where: {
                gameId_userId: { gameId: gameId, userId: winner.playerId },
              },
              data: { winnings: amountPerWinner },
            });

            if (game.currency === "SOL") {
              await tx.user.update({
                where: { id: winner.playerId },
                data: { totalSolWon: { increment: amountPerWinner } },
              });
            } else if (game.currency === "SKR") {
              await tx.user.update({
                where: { id: winner.playerId },
                data: { totalSkrWon: { increment: amountPerWinner } },
              });
            }

            const reference = `PAYOUT_${gameId}_${winner.playerId}`;
            logger.debug(
              { gameId, userId: winner.playerId, reference },
              "[Payout] Creating payout transaction record",
            );
            await tx.transaction.create({
              data: {
                userId: winner.playerId,
                gameId: gameId,
                type: "PAYOUT",
                currency: game.currency as "SOL" | "SKR",
                amount: amountPerWinner,
                status: "PENDING",
                reference,
              },
            });
          }
        },
        {
          maxWait: 5000, // Wait up to 5s for a connection
          timeout: 10000, // Total transaction timeout 10s
        },
      );

      logger.info(
        `Payouts successfully calculated and recorded for Game ${gameId}. Winners: ${winners.length}`,
      );
      // TODO: Hand off to Smart Contract Web3 worker to process the PENDING transactions
    } catch (error: any) {
      logger.error(
        { gameId, error: error.message, stack: error.stack },
        "[Payout] Payout failed",
      );
      await prisma.game
        .update({ where: { id: gameId }, data: { status: "SERVER_ERROR" } })
        .catch(console.error);
    }
  }
}

export const gameManager = new GameManager();
