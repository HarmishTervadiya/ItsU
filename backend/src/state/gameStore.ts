import { prisma } from '@itsu/shared/src/lib/prisma';
import { type GameState } from '@itsu/shared/src/types/game';
import { Role } from '@itsu/shared/generated/prisma/enums';
import { logger } from '../utils/logger';

const PHASE_DURATIONS = {
    LOBBY: 30000,
    CHAT_PHASE: 45000,
    NIGHT_PHASE: 10000,
    VOTE_PHASE: 15000
};

class GameManager {
    private activeGames: Map<string, GameState> = new Map();
    
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
            if (NOW >= game.phaseEndTime && game.status !== 'FINISHED' && game.status !== 'FAILED') {
                this.changePhase(gameId);
            }
        }
    }

    public getGame(id: string) { return this.activeGames.get(id); }

    public createGame(id: string, initialData: GameState) {
        this.activeGames.set(id, { ...initialData, lastActivity: Date.now() });
    }

    private cleanup() {
        const NOW = Date.now();
        for (const [id, game] of this.activeGames.entries()) {
            if (NOW - game.lastActivity > 180000 || game.status === "FINISHED" || game.status === "FAILED") {
                this.activeGames.delete(id);
                logger.debug(`Cleaned up game ${id} from memory.`);
            }
        }
    }

    public getAlivePlayer(game: GameState, playerId: string) {
        return game.players.find(p => p.playerId === playerId && !p.isDead);
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
            game.chat.push({ senderId, text: message, timestamp: Date.now() });
            game.lastActivity = Date.now();
            this.broadcast(gameId, game);
        }
    }

    public addVote(gameId: string, voterId: string, votedPlayerId: string) {
        const game = this.activeGames.get(gameId);
        if (!game || game.status !== 'VOTE_PHASE') return;

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
        if (!game || game.status !== 'NIGHT_PHASE') return;

        const isWolfAlive = game.players.find(p => p.playerId === wolfId && p.role === "WOLF" && !p.isDead);
        const target = this.getAlivePlayer(game, targetId);

        if (isWolfAlive && target) {
            target.isDead = true;
            game.lastActivity = Date.now();
            
            prisma.gamePlayer.update({
                where: { gameId_userId: { gameId, userId: targetId } },
                data: { isDead: true, roundsSurvived: game.totalRounds }
            }).catch(e => logger.error({ gameId }, "DB update failed for Wolf kill", e));

            this.broadcast(gameId, game);
        }
    }

    public changePhase(gameId: string) {
        const game = this.activeGames.get(gameId);
        if (!game) return;

        switch (game.status) {
            case 'LOBBY':
                game.status = "CHAT_PHASE";
                game.phaseEndTime = Date.now() + PHASE_DURATIONS.CHAT_PHASE;
                break;
            case 'CHAT_PHASE':
                game.status = "NIGHT_PHASE";
                game.phaseEndTime = Date.now() + PHASE_DURATIONS.NIGHT_PHASE;
                break;
            case 'NIGHT_PHASE':
                game.status = "VOTE_PHASE";
                game.phaseEndTime = Date.now() + PHASE_DURATIONS.VOTE_PHASE;
                break;
            case 'VOTE_PHASE':
                this.processVotes(gameId);
                
                if (!this.isGameFinished(gameId)) {
                    game.status = "CHAT_PHASE";
                    game.totalRounds++;
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
                
                prisma.gamePlayer.update({
                    where: { gameId_userId: { gameId, userId: highestVotedId } },
                    data: { isDead: true, roundsSurvived: game.totalRounds }
                }).catch(e => logger.error({ gameId }, "DB update failed for Voting execution", e));
            }
        }
        
        game.votes = {};
    }

    public isGameFinished(gameId: string): boolean {
        const game = this.activeGames.get(gameId);
        if (!game) return true;

        const wolf = game.players.find(player => player.role === "WOLF");
        const citizens = game.players.filter(player => player.role === "CITIZEN" && !player.isDead);

        if (wolf?.isDead) {
            game.status = "FINISHED";
            this.handlePayouts(gameId, Role.CITIZEN);
            return true;
        }

        if (citizens.length <= 1) {
            game.status = "FINISHED";
            this.handlePayouts(gameId, Role.WOLF);
            return true;
        }

        return false;
    }

    private async handlePayouts(gameId: string, winnerRole: Role) {
        const game = this.activeGames.get(gameId);
        if (!game) return;

        try {
            const feePct = 2n; 
            const platformFee = (game.potAmount * feePct) / 100n;
            const netPot = game.potAmount - platformFee;

            const winners = game.players.filter(p => p.role === winnerRole && !p.isDead && !p.isBot);

            if (winners.length === 0) {
                logger.info(`Game ${gameId} won by Bots. No payouts to process.`);
                await prisma.game.update({ where: { id: gameId }, data: { endTime: new Date(), status: "FINISHED", winnerRole }});
                return;
            }

            const amountPerWinner = netPot / BigInt(winners.length);

            await prisma.$transaction(async (tx) => {
                await tx.game.update({
                    where: { id: gameId },
                    data: { endTime: new Date(), status: "FINISHED", winnerRole }
                });

                for (const winner of winners) {
                    await tx.gamePlayer.update({
                        where: { gameId_userId: { gameId: gameId, userId: winner.playerId } },
                        data: { winnings: amountPerWinner }
                    });

                    if (game.currency === 'SOL') {
                        await tx.user.update({
                            where: { id: winner.playerId },
                            data: { totalSolWon: { increment: amountPerWinner } }
                        });
                    } else if (game.currency === 'SKR') {
                        await tx.user.update({
                            where: { id: winner.playerId },
                            data: { totalSkrWon: { increment: amountPerWinner } }
                        });
                    }

                    await tx.transaction.create({
                        data: {
                            userId: winner.playerId,
                            gameId: gameId,
                            type: "PAYOUT",
                            currency: game.currency as "SOL" | "SKR", 
                            amount: amountPerWinner,
                            status: "PENDING",
                            reference: `PAYOUT_${gameId}_${winner.playerId}`
                        }
                    });
                }
            });

            logger.info(`Payouts calculated for Game ${gameId}. Winners: ${winners.length}`);
            // TODO: Hand off to Smart Contract Web3 worker to process the PENDING transactions

        } catch (error: any) {
            logger.error(`Payout failed for game ${gameId}`, error);
            await prisma.game.update({ where: { id: gameId }, data: { status: "SERVER_ERROR" } }).catch(console.error);
        }
    }
}

export const gameManager = new GameManager();