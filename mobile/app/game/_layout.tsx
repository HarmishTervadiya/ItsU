import { Stack } from "expo-router";

export default function GameLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="[id]" />
            <Stack.Screen name="history" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="how-to-play"  options={{ animation: "slide_from_right" }} />
        </Stack>
    );
}