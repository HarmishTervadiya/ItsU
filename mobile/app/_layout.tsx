import "@/src/utils/polyfills";

import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useFonts } from "expo-font";
import {
  router,
  Stack,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
import "../global.css";
import { useAuthStore } from "@/src/stores/authStore";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../src/assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isHydrated]);

  if (!loaded || !isHydrated) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key || !segments.length) return;

    const inAuthGroup = segments[0] === "auth";

    if (isAuthenticated && inAuthGroup) {
      if (router.canDismiss()) router.dismissAll();
      router.replace("/game");
    } else if (!isAuthenticated && !inAuthGroup) {
      if (router.canDismiss()) router.dismissAll();
      router.replace("/auth/login");
    }
  }, [isAuthenticated, segments, rootNavigationState?.key]);

  const initialRoute = isAuthenticated ? "game" : "auth/login";

  return (
    <GestureHandlerRootView>
      <Stack
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#161623" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="game" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}