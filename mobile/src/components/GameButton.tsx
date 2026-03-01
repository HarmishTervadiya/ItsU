import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

interface GameButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "accent";
  className?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export const GameButton = ({
  children,
  onPress,
  variant = "primary",
  className = "",
  icon,
  fullWidth = true,
  loading = false,
  disabled = false,
}: GameButtonProps) => {
  const isAccent = variant === "accent";

  const bgColorClass = isAccent ? "bg-accent" : "bg-primary";
  const borderColorClass = isAccent
    ? "border-accent-border"
    : "border-primary-border";

  // Reanimated shared value — updates on UI thread, NO React re-render.
  // This prevents the navigation context crash when Android fires
  // touch events after returning from the wallet app's Activity.
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * 4 }],
    borderBottomWidth: 6 - pressed.value * 4,
  }));

  const tap = Gesture.Tap()
    .onBegin(() => {
      "worklet";
      pressed.value = withTiming(1, { duration: 50 });
    })
    .onFinalize(() => {
      "worklet";
      pressed.value = withTiming(0, { duration: 100 });
    })
    .onEnd(() => {
      "worklet";
      if (onPress && !disabled && !loading) {
        runOnJS(onPress)();
      }
    })
    .enabled(!disabled && !loading);

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        className={`
          ${fullWidth ? "w-full" : "self-start"} 
          ${className}
        `}
      >
        <Animated.View
          className={`
            flex-row items-center justify-center gap-3
            rounded-2xl px-6 py-4
            ${bgColorClass}
            ${borderColorClass}
            ${disabled || loading ? "opacity-60" : ""}
          `}
          style={animatedStyle}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            icon && <View>{icon}</View>
          )}
          <Text className="text-white uppercase tracking-wider text-lg font-bold">
            {children}
          </Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

export default GameButton;
