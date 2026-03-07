import { Toast } from "toastify-react-native";
import { apiClient } from "../utils/apiHandler";
import { withApiErrorHandler } from "../utils/apiWrapper";

export interface UpdateUserDataPayload {
  name?: string;
  email?: string;
  timezone?: string;
}

export interface UpdateUserDataResponse {
  id: string;
  name: string | null;
  email: string | null;
  timezone: string | null;
}

export const updateUserDataApi = (data: UpdateUserDataPayload) => {
  return withApiErrorHandler<UpdateUserDataResponse>(() =>
    apiClient.patch("/user/", data),
  );
};

export interface UserStatsResponse {
  totalWins: number;
  totalSolWon: string;
}

export const getUserStatsApi = () => {
  return withApiErrorHandler<UserStatsResponse>(
    () => apiClient.get("/user/stats"),
    "Could not load your stats right now. We'll keep trying.",
  );
};

export interface ReportIssuePayload {
  description: string;
}

export interface ReportIssueResponse {
  id: string;
  userId: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const reportIssueApi = (data: ReportIssuePayload) => {
  return withApiErrorHandler<ReportIssueResponse>(() =>
    apiClient.post("/user/report", data),
  );
};
