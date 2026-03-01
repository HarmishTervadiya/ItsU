import React from "react";
import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StarField from "@/src/components/StarField";
import GameButton from "@/src/components/GameButton";
import { Ghost, Wallet } from "lucide-react-native";
import AppIcon from "@/src/assets/images/icons/eye-icon.png";
import { useWallet } from "@/src/hooks/useWallet";
import ToastManager from "toastify-react-native";

export default function LoginScreen() {
  const { signInWithSolana, connecting } = useWallet();

  const primaryHex = "#8B5CF6";
  const accentHex = "#D946EF";

  const handleSignIn = () => {
    console.log("Connect Wallet Pressed");
    signInWithSolana();
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 items-center justify-center p-6 relative overflow-hidden">
        {/* Background Animation */}
        <StarField />

        <View className="relative z-10 flex-col items-center gap-6 mb-4 w-full">
          <Image source={AppIcon} className="h-40 w-40 animate-pulse" />

          <View className="items-center mt-4">
            {/* 3D "ITSU" Text Effect using Stacked Text */}
            <View className="relative items-center justify-center">
              <Text
                className="text-6xl font-black absolute top-[4px] left-[4px]"
                style={{ color: `${primaryHex}80` }}
              >
                ITSU
              </Text>

              <Text
                className="text-6xl font-black text-white"
                style={{
                  textShadowColor: "black",
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2,
                }}
              >
                ITSU
              </Text>
            </View>

            <View
              className="w-full px-3 py-1 rounded-full border-2 border-black rotate-[-3deg] shadow-lg mt-2"
              style={{ backgroundColor: accentHex }}
            >
              <Text className="text-white text-xs font-bold uppercase text-center">
                TRUST NO ONE
              </Text>
            </View>
          </View>
        </View>

        <View className="w-full max-w-xs space-y-4 relative z-10 mt-10 items-center">
          <View className="bg-[#232338] p-2 rounded-3xl w-full mb-4">
            <GameButton
              onPress={handleSignIn}
              icon={<Wallet color="#ffffff" size={24} strokeWidth={3} />}
              loading={connecting}
            >
              Connect Wallet
            </GameButton>
          </View>
        </View>
      </View>

      <View className="absolute -bottom-10 -right-10 opacity-20 rotate-12 animate-pulse">
        <Ghost size={200} color={"#6D28D9"} />
      </View>
      <ToastManager />
    </SafeAreaView>
  );
}

