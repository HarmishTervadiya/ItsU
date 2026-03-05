import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingState {
  hasSeenOnboarding: boolean;
  isHydrated: boolean;

  hydrate: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void; 
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      isHydrated: false,

      hydrate: () => {
        set({ isHydrated: true });
      },

      completeOnboarding: () => {
        set({ hasSeenOnboarding: true });
      },

      resetOnboarding: () => {
        set({ hasSeenOnboarding: false });
      },
    }),
    {
      name: "itsu-onboarding-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrate();
        }
      },
    },
  ),
);
