import { apiClient } from "../utils/apiHandler";
import { withApiErrorHandler } from "../utils/apiWrapper";

export interface CreatePracticeGameResponse {
  gameId: string;
}

export const createPracticeGameApi = () => {
  return withApiErrorHandler<CreatePracticeGameResponse>(() =>
    apiClient.post("/games/practice"),
  );
};
