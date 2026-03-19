import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { ChevronLeft, Clock } from "lucide-react-native";
import { userStore } from "@/src/stores/userStore";
import { HistoryCard } from "@/src/components/HistoryCard";
import { refreshControlHex } from "@/src/constants/color";

export default function GameHistoryScreen() {
  const router = useRouter();
  const { isLoading, history, retriveUserHistory } = userStore();
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    await retriveUserHistory();
  }, [retriveUserHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchHistory();
    } finally {
      setRefreshing(false);
    }
  }, [fetchHistory]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  return (
    <SafeAreaView className="flex-1 bg-[#1a1a24]">
      <View className="px-5 pt-2 pb-4 flex-row items-center relative z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-panel border-4 border-[#12121A] rounded-full items-center justify-center -translate-x-1"
        >
          <ChevronLeft size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-2xl font-black text-white italic uppercase translate-x-3">
          Game History
        </Text>
      </View>

      <View className="flex-1 px-5">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={refreshControlHex} />
          </View>
        ) : (
          <FlashList
            data={history}
            renderItem={({ item }) => <HistoryCard {...item} />}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.gameId}
            pagingEnabled
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={refreshControlHex}
                colors={[refreshControlHex]}
              />
            }
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center mt-20">
                <Clock size={48} color="#475569" className="mb-4" />
                <Text className="text-slate-400 font-bold text-lg text-center">
                  No games played yet
                </Text>
                <Text className="text-slate-500 text-sm text-center mt-2">
                  Your glorious victories will appear here.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
