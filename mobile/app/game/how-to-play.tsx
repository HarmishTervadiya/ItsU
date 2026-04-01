import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Key,
  Skull,
  Users,
  MessageSquare,
  Sun,
  Moon,
} from "lucide-react-native";
import { useRouter } from "expo-router";

export default function HowToPlayScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-[#232338]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 mr-2 bg-[#232338] rounded-full"
        >
          <ChevronLeft size={24} color="#D946EF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white uppercase tracking-widest">
          How To Play ITSU
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-20">
        {/* Intro Section */}
        <View className="mb-8 items-center">
          <Text
            className="text-3xl font-black text-[#8B5CF6] uppercase mb-2 tracking-tighter"
            style={{ transform: [{ rotate: "-2deg" }] }}
          >
            Trust No One
          </Text>
          <Text className="text-[#a0a0c0] text-center text-base leading-6">
            ITSU is a high-stakes social deduction game where players stake SOL
            to enter. Deception is required. Survival is rewarded.
          </Text>
        </View>

        {/* Roles Section */}
        <View className="bg-panel p-5 rounded-3xl border-4 border-[#12121A] shadow-[4px_4px_0_0_black] mb-6">
          <View className="flex-row items-center gap-2 mb-4">
            <Key size={24} color="#FACC15" />
            <Text className="text-2xl font-black text-white uppercase">
              The Roles
            </Text>
          </View>

          <View className="mb-4 bg-[#232338] p-3 rounded-xl border border-[#3b3e5b]">
            <View className="flex-row items-center gap-2 mb-1">
              <Users size={20} color="#60A5FA" />
              <Text className="text-lg font-bold text-[#60A5FA] uppercase">
                Citizens
              </Text>
            </View>
            <Text className="text-[#a0a0c0] leading-5">
              The innocent majority. Your goal is to root out the Killers and
              vote them out before you are eliminated. Survive to the end, and
              the remaining Citizens split the staked SOL pool.
            </Text>
          </View>

          <View className="bg-[#4c0519] p-3 rounded-xl border border-[#9f1239]">
            <View className="flex-row items-center gap-2 mb-1">
              <Skull size={20} color="#F43F5E" />
              <Text className="text-lg font-bold text-[#F43F5E] uppercase">
                Killer
              </Text>
            </View>
            <Text className="text-[#fecdd3] leading-5">
              The hidden minority. Your goal is to blend in, deceive the
              Citizens, and eliminate them at night. If Killer outnumber
              Citizens, they win the entire pot.
            </Text>
          </View>
        </View>

        {/* Gameplay Phases */}
        <View className="bg-panel p-5 rounded-3xl border-4 border-[#12121A] shadow-[4px_4px_0_0_black] mb-6">
          <View className="flex-row items-center gap-2 mb-4">
            <Sun size={24} color="#F97316" />
            <Text className="text-2xl font-black text-white uppercase">
              The Phases
            </Text>
          </View>

          <View className="mb-6 pl-2 border-l-2 border-[#3b3e5b]">
            <Text className="text-lg font-bold text-white uppercase mb-1">
              1. The Day Phase
            </Text>
            <Text className="text-[#a0a0c0] mb-2 leading-5">
              Players use the global chat to discuss, accuse, and defend
              themselves. Analyze behavior and chat history to find
              inconsistencies.
            </Text>
            <View className="flex-row items-center gap-2 bg-black/30 p-2 rounded-lg">
              <MessageSquare size={16} color="#8B5CF6" />
              <Text className="text-[#8B5CF6] text-xs font-bold uppercase">
                Chat is critical for survival
              </Text>
            </View>
          </View>

          <View className="mb-6 pl-2 border-l-2 border-[#F43F5E]">
            <View className="flex-row items-center gap-2 mb-1">
              <Moon size={18} color="#F43F5E" />
              <Text className="text-lg font-bold text-[#F43F5E] uppercase">
                2. The Night Phase
              </Text>
            </View>
            <Text className="text-[#a0a0c0] leading-5">
              Darkness falls. Chat is silent. The Killer secretly select one
              Citizen to murder. When morning breaks, the victim is revealed,
              and the Vote Phase begins.
            </Text>
          </View>

          <View className="mb-6 pl-2 border-l-2 border-[#D946EF]">
            <Text className="text-lg font-bold text-white uppercase mb-1">
              3. The Voting Phase
            </Text>
            <Text className="text-[#a0a0c0] leading-5">
              At the end of the day, all players vote on who they believe is a
              Killer. The player with the most votes is executed and their true
              role is revealed. and if the killer is not eliminated the Day
              Phase begins again
            </Text>
          </View>
        </View>

        {/* Stakes Note */}
        <View className="bg-[#8B5CF6]/10 p-5 rounded-3xl border-2 border-[#8B5CF6]/30 mb-8 items-center">
          <Text className="text-[#D946EF] font-black uppercase text-center mb-2 text-lg">
            Winner Takes All
          </Text>
          <Text className="text-[#a0a0c0] text-center text-sm leading-5">
            Every player stakes an entry fee in SOL. When the game ends, a 2%
            protocol fee is taken, and the rest is split evenly among the
            winning team.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
