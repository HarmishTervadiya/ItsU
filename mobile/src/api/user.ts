import * as z from "zod";
import { updateUserSchema } from "@itsu/shared/zod/user.validation";
import { Toast } from "toastify-react-native";
import { apiClient } from "../utils/apiHandler";

export const updateUserData = async (data: any) => {
  const res = await apiClient.patch("/user/", data);

  console.info("User updated successfully");
  Toast.success("User updated successfully");
  return res;
};
