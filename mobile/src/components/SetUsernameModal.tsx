import React, { useState } from "react";
import { View, Text, Modal, TextInput } from "react-native";
import { User } from "lucide-react-native";
import ToastManager, { Toast } from "toastify-react-native";
import { useAuthStore } from "@/src/stores/authStore";
import { updateUserDataApi } from "@/src/api/user";
import GameButton from "@/src/components/GameButton";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function SetUsernameModal() {
    const user = useAuthStore((s) => s.user);
    const completeProfileSetup = useAuthStore((s) => s.completeProfileSetup);
    const needsProfileSetup = !!user && !user.name;

    const [username, setUsername] = useState("");
    const [savingUsername, setSavingUsername] = useState(false);

    const handleSaveUsername = async () => {
        console.log("Saving username", username);
        if (!username.trim()) {
            Toast.error("Please enter a username");
            return;
        }

        setSavingUsername(true);
        const { success, error } = await updateUserDataApi({ name: username.trim() });
        setSavingUsername(false);

        if (success) {
            completeProfileSetup(username.trim());
            Toast.success("Profile updated!");
        } else {
            Toast.error(error || "Failed to update profile");
        }
    };

    return (
        <>
            <Modal
                visible={needsProfileSetup}
                animationType="slide"
                transparent={true}
            >
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <View className="flex-1 bg-black/90 justify-center p-6">
                        <View className="bg-[#161623] rounded-3xl p-6 border border-[#8B5CF6]/30 shadow-2xl">
                            <Text className="text-white text-2xl font-black mb-2 text-center">
                                PLAYER IDENTITY
                            </Text>
                            <Text className="text-gray-400 text-sm mb-6 text-center">
                                Please set your username to proceed into the game.
                            </Text>

                            <View className="bg-black/50 border border-white/10 rounded-2xl p-2 flex-row items-center mb-6">
                                <User color="#8B5CF6" size={24} />
                                <TextInput
                                    className="flex-1 text-white ml-3 text-lg"
                                    placeholder="Enter username"
                                    placeholderTextColor="#666"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <GameButton
                                onPress={handleSaveUsername}
                                loading={savingUsername}
                            >
                                Confirm Identity
                            </GameButton>
                        </View>
                    </View>
                </GestureHandlerRootView>
            </Modal>
            <ToastManager />
        </>
    );
}
