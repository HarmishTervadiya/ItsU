import React, { useState } from "react";
import { View, Text, TextInput, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { X, Siren } from "lucide-react-native";
import GameButton from "./GameButton";
import { reportIssueApi } from "../api/user";
import { Toast } from "toastify-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!description.trim()) {
            Toast.error("Please describe the issue");
            return;
        }

        setIsLoading(true);
        const { data, success } = await reportIssueApi({ description });
        setIsLoading(false);

        if (success) {
            Toast.success("Issue reported successfully");
            setDescription("");
            onClose();
        } else {
            Toast.error("Failed to report issue");
        }
    };

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <GestureHandlerRootView style={{ flex: 1 }}>

                <View className="flex-1 bg-black/80 justify-center p-4">
                    <View className="bg-panel border-4 border-[#12121A] rounded-3xl p-6 shadow-[8px_8px_0_0_black]">
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-row items-center gap-2">
                                <Siren size={24} color="#EF4444" />
                                <Text className="text-2xl font-black text-white uppercase italic">
                                    Report Issue
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                className="w-8 h-8 bg-slate-800 rounded-full items-center justify-center border-2 border-slate-700"
                            >
                                <X size={16} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-slate-400 font-bold mb-4">
                            Please describe the issue you encountered in detail. We'll look into it ASAP.
                        </Text>

                        <View className="bg-[#12121A] rounded-xl border-2 border-slate-800 p-4 mb-6 h-44">
                            <TextInput
                                className="text-white font-bold text-lg flex-1"
                                placeholder="What went wrong?"
                                placeholderTextColor="#64748b"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                scrollEnabled
                                textAlignVertical="top"
                                autoFocus
                            />
                        </View>

                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <GameButton
                                    variant="accent"
                                    onPress={onClose}
                                >
                                    CANCEL
                                </GameButton>
                            </View>
                            <View className="flex-1">
                                <GameButton
                                    variant="primary"
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                    className={isLoading ? "opacity-50" : ""}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        "SUBMIT"
                                    )}
                                </GameButton>
                            </View>
                        </View>
                    </View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}
