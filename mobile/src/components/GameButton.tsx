import React from "react";
import { Pressable, Text, View } from "react-native";

interface GameButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "accent";
  className?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const GameButton = ({
  children,
  onPress,
  variant = "primary",
  className = "",
  icon,
  fullWidth = true,
}: GameButtonProps) => {
  const isAccent = variant === "accent";

  const bgColorClass = isAccent ? "bg-accent" : "bg-primary";
  const borderColorClass = isAccent
    ? "border-accent-border"
    : "border-primary-border";

  return (
    <Pressable
      onPress={onPress}
      className={`
        ${fullWidth ? "w-full" : "self-start"} 
        ${className}
      `}
    >
      {({ pressed }) => (
        <View
          className={`
            flex-row items-center justify-center gap-3
            rounded-2xl px-6 py-4
            ${bgColorClass}
            ${borderColorClass}
            ${pressed ? "border-b-[2px] translate-y-1" : "border-b-[6px]"}
          `}
        >
          {icon && <View>{icon}</View>}
          <Text className="text-white uppercase tracking-wider text-lg font-bold">
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

export default GameButton;
