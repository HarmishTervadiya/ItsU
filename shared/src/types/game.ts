export interface GameState {
  id: string;
  status: 'LOBBY' | 'CHAT_PHASE' | 'NIGHT_PHASE' | 'VOTE_PHASE' | 'FINISHED' | 'FAILED';
  currency: 'SOL' | 'SKR';
  potAmount: bigint;
  phaseEndTime: number; 
  players: {
    playerId: string;
    role: 'WOLF' | 'CITIZEN';
    isDead: boolean;
    isBot: boolean;
  }[];
  chat: { senderId: string; text: string; timestamp: number }[];
  votes: Record<string, string>;
  totalRounds: number;
  lastActivity: number
}