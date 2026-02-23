import Groq from "groq-sdk";
import { config } from "../config";
import type { GameState } from "@itsu/shared/src/types/game";
import { logger } from "../utils/logger";
import { gameManager } from "../state/gameStore";

const groq = new Groq({ apiKey: config.GROQ_API_KEY });

const processedActions = new Set<string>();

export class BotEngine { 

    public static handleStateChange(gameId: string, state: GameState) {
        const aliveBots = state.players.filter(p => p.isBot && !p.isDead);
        if (aliveBots.length === 0) return;

        for (const bot of aliveBots) {
            const actionKey = `${gameId}_${state.status}_${bot.playerId}`;
            
            if (processedActions.has(actionKey)) continue;

            if (state.status === 'CHAT_PHASE') {
                processedActions.add(actionKey);
                this.triggerBotChat(gameId, state, bot);
            } 
            else if (state.status === 'VOTE_PHASE') {
                processedActions.add(actionKey);
                this.triggerBotVote(gameId, state, bot);
            }
            else if (state.status === 'NIGHT_PHASE' && bot.role === 'WOLF') {
                processedActions.add(actionKey);
                this.triggerBotKill(gameId, state, bot);
            }
        }
    }

    public static async triggerBotChat(gameId: string, state: GameState, bot: any) {
        try {
            const delay = Math.floor(Math.random() * 4000) + 1000;
            await new Promise(res => setTimeout(res, delay));

            const chatHistory = state.chat.map((c) => `${c.senderId}: ${c.text}`).join('\n');
            logger.debug({ gameId }, "[Bot Chat] generation initiated");

            const prompt = `You are playing a social deduction game.
            Your ID is ${bot.playerId}. You are a ${bot.role}.
            If you are CITIZEN then use the item and if you are WOLF then use the item hint.
            NOTE: CITZEN must not disclose identity of the item, message should be vague but related to item
            The item is: "${state.item}" 
            The item hint is: "${state.hint}".
            Recent chat: ${chatHistory}
            Write a short, casual 1-sentence chat message pretending to be a human player. 
            Do not use hashtags or emojis. Defend yourself or accuse others based on the chat.`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.1-8b-instant", 
                max_completion_tokens: 50
            });

            logger.debug({ gameId }, "[Bot Chat] generation successful!");

            const reply = chatCompletion.choices[0]?.message.content?.trim();
            if (reply) {
                logger.debug({ gameId }, "[Bot Chat] Chat added");
                gameManager.addChat(gameId, bot.playerId, reply);
            }
        } catch (error: any) {
            logger.error(`[Bot Chat] Error for game: ${gameId} and bot: ${bot.playerId}:`, error);   
        }
    }

    public static async triggerBotVote(gameId: string, state: GameState, bot: any) {
        try {
            logger.debug({ gameId }, "[Bot Vote] generation initiated");
            const delay = Math.floor(Math.random() * 2000) + 1000;
            await new Promise(res => setTimeout(res, delay));

            const chatHistory = state.chat.map((c) => `${c.senderId}: ${c.text}`).join("\n");
            
            const alivePlayerIds = state.players
                .filter(p => !p.isDead && p.playerId !== bot.playerId)
                .map(p => p.playerId).join(", ");

            const prompt = `You are playing a social deduction game. Your ID is ${bot.playerId}. You are a ${bot.role}.
            Analyze the chat and determine who to vote out.
            Recent chat: ${chatHistory}.
            Alive Players: [${alivePlayerIds}]

            You MUST reply ONLY with a valid JSON object containing the targetId.
            Example: {"targetId": "player-uuid-here"}`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.1-8b-instant",
                response_format: { type: "json_object" }, 
                max_completion_tokens: 50
            });

            const reply = chatCompletion.choices[0]?.message.content?.trim();
            if (reply) {
                const parsed = JSON.parse(reply); 
                if (parsed.targetId) {
                    gameManager.addVote(gameId, bot.playerId, parsed.targetId);
                }
            }
        } catch (error: any) {
            logger.error(`[Bot Vote] Error for game: ${gameId} and bot: ${bot.playerId}:`, error);   
        }
    }

    public static async triggerBotKill(gameId: string, state: GameState, bot: any) {
        try {
            logger.debug({ gameId }, "[Bot Kill] generation initiated");
            const delay = Math.floor(Math.random() * 2000) + 3000;
            await new Promise(res => setTimeout(res, delay));

            const chatHistory = state.chat.map((c) => `${c.senderId}: ${c.text}`).join("\n");
            const aliveCitizenIds = state.players
                .filter(p => !p.isDead && p.role === "CITIZEN")
                .map(p => p.playerId).join(", ");

            const prompt = `You are playing a social deduction game. Your ID is ${bot.playerId}. You are a WOLF.
            Use the chat to find out who can provide better information and who cannot.
            Recent chat: ${chatHistory}.
            Alive Citizens: [${aliveCitizenIds}]

            You MUST reply ONLY with a valid JSON object containing the targetId of the citizen to eliminate.
            Example: {"targetId": "citizen-uuid-here"}`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.1-8b-instant",
                response_format: { type: "json_object" }, 
                max_completion_tokens: 50
            });

            const reply = chatCompletion.choices[0]?.message.content?.trim();
            if (reply) {
                const parsed = JSON.parse(reply);
                if (parsed.targetId) {
                    gameManager.killPlayer(gameId, bot.playerId, parsed.targetId);
                }
            }
        } catch (error: any) {
            logger.error(`[Bot Kill] Error for game: ${gameId} and bot: ${bot.playerId}:`, error);   
        }
    }
}