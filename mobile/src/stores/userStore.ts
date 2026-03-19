import { create } from "zustand";
import { GameHistoryItem, getGameHistoryApi } from "../api/game";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserStatsApi } from "../api/user";
import { isLoading } from "expo-font";
import { lamportsToSol } from "../utils/solana";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

type UserStats = {
  totalWins: number;
  totalSolWon: string;
  totalSkrWon: string;
};

interface UserState {
  stats: UserStats;
  history: GameHistoryItem[];
  isLoading: boolean;

  retriveUserStats: () => Promise<void>;
  retriveUserHistory: () => Promise<void>;
}

export const userStore = create<UserState>()(
  persist(
    (set) => ({
      stats: { totalSkrWon: "0.0", totalSolWon: "0.0", totalWins: 0 },
      history: [],
      isLoading: false,

      retriveUserStats: async () => {
        set({ isLoading: true });
        const { data, success } = await getUserStatsApi();
        if (success && data) {
          data.totalSolWon = lamportsToSol(data.totalSolWon, LAMPORTS_PER_SOL);
          set({ stats: data });
        }
        set({ isLoading: false });
      },
      retriveUserHistory: async () => {
        set({ isLoading: true });
        const { data, success } = await getGameHistoryApi();
        if (data && success) {
          set({ history: data });
        }
        set({ isLoading: false });
      },
    }),
    {
      name: "itsu-db-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
