import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable, Image } from "react-native";
import { X, Play, Zap, ShieldAlert, Crosshair } from "lucide-react-native";
import SolanaIcon from "@/src/assets/images/icons/solana-icon.png";
import { Toast } from "toastify-react-native";
import { GameButton } from "./GameButton";
import { joinQueueApi } from "../api/game";
import { addStakeTransactionApi } from "../api/transactions";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/src/stores/authStore";
import { useGameStore } from "@/src/stores/gameStore";
import { useWallet } from "../hooks/useWallet";
import { Keypair } from "@solana/web3.js";
import { config } from "../config";
import { STAKE_AMOUNT_SOL, STAKE_AMOUNT_LAMPORTS, STAKE_AMOUNT_SKR, STAKE_DISPLAY } from "../constants";

interface MatchmakingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMatchFound: (gameId: string) => void;
}

export const MatchmakingModal = ({
    isOpen,
    onClose,
    onMatchFound,
}: MatchmakingModalProps) => {
    const { user } = useAuthStore();
    const { lobbySocket, connectToLobby } = useGameStore();
    const { sendSOL } = useWallet();
    const [step, setStep] = useState<"select" | "finding">("select");
    const [currency, setCurrency] = useState<"SOL" | "SKR">("SOL");
    const [loading, setLoading] = useState(false);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setStep("select");
            setCurrency("SOL");
            setLoading(false);
        }
    }, [isOpen]);

    // Listen for matchFound on lobbySocket when in "finding" state
    useEffect(() => {
        if (step !== "finding" || !lobbySocket) return;

        const handleMatchFound = (data: { gameId: string }) => {
            if (data?.gameId) {
                onMatchFound(data.gameId);
            }
        };

        lobbySocket.on("matchFound", handleMatchFound);

        return () => {
            lobbySocket.off("matchFound", handleMatchFound);
        };
    }, [step, lobbySocket, onMatchFound]);

    const handleEnterQueue = async () => {
        console.log("[MatchmakingModal] handleEnterQueue called");
        if (!user?.id) {
            Toast.error("User not found");
            return;
        }

        setLoading(true);
        try {
            // Step 1: Generate reference key for server-side verification
            const reference = Keypair.generate();
            const stakeAmount = currency === "SOL" ? STAKE_AMOUNT_SOL : STAKE_AMOUNT_SKR;
            const lamports = currency === "SOL" ? STAKE_AMOUNT_LAMPORTS : STAKE_AMOUNT_SKR;

            // Step 2: Record intent in DB
            console.log("[MatchmakingModal] Recording stake intent...");
            const { success: recordSuccess, error: recordError } = await addStakeTransactionApi({
                reference: reference.publicKey.toBase58(),
                currency,
                amount: lamports,
            });

            if (!recordSuccess) {
                throw new Error(recordError || "Failed to initiate stake transaction");
            }

            // Step 3: Send SOL with reference
            console.log("[MatchmakingModal] Sending SOL...");
            const signature = await sendSOL(
                config.ITSU_MAIN_WALLET,
                stakeAmount,
                reference.publicKey
            );

            if (!signature) {
                throw new Error("Transaction cancelled or failed");
            }

            // Step 4: Join queue with signature
            console.log("[MatchmakingModal] Joining queue with signature:", signature);
            const { success, error } = await joinQueueApi(signature);

            if (!success) {
                throw new Error(error || "Failed to join matchmaking queue");
            }

            // Step 5: On success, connect lobby socket
            console.log("[MatchmakingModal] Connecting lobby socket...");
            connectToLobby(user.id);
            setStep("finding");
        } catch (err: any) {
            console.error("[MatchmakingModal] Staking error:", err);
            Toast.error(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const primaryColor = "#9945FF";
    const accentColor = "#9945FF";

    return (
        <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <Pressable className="flex-1 justify-center items-center bg-[#0a0a10]/80 p-4" onPress={onClose}>
                    {/* Modal Container */}
                    <Pressable
                        className="w-full max-w-sm bg-[#2C2F48] border-4 border-[#12121A] rounded-3xl p-6 shadow-xl relative overflow-hidden"
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Background Glow */}
                        <View
                            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 pointer-events-none"
                            style={{ backgroundColor: accentColor }}
                        />

                        {step === "select" && (
                            <TouchableOpacity
                                onPress={onClose}
                                className="absolute top-4 right-4 z-50 w-8 h-8 bg-[#161623] border-2 border-[#12121A] rounded-full flex items-center justify-center shadow-sm"
                            >
                                <X size={16} color="#94a3b8" strokeWidth={3} />
                            </TouchableOpacity>
                        )}

                        {step === "select" ? (
                            <View key="select" className="gap-5 relative z-10 pt-2">
                                <View className="items-center mt-2">
                                    <Text className="text-2xl font-black text-white uppercase tracking-wider mb-1">
                                        Choose Stake
                                    </Text>
                                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Entry Fee Required
                                    </Text>
                                </View>

                                <View className="flex-row gap-3">
                                    {/* SOL Option */}
                                    <TouchableOpacity
                                        onPress={() => setCurrency("SOL")}
                                        activeOpacity={0.8}
                                        className={`flex-1 p-4 rounded-2xl border-4 items-center justify-center transition-all ${currency === "SOL"
                                            ? "bg-[#323552]"
                                            : "bg-[#161623] border-[#12121A]"
                                            }`}
                                        style={
                                            currency === "SOL"
                                                ? {
                                                    borderColor: primaryColor,
                                                    shadowColor: "#059669",
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 1,
                                                    shadowRadius: 0,
                                                    elevation: 4,
                                                }
                                                : {}
                                        }
                                    >
                                        <View className="items-center gap-2">
                                            <View className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10 mb-1">
                                                <Image
                                                    source={SolanaIcon}
                                                    style={{ width: 24, height: 24, opacity: currency === "SOL" ? 1 : 0.5 }}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                            <Text className="w-full text-center font-black text-white text-lg leading-none">
                                                {STAKE_DISPLAY.SOL}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    {/* SKR Option */}
                                    <View
                                        className={`flex-1 p-4 rounded-2xl border-4 items-center justify-center transition-all bg-[#161623] border-[#12121A] opacity-50 relative`}
                                    >
                                        <View className="absolute top-1 bg-accent/20 px-2 py-0.5 rounded-full border border-accent/50 z-10">
                                            <Text className="text-[8px] font-black text-white uppercase tracking-wider">Coming Soon</Text>
                                        </View>
                                        <View className="items-center gap-2 mt-2">
                                            <View className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10 mb-1">
                                                <Zap
                                                    size={20}
                                                    color={"#94a3b8"}
                                                />
                                            </View>
                                            <Text className="w-full text-center font-black text-slate-500 text-lg leading-none">
                                                {STAKE_DISPLAY.SKR}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-3 flex-row gap-2 mt-2">
                                    <ShieldAlert size={20} color="#f87171" />
                                    <View className="flex-1 flex-row flex-wrap">
                                        <Text className="text-[10px] font-bold text-red-200 leading-tight uppercase">
                                            <Text className="text-red-400 font-black">Warning: </Text>
                                            If you are killed, your staked funds are permanently
                                            forfeited to the survivors' pot.
                                        </Text>
                                    </View>
                                </View>

                                <View className="mt-2 w-full">
                                    <GameButton
                                        onPress={handleEnterQueue}
                                        icon={<Play size={24} color="white" />}
                                        fullWidth
                                        loading={loading}
                                    >
                                        {loading ? "JOINING..." : "STAKE & ENTER"}
                                    </GameButton>
                                </View>
                            </View>
                        ) : (
                            <View key="finding" className="items-center gap-6 py-6 pb-2 relative z-10">
                                <View className="relative mt-4 mb-2 justify-center items-center">
                                    <View className="w-24 h-24 bg-[#161623] border-4 border-[#12121A] rounded-full flex items-center justify-center shadow-inner relative z-10 animate-pulse">
                                        <Crosshair
                                            size={40}
                                            color={accentColor}
                                            strokeWidth={3}
                                            className="animate-spin"
                                        />
                                        <View className="absolute w-2 h-2 bg-white rounded-full top-4 left-6" />
                                    </View>
                                </View>

                                <View className="items-center space-y-2 mt-2">
                                    <Text className="text-2xl font-black text-white uppercase tracking-wider">
                                        Match Finding...
                                    </Text>
                                    <View className="flex-row items-center justify-center gap-2 bg-[#161623] border-2 border-[#12121A] px-3 py-1.5 rounded-full mt-2">
                                        <View className="w-2 h-2 rounded-full bg-green-400" />
                                        <Text className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                                            Staked:{" "}
                                            <Text className="text-white">
                                                {STAKE_DISPLAY[currency]}
                                            </Text>
                                        </Text>
                                    </View>
                                </View>

                                <View className="w-full mt-6">
                                    <GameButton
                                        onPress={onClose}
                                        variant="accent"
                                        icon={<X size={24} color="white" />}
                                    >
                                        ABORT
                                    </GameButton>
                                </View>
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </GestureHandlerRootView>
        </Modal>
    );
};
