import { Coins, Skull, Trophy } from "lucide-react-native";
import { Text, View } from "react-native";
import { GameHistoryItem } from "../api/game";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { lamportsToSol } from "../utils/solana";

export const HistoryCard = ({
  role,
  winnings,
  totalRounds,
  roundsSurvived,
  currency,
  potAmount,
  startTime,
}: GameHistoryItem) => {
  const solPot = lamportsToSol(potAmount, LAMPORTS_PER_SOL);
  const solWon = lamportsToSol(winnings, LAMPORTS_PER_SOL);
  const isWinner = parseFloat(solWon) > 0;
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });

  const parsed = new Date(startTime);
  const date = Number.isNaN(parsed.getTime())
    ? "-"
    : dateFormatter.format(parsed);

  return (
    <View className="bg-panel border-4 border-[#12121A] rounded-2xl p-4 mb-4 shadow-[4px_4px_0_0_black]">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-2">
          {role === "WOLF" ? (
            <View className="bg-red-500/20 px-2 py-1 rounded-md border border-red-500/50">
              <Text className="text-red-400 font-bold text-[10px] uppercase">
                Wolf
              </Text>
            </View>
          ) : (
            <View className="bg-blue-500/20 px-2 py-1 rounded-md border border-blue-500/50">
              <Text className="text-blue-400 font-bold text-[10px] uppercase">
                Citizen
              </Text>
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
          <View
            className={`w-12 h-12 rounded-xl border-2 items-center justify-center ${isWinner ? "bg-green-500/20 border-green-500" : "bg-red-500/20 border-red-500"}`}
          >
            {isWinner ? (
              <Trophy size={24} color="#22C55E" />
            ) : (
              <Skull size={24} color="#EF4444" />
            )}
          </View>
          <View>
            <Text
              className={`font-black text-xl uppercase ${isWinner ? "text-green-400" : "text-red-400"}`}
            >
              {isWinner ? "Victory" : "Defeat"}
            </Text>
            <Text className="text-slate-400 font-bold text-xs mt-0.5">
              Survived {roundsSurvived}/{totalRounds} rounds
            </Text>
          </View>
        </View>

        {isWinner && (
          <View className="items-end">
            <Text className="text-green-400 font-black text-lg">+{solWon}</Text>
            <Text className="text-green-500/70 font-bold text-[10px] uppercase">
              SOL Won
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
