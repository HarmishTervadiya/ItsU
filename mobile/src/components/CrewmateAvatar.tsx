import React from "react";
import { View } from "react-native";

interface CrewmateAvatarProps {
    className?: string;
    themeColor?: string;
}

export const CrewmateAvatar = ({
    className = "",
}: CrewmateAvatarProps) => {
    return (
        <View className={`relative ${className}`}>
            <View
                className="w-12 h-12 rounded-full border-4 border-black relative overflow-hidden bg-primary"
                style={{
                    elevation: 5, // Android shadow
                    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 // iOS shadow
                }}
            >
                {/* Visor */}
                <View className="absolute top-2 right-1 w-8 h-5 bg-cyan-300 rounded-full border-2 border-black" />
                <View className="absolute top-3 right-3 w-3 h-1.5 bg-white rounded-full opacity-80" />
            </View>
        </View>
    );
};

export default CrewmateAvatar;
