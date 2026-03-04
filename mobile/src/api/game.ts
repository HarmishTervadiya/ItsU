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

export const getActiveGameApi = () => {
  return withApiErrorHandler<ActiveGameResponse>(() =>
    apiClient.get("/games/active"),
  );
};
