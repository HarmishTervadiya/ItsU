import React from "react";
import { View, Text, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SetUsernameModal from "@/src/components/SetUsernameModal";
import { useAuthStore } from "@/src/stores/authStore";

export default function GameHomeScreen() {
    const {logout} = useAuthStore();
    return (
        <SafeAreaView className="flex-1 bg-black items-center justify-center">
            <Text className="text-white text-3xl font-bold">Game Home Screen</Text>
            <Button title="Logout" onPress={logout} />
            <SetUsernameModal />
        </SafeAreaView>
    );
}

