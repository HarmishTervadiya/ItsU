import { Redirect } from "expo-router";
import { authStore } from "@/src/stores/authStore";

export default function Index() {
  const isAuthenticated = authStore((s) => s.isAuthenticated);
  return <Redirect href={isAuthenticated ? "/game" : "/auth/login"} />;
}
