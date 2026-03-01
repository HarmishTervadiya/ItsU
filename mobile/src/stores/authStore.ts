import { User } from "@itsu/shared/types/user";
import { create } from "zustand";
import { loginApi } from "../api/auth";
import { getCalendars } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { deleteItem, getItem, setItem } from "../utils/secureStore";
import { PublicKey } from "@solana/web3.js";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  publicKey: PublicKey | null;

  hydrate: () => void;
  login: (walletAddress: string, signature: string) => Promise<boolean>;
  logout: () => void;
  setPublicKey: (publicKey: PublicKey | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,
      publicKey: null,

      hydrate: async () => {
        const accessToken = getItem("accessToken");
        const refreshToken = getItem("accessToken");

        set({
          isAuthenticated: Boolean(accessToken && refreshToken),
          isHydrated: true,
        });
      },
      login: async (walletAddress: string, signature: string) => {
        set({ isLoading: true });

        const timezone = getCalendars()[0]?.timeZone?.toString() || "UTC";
        const { data, success } = await loginApi({
          walletAddress,
          signature,
          timezone,
        });

        if (success && data) {
          const { user, accessToken, refreshToken } = data;

          if (accessToken) {
            setItem("accessToken", accessToken);
          }
          if (refreshToken) {
            setItem("refreshToken", refreshToken);
          }

          set({
            isAuthenticated: true,
            isLoading: false,
            user,
            accessToken: accessToken ?? null,
            refreshToken: refreshToken ?? null,
          });

          return true;
        }

        set({
          isAuthenticated: false,
          isLoading: false,
        });

        return false;
      },

      logout: () => {
        deleteItem("accessToken");
        deleteItem("refreshToken");

        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          publicKey: null,
        });
      },
      setPublicKey: (publicKey: PublicKey | null) => {
        set({ publicKey: publicKey });
      },
    }),
    {
      name: "itsu-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
