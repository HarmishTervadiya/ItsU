import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { Ghost, Wallet, Shield } from "lucide-react-native";
import { router } from "expo-router";
import StarField from "@/src/components/StarField";
import GameButton from "@/src/components/GameButton";
import { onboardingStore } from "@/src/stores/onboardingStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ONBOARDING_DATA = [
  {
    id: "1",
    title: "Trust No One",
    description:
      "In ITSU, deception is your strongest weapon. Work together to survive, or betray everyone for the ultimate prize.",
    Icon: Ghost,
  },
  {
    id: "2",
    title: "Stake Your Claim",
    description:
      "Connect your wallet and stake SOL to enter the arena. The survivors split the entire pool.",
    Icon: Wallet,
  },
  {
    id: "3",
    title: "Survive the Night",
    description:
      "Chat with players, cast your votes, and stay alive until the sun rises to claim your winnings.",
    Icon: Shield,
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const completeOnboarding = onboardingStore((s) => s.completeOnboarding);
  const scrollX = useSharedValue(0);

  const flatListRef = useRef<FlatList>(null);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleFinish = () => {
    completeOnboarding();
    if (router.canDismiss()) router.dismissAll();
    router.replace("/auth/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-black relative">
      <View className="absolute inset-0">
        <StarField />
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <OnboardingItem
            item={item}
            index={index}
            scrollX={scrollX}
            width={width}
          />
        )}
      />

      <View className="absolute bottom-12 left-0 right-0 items-center px-6">
        <Paginator scrollX={scrollX} />

        <View className="w-full mt-8 max-w-xs space-y-4">
          <View className="bg-[#232338] p-2 rounded-3xl w-full">
            <GameButton
              onPress={handleFinish}
              // Only animate to full opacity/text on last slide, but allow skip anytime
            >
              {currentIndex === ONBOARDING_DATA.length - 1
                ? "Get Started"
                : "Skip"}
            </GameButton>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function OnboardingItem({ item, index, scrollX, width }: any) {
  const rStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.8, 1, 0.8],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.5, 1, 0.5],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View
      style={[{ width }]}
      className="flex-1 items-center justify-center p-6 pb-40"
    >
      <Animated.View style={[rStyle]} className="items-center">
        <View className="w-48 h-48 rounded-full bg-[#8B5CF6]/20 items-center justify-center mb-10 border border-[#D946EF]/30 shadow-[#D946EF]">
          <item.Icon size={100} color="#D946EF" strokeWidth={1.5} />
        </View>

        <Text className="text-4xl text-white font-black text-center mb-4 tracking-wider">
          {item.title}
        </Text>

        <Text className="text-[#a0a0c0] text-center text-lg leading-7 px-4">
          {item.description}
        </Text>
      </Animated.View>
    </View>
  );
}

function Paginator({ scrollX }: any) {
  return (
    <View className="flex-row h-4 justify-center items-center gap-2">
      {ONBOARDING_DATA.map((_, i) => {
        const rDotStyle = useAnimatedStyle(() => {
          const w = interpolate(
            scrollX.value,
            [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
            [10, 24, 10],
            Extrapolation.CLAMP,
          );

          const opacity = interpolate(
            scrollX.value,
            [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
            [0.3, 1, 0.3],
            Extrapolation.CLAMP,
          );

          return {
            width: w,
            opacity,
          };
        });

        return (
          <Animated.View
            key={i.toString()}
            style={[rDotStyle]}
            className="h-[10px] rounded-full bg-[#8B5CF6]"
          />
        );
      })}
    </View>
  );
}
