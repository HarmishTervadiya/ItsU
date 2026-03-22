import { apiClient } from "../utils/apiHandler";
import { withApiErrorHandler } from "../utils/apiWrapper";

export interface AddStakeTransactionPayload {
  reference: string;
  currency: "SOL" | "SKR";
  amount: number;
}

export const addStakeTransactionApi = (
  data: AddStakeTransactionPayload,
  signal?: AbortSignal,
  showToast: boolean = true,
) => {
  return withApiErrorHandler(
    () => apiClient.post("/transactions/stake/request", data, { signal }),
    showToast,
  );
};
