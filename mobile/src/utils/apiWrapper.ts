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
  showErrorToast = true,
): Promise<ApiResponse<T>> {
  try {
    const result = await apiCall();
    return { data: result, error: null, success: true };
  } catch (error: any) {
    let errorMessage = ERROR_MESSAGES["UNKNOWN_ERROR"];

    if (error instanceof AxiosError) {
      const serverErrorCode = error.response?.data.errorCode as ErrorCode;

      if (serverErrorCode && ERROR_MESSAGES[serverErrorCode]) {
        errorMessage = ERROR_MESSAGES[serverErrorCode];
      } else {
        const status = error.response?.status;
        if (status === 500)
          errorMessage = `The ItsU servers are currently struggling.`;
        if (status === 404) errorMessage = `Resource not found.`;
      }

      console.log(`[API Wrapper] failed with code ${serverErrorCode}`);
    } else {
      console.log(`[API Wrapper] NON_HTTP ERROR`, error);
      errorMessage = "Network error. Check you connection.";
    }

    if (showErrorToast) Toast.error(errorMessage);

    return { data: null, error: errorMessage, success: false };
  }
}
