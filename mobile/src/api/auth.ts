import { apiClient } from "../utils/apiHandler";
import { withApiErrorHandler } from "../utils/apiWrapper";

export interface LoginPayload {
  walletAddress: string;
  signature: string;
  timezone: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
}

export const loginApi = (data: LoginPayload) => {
  return withApiErrorHandler(() =>
    apiClient.post<LoginResponse>("/api/auth/login", data),
  );
};

export const getNonceApi = (walletAddress: string) => {
  return withApiErrorHandler(() =>
    apiClient.get<{ nonce: string }>(`/api/auth/nonce/${walletAddress}`),
  );
};
