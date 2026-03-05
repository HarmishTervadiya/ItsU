import React from "react";
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SetUsernameModal from "@/src/components/SetUsernameModal";
import { useAuthStore } from "@/src/stores/authStore";
import { LogOut, Gamepad2, Trophy, Wallet, Zap, History, Settings, ChevronRight, Siren } from "lucide-react-native";
import CrewmateAvatar from "@/src/components/CrewmateAvatar";
import GameButton from "@/src/components/GameButton";
import { MatchmakingModal } from "@/src/components/MatchmakingModal";
import { useRouter } from "expo-router";
import { createPracticeGameApi } from "@/src/api/game";
import { Toast } from "toastify-react-native";
import ConfirmationModal from "@/src/components/ConfirmationModal";

export default function GameHomeScreen() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [isMatchmaking, setIsMatchmaking] = React.useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
    const [isPracticeLoading, setIsPracticeLoading] = React.useState(false);
    const [isMatchmakingLoading, setIsMatchmakingLoading] = React.useState(false);

    const onStartGame = () => {
        setIsMatchmakingLoading(true);
        setIsMatchmaking(true);
        // Modal opening is fast, but we show feedback briefly
        setTimeout(() => setIsMatchmakingLoading(false), 300);
    };

    const onPracticeGame = async () => {
        setIsPracticeLoading(true);
        const { data, success } = await createPracticeGameApi();
        if (success && data?.gameId) {
            router.push(`/game/${data.gameId}`);
        } else {
            Toast.error("Failed to start practice game");
        }
        setIsPracticeLoading(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#1a1a24]">
            <ScrollView
                className="flex-1 px-5 relative"
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-row items-center justify-between mb-8 z-10 pt-2">
                    <View className="max-w-72 flex-row items-center gap-3 bg-panel p-2 pr-4 rounded-full border-4 border-[#12121A] shadow-md">
                        <CrewmateAvatar />
                        <View>
                            <Text className="text-[10px] font-black uppercase tracking-wider text-primary">
                                Captain
                            </Text>
                            <Text textBreakStrategy="balanced" lineBreakMode="clip" className="text-wrap text-sm font-black text-white leading-none uppercase">
                                {user?.name || "PLAYER"}
                            </Text>
                        </View>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity
                        onPress={() => setShowLogoutConfirm(true)}
                        className="w-12 h-12 bg-panel rounded-full border-4 border-[#12121A] items-center justify-center shadow-[2px_2px_0_0_black]"
                    >
                        <LogOut size={20} color={"#D946EF"} strokeWidth={3} />
                    </TouchableOpacity>
                </View>

                {/* Main Action Area (Start Game Button) */}
                <TouchableOpacity
                    onPress={onStartGame}
                    activeOpacity={0.9}
                    className="mb-8 z-10"
                >
                    {/* Big Button container */}
                    <View className="relative shadow-2xl">
                        {/* Background Drop Shadow Emulation */}
                        <View
                            className="absolute inset-x-0 bottom-0 top-3 rounded-[32px] bg-primary-dark"
                        />

                        <View
                            className="relative rounded-[32px] p-6 border-b-8 overflow-hidden bg-primary border-primary-dark"
                        >
                            {/* Top Row inside Button */}
                            <View className="flex-row justify-between items-start mb-6 z-10">
                                <View className="bg-black/30 rounded-lg px-3 py-1 flex-row items-center gap-2">
                                    <View className="w-2 h-2 rounded-full bg-green-400" />
                                    <Text className="text-xs font-bold text-white uppercase">420 Online</Text>
                                </View>
                                <Gamepad2 size={48} className="text-primary-dark" style={{ opacity: 0.6, transform: [{ rotate: "12deg" }], marginTop: -8 }} />
                            </View>

                            {/* Center Content */}
                            <View className="items-center z-10">
                                <Text className="w-full text-center text-4xl font-black text-white italic uppercase tracking-tighter" style={{ textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, transform: [{ rotate: "-1deg" }] }}>
                                    Start Game
                                </Text>
                                <View className="px-3 py-1 rounded-lg mb-4 mt-1 bg-primary-dark/40">
                                    <Text className="font-bold text-white">High Stakes Only</Text>
                                </View>

                                {isMatchmakingLoading ? (
                                    <ActivityIndicator size="large" color="#ffffff" className="mt-4" />
                                ) : (
                                    <>
                                        {/* Fake Progress/Queue Bar */}
                                        <View className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                                            <View className="bg-white w-3/4 h-full rounded-full" />
                                        </View>
                                        <Text className="text-[10px] text-white/60 font-bold mt-1 uppercase w-full text-right">Queue: Fast</Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Stats Widget */}
                <View className="flex-row gap-3 mb-8 z-10">
                    {/* Wins Card */}
                    <View className="flex-1 bg-[#3B3E5B] border-4 border-[#12121A] rounded-2xl p-3 flex-row items-center gap-3 shadow-[4px_4px_0_0_black]">
                        <View className="bg-yellow-500 p-2 rounded-xl border-2 border-black">
                            <Trophy size={20} color="white" />
                        </View>
                        <View>
                            <Text className="w-full text-[10px] font-black text-slate-400 uppercase">Wins</Text>
                            <Text className="w-full text-xl font-black text-white">42</Text>
                        </View>
                    </View>

                    {/* Balance Card */}
                    <View className="flex-1 bg-[#3B3E5B] border-4 border-[#12121A] rounded-2xl p-3 flex-row items-center gap-3 shadow-[4px_4px_0_0_black]">
                        <View className="p-2 rounded-xl border-2 border-black bg-primary">
                            <Wallet size={20} color="white" />
                        </View>
                        <View>
                            <Text className="w-full text-[10px] font-black text-slate-400 uppercase">Balance</Text>
                            <Text className="w-full text-xl font-black text-white">14 SOL</Text>
                        </View>
                    </View>
                </View>

                {/* Grid Menu */}
                <View className="flex-row flex-wrap justify-between gap-y-4 z-10">

                    {/* Practice Panel */}
                    <TouchableOpacity
                        className={`w-[48%] bg-panel border-4 border-[#12121A] rounded-3xl p-4 items-start shadow-[4px_4px_0_0_black] ${isPracticeLoading ? 'opacity-70' : ''}`}
                        onPress={onPracticeGame}
                        disabled={isPracticeLoading}
                    >
                        {isPracticeLoading ? (
                            <View className="w-full items-center justify-center py-4">
                                <ActivityIndicator size="large" color="#FACC15" />
                            </View>
                        ) : (
                            <>
                                <Zap size={32} color="#FACC15" className="mb-2" />
                                <Text className="w-full font-black text-white text-lg mt-1">Practice</Text>
                                <View className="bg-yellow-500/20 px-2 py-0.5 rounded-full mt-1">
                                    <Text className="w-full text-[10px] font-bold text-yellow-300">No Risk</Text>
                                </View>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* History Panel */}
                    <TouchableOpacity className="w-[48%] bg-panel border-4 border-[#12121A] rounded-3xl p-4 items-start shadow-[4px_4px_0_0_black]">
                        <History size={32} className="text-accent mb-2" color={"#E879F9"} strokeWidth={3} />
                        <Text className="w-full font-black text-white text-lg mt-1">History</Text>
                        <Text className="w-full text-xs font-bold text-slate-400 mt-1">Past kills</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="w-full bg-panel border-4 border-[#12121A] rounded-3xl p-4 flex-row items-center justify-between shadow-[4px_4px_0_0_black]">
                        <View className="flex-row items-center gap-4">
                            <View className="w-10 h-10 bg-slate-800 rounded-xl border-2 border-slate-700 items-center justify-center">
                                <Settings size={24} color="#94a3b8" />
                            </View>
                            <View className="w-full">
                                <Text className="w-full font-black text-white text-lg">Settings</Text>
                                <Text className="w-full text-xs font-bold text-slate-500">Audio, Controls, Account</Text>
                            </View>
                        </View>
                        <ChevronRight color="#64748b" />
                    </TouchableOpacity>

                    <View className="w-full mt-2">
                        <GameButton variant="primary" icon={<Siren size={24} color="white" />} onPress={() => console.log('Report issue')}>
                            REPORT ISSUE
                        </GameButton>
                    </View>
                </View>

            </ScrollView>

            <SetUsernameModal />
            <MatchmakingModal
                isOpen={isMatchmaking}
                onClose={() => setIsMatchmaking(false)}
                onMatchFound={(gameId) => {
                    setIsMatchmaking(false);
                    router.push(`/game/${gameId}`);
                }}
            />
            <ConfirmationModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={() => {
                    setShowLogoutConfirm(false);
                    logout();
                }}
                title="Logout"
                message="Are you sure you want to log out of your session?"
                confirmText="Logout"
                type="danger"
            />
        </SafeAreaView >
    );
}
