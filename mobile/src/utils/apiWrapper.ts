import { AxiosError } from "axios";
import { ERROR_MESSAGES, ErrorCode } from "../constants/errors";
import { Toast } from "toastify-react-native";

type ApiResponse<T> = {
  data: T | null;
  success: boolean;
  error: string | null;
};

export async function withApiErrorHandler<T>(
  apiCall: () => Promise<T>,
  showErrorToastOrMessage: boolean | string = true,
): Promise<ApiResponse<T>> {
  try {
    const result = await apiCall();
    return { data: result, error: null, success: true };
  } catch (error: any) {
    let errorMessage =
      typeof showErrorToastOrMessage === "string"
        ? showErrorToastOrMessage
        : ERROR_MESSAGES["UNKNOWN_ERROR"];

    if (error instanceof AxiosError) {
      const serverErrorCode = error.response?.data.errorCode as ErrorCode;

      if (
        serverErrorCode &&
        ERROR_MESSAGES[serverErrorCode] &&
        typeof showErrorToastOrMessage !== "string"
      ) {
        errorMessage = ERROR_MESSAGES[serverErrorCode];
      } else if (typeof showErrorToastOrMessage !== "string") {
        const status = error.response?.status;
        if (status === 500)
          errorMessage = ERROR_MESSAGES["INTERNAL_SERVER_ERROR"];
        else if (status === 404) errorMessage = `Resource not found.`;
        else if (
          error.code === "ECONNABORTED" ||
          error.message.includes("timeout")
        ) {
          errorMessage = ERROR_MESSAGES["TIMEOUT_ERROR"];
        } else if (
          error.code === "ERR_NETWORK" ||
          error.message === "Network Error"
        ) {
          errorMessage = ERROR_MESSAGES["NETWORK_ERROR"];
        }
      }

      console.log(
        `[API Wrapper] failed with code ${serverErrorCode || error.code}`,
      );
    } else {
      console.log(`[API Wrapper] NON_HTTP ERROR`, error);
      if (typeof showErrorToastOrMessage !== "string") {
        errorMessage = ERROR_MESSAGES["NETWORK_ERROR"];
      }
    }

    if (showErrorToastOrMessage !== false) {
      Toast.error(errorMessage);
    }

    return { data: null, error: errorMessage, success: false };
  }
}
