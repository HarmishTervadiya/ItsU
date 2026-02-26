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
