import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Gavel } from "lucide-react-native";
import { gameStore } from "@/src/stores/gameStore";
import { authStore } from "@/src/stores/authStore";

interface VotePhaseProps {
  alivePlayers: { id: string; name: string; color: string; isMe: boolean }[];
  players: { id: string; name: string; color: string; isMe: boolean }[];
}

export const VotePhase: React.FC<VotePhaseProps> = ({
  alivePlayers,
  players,
}) => {
  const { game, submitVote } = gameStore();
  const { user } = authStore();

  const hasVoted = !!game?.votes?.[user?.id || ""];

  const handleVote = (targetId: string) => {
    if (hasVoted || !game?.id) return;
    submitVote(game.id, targetId);
  };

  const handleRandomVote = () => {
    const others = alivePlayers.filter((p) => !p.isMe);
    if (others.length === 0) return;
    const randomTarget = others[Math.floor(Math.random() * others.length)];
    handleVote(randomTarget.id);
  };

  return (
    <View className="absolute inset-x-0 bottom-0 z-40" pointerEvents="box-none">
      <View className="mx-3 mb-3" pointerEvents="auto">
        {/* Tab Label */}
        <View className="absolute -top-5 left-1/2 -translate-x-[60px] bg-accent px-4 py-1 rounded-full border-2 border-[#12121A] flex-row items-center gap-2 z-10 w-[120px] justify-center shadow-lg">
          <Gavel size={14} color="white" />
          <Text className="text-white font-black uppercase text-[10px]">
            Vote
          </Text>
        </View>

        <View
          className="bg-panel/95 border-4 border-[#12121A] rounded-3xl p-4 pt-5"
          pointerEvents={alivePlayers.find((p) => p.isMe) ? "auto" : "none"}
        >
          {hasVoted ? (
            <View className="items-center py-6">
              <Text className="w-full text-center text-accent font-black text-lg uppercase">
                Vote Casted!
              </Text>
              <Text className="w-full text-center text-slate-400 text-xs font-bold mt-1">
                Waiting for others...
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-white font-black text-center uppercase text-xs tracking-widest mb-3">
                Who is the Wolf?
              </Text>
              <ScrollView
                className="max-h-48"
                showsVerticalScrollIndicator={false}
              >
                <View className="flex-row flex-wrap justify-between gap-y-2">
                  {alivePlayers
                    .filter((p) => !p.isMe)
                    .map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => handleVote(p.id)}
                        activeOpacity={0.7}
                        className="w-[48%] bg-background border-2 border-primary/20 rounded-xl p-3 flex-row items-center gap-2"
                      >
                        <View
                          className="w-5 h-5 rounded-full border-2 border-[#12121A]"
                          style={{ backgroundColor: p.color }}
                        />
                        <Text
                          className="text-xs font-black text-white flex-shrink"
                          numberOfLines={1}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleRandomVote}
                activeOpacity={0.7}
                className="w-full bg-background border-2 border-accent/30 rounded-xl py-3 mt-3"
              >
                <Text className="text-sm font-black text-accent uppercase tracking-widest text-center">
                  🎲 Random Vote
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};
