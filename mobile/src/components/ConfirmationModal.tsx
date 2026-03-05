import React from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import { X, AlertTriangle, LogOut, DoorOpen } from "lucide-react-native";
import { GameButton } from "./GameButton";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
}

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "info",
}: ConfirmationModalProps) => {
    const getIcon = () => {
        switch (type) {
            case "danger":
                return <LogOut size={48} color="#EF4444" strokeWidth={2.5} />;
            case "warning":
                return <AlertTriangle size={48} color="#F59E0B" strokeWidth={2.5} />;
            default:
                return <DoorOpen size={48} color="#D946EF" strokeWidth={2.5} />;
        }
    };

    const getAccentColor = () => {
        switch (type) {
            case "danger":
                return "#EF4444";
            case "warning":
                return "#F59E0B";
            default:
                return "#D946EF";
        }
    };

    return (
        <Modal visible={isOpen} transparent animationType="fade">
            <GestureHandlerRootView className="flex-1">
            <View className="flex-1 justify-center items-center bg-black/60 p-6">
                <View className="w-full max-w-sm bg-[#2C2F48] border-4 border-[#12121A] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    <View
                        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 pointer-events-none"
                        style={{ backgroundColor: getAccentColor() }}
                    />

                    <TouchableOpacity
                        onPress={onClose}
                        className="absolute top-4 right-4 z-10 w-8 h-8 bg-[#161623] border-2 border-[#12121A] rounded-full flex items-center justify-center"
                    >
                        <X size={16} color="#94a3b8" strokeWidth={3} />
                    </TouchableOpacity>

                    <View className="items-center mt-4">
                        <View className="mb-4 bg-[#161623] p-4 rounded-2xl border-2 border-[#12121A]">
                            {getIcon()}
                        </View>

                        <Text className="w-full text-2xl font-black text-white uppercase tracking-wider text-center mb-2">
                            {title}
                        </Text>

                        <Text className="w-full text-slate-400 font-bold text-sm text-center mb-8 leading-5">
                            {message}
                        </Text>

                        <View className="w-full flex-row gap-2">
                            <View className="flex-1">
                                <GameButton
                                    variant="accent"
                                    onPress={onClose}
                                    fullWidth
                                >
                                    {cancelText}
                                </GameButton>
                            </View>
                            <View className="flex-1">
                                <GameButton
                                    variant="primary"
                                    onPress={onConfirm}
                                    fullWidth
                                >
                                    {confirmText}
                                </GameButton>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
            </GestureHandlerRootView>
        </Modal>
    );
};

export default ConfirmationModal;
