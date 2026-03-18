import { AxiosError } from "axios";
import { ERROR_MESSAGES, ErrorCode } from "../constants/errors";
import { Toast } from "toastify-react-native";

type ApiResponse<T> = {
  data: T | null;
  success: boolean;
  error: string | null;
};

type ApiError = {
  statusCode: string;
  errorCode: string;
};

export async function withApiErrorHandler<T>(
  apiCall: () => Promise<T>,
  showToast: boolean = true,
  overrideMessage?: string,
): Promise<ApiResponse<T>> {
  try {
    const result = await apiCall();
    return { data: result, error: null, success: true };
  } catch (error: any) {
    const message = resolveErrorMessage(error, overrideMessage);
    if (showToast) {
      Toast.error(message);
    }

    return { data: null, error: message, success: false };
  }
}

function resolveErrorMessage(error: any, overrideMessage?: string): string {
  if (overrideMessage) return overrideMessage;

  if (error instanceof AxiosError) {
    return resolveAxiosError(error);
  }

  console.warn("[API] Non-HTTP Error", error);
  return ERROR_MESSAGES.NETWORK_ERROR;
}

function resolveAxiosError(error: AxiosError): string {
  const data = error.response?.data as ApiError;
  const serverCode = data.errorCode as ErrorCode | undefined;

  if (serverCode && ERROR_MESSAGES[serverCode]) {
    return ERROR_MESSAGES[serverCode];
  }

  const statusCode = error.response?.status;
  if (statusCode == 500) return ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  if (statusCode == 404) return "Resource not found";

  if (error.code === "ECONNABORTED" || error.message.includes("timeout"))
    return ERROR_MESSAGES.TIMEOUT_ERROR;

  if (error.code === "ERR_NETWORK" || error.message === "Network Error")
    return ERROR_MESSAGES.UNKNOWN_ERROR;

  console.warn("[API] Unhandled Axios error:", error.code, error.message);
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
