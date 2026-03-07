import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { ChevronLeft, Trophy, Skull, Coins, Clock } from "lucide-react-native";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getGameHistoryApi, GameHistoryItem } from "@/src/api/game";

export default function GameHistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<GameHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        const { data, success } = await getGameHistoryApi();
        if (success && data) {
            setHistory(data);
        }
        setRefreshing(false);
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            const { data, success } = await getGameHistoryApi();
            if (success && data) {
                setHistory(data);
            }
            setIsLoading(false);
        };
        fetchHistory();
    }, []);

    const renderItem = React.useCallback(({ item }: { item: GameHistoryItem }) => {
        const isWinner = item.winnings !== "0";
        const solPot = (Number(item.potAmount) / LAMPORTS_PER_SOL).toFixed(3);
        const solWon = (Number(item.winnings) / LAMPORTS_PER_SOL).toFixed(3);
        const date = new Date(item.startTime).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });

        return (
            <View className="bg-panel border-4 border-[#12121A] rounded-2xl p-4 mb-4 shadow-[4px_4px_0_0_black]">
                <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center gap-2">
                        {item.role === "WOLF" ? (
                            <View className="bg-red-500/20 px-2 py-1 rounded-md border border-red-500/50">
                                <Text className="text-red-400 font-bold text-[10px] uppercase">Wolf</Text>
                            </View>
                        ) : (
                            <View className="bg-blue-500/20 px-2 py-1 rounded-md border border-blue-500/50">
                                <Text className="text-blue-400 font-bold text-[10px] uppercase">Citizen</Text>
                            </View>
                        )}
                        <Text className="text-slate-400 font-bold text-xs">{date}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Coins size={14} color="#FACC15" />
                        <Text className="text-yellow-400 font-black">{solPot} SOL</Text>
                    </View>
                </View>

                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                        <View className={`w-12 h-12 rounded-xl border-2 items-center justify-center ${isWinner ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
                            {isWinner ? (
                                <Trophy size={24} color="#22C55E" />
                            ) : (
                                <Skull size={24} color="#EF4444" />
                            )}
                        </View>
                        <View>
                            <Text className={`font-black text-xl uppercase ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                                {isWinner ? 'Victory' : 'Defeat'}
                            </Text>
                            <Text className="text-slate-400 font-bold text-xs mt-0.5">
                                Survived {item.roundsSurvived}/{item.totalRounds} rounds
                            </Text>
                        </View>
                    </View>

                    {isWinner && (
                        <View className="items-end">
                            <Text className="text-green-400 font-black text-lg">+{solWon}</Text>
                            <Text className="text-green-500/70 font-bold text-[10px] uppercase">SOL Won</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-[#1a1a24]">
            <View className="px-5 pt-2 pb-4 flex-row items-center relative z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-panel border-4 border-[#12121A] rounded-full items-center justify-center -translate-x-1"
                >
                    <ChevronLeft size={20} color="#94a3b8" />
                </TouchableOpacity>
                <Text className="text-2xl font-black text-white italic uppercase translate-x-3">Game History</Text>
            </View>

            <View className="flex-1 px-5">
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#D946EF" />
                    </View>
                ) : (
                    <FlashList
                        data={history}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item) => item.gameId}
                        pagingEnabled
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D946EF" colors={["#D946EF"]} />
                        }
                        contentContainerStyle={{ paddingBottom: 40 }}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center mt-20">
                                <Clock size={48} color="#475569" className="mb-4" />
                                <Text className="text-slate-400 font-bold text-lg text-center">No games played yet</Text>
                                <Text className="text-slate-500 text-sm text-center mt-2">Your glorious victories will appear here.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
