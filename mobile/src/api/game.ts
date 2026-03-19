import { apiClient } from "../utils/apiHandler";
import { withApiErrorHandler } from "../utils/apiWrapper";

export interface CreatePracticeGameResponse {
  gameId: string;
}

export interface JoinQueueResponse {
  id: string;
  userId: string;
  intent: string;
}

export interface ActiveGameResponse {
  gameId: string | null;
}

export const createPracticeGameApi = () => {
  return withApiErrorHandler<CreatePracticeGameResponse>(() =>
    apiClient.post("/games/practice"),
  );
};

export const joinTestQueueApi = () => {
  return withApiErrorHandler<JoinQueueResponse>(() =>
    apiClient.post("/games/queue/join-test"),
  );
};

export const joinQueueApi = (signature: string) => {
  return withApiErrorHandler<JoinQueueResponse>(() =>
    apiClient.post("/games/queue/join", { signature }),
  );
};

export const getActiveGameApi = () => {
  return withApiErrorHandler<ActiveGameResponse>(() =>
    apiClient.get("/games/active"),
  );
};

export interface GameHistoryItem {
  gameId: string;
  role: string;
  isDead: boolean;
  roundsSurvived: number;
  winnings: string;
  Currency: string;
  potAmount: string;
  totalRounds: number;
  winnerRole: string | null;
  startTime: string;
  endTime: string | null;
}

export const getGameHistoryApi = () => {
  return withApiErrorHandler<GameHistoryItem[]>(
    () => apiClient.get("/games/history"),
    true,
    "Could not load your game history right now. Please try again later.",
  );
};
