import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

type AnimationType = 'pulse' | 'ping' | 'none';

interface StarProps {
    className?: string; 
    color?: string; // Hex color for the star
    defaultOpacity?: number;
    animation?: AnimationType;
}

const Star = ({
    className = '',
    color = '#ffffff',
    defaultOpacity = 1,
    animation = 'none',
}: StarProps) => {
    const opacity = useSharedValue(animation === 'pulse' ? defaultOpacity * 0.5 : defaultOpacity);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (animation === 'pulse') {
            // Pulse animation: fade opacity in and out continuously
            opacity.value = withRepeat(
                withSequence(
                    withTiming(defaultOpacity, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(defaultOpacity * 0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1, // Infinite repeat
                true // Reverse direction on each cycle for a smooth pulse
            );
        } else if (animation === 'ping') {
            // Ping animation: scale up and fade opacity down like a radar wave
            scale.value = withRepeat(
                withTiming(2.5, { duration: 2000, easing: Easing.out(Easing.ease) }),
                -1, // Infinite repeat
                false // Do not reverse, jump back to scale 1
            );
            // Simultaneously fade out while scaling up
            opacity.value = withRepeat(
                withSequence(
                    withTiming(defaultOpacity, { duration: 0 }), // instantly set back to default
                    withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }) // fade out
                ),
                -1,
                false
            );
        }
    }, [animation, defaultOpacity, opacity, scale]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <Animated.View
            className={`absolute rounded-full ${className}`}
            style={[
                { backgroundColor: color },
                animatedStyle,
            ]}
        />
    );
};

export const StarField = () => {
    // Use hex values matching tailwind configuration. 
    const primaryHex = '#8B5CF6';
    const accentHex = '#D946EF';

    return (
        <View
            className="absolute top-0 bottom-0 left-0 right-0 overflow-hidden"
            pointerEvents="none"
        >
            {/* Stars Layer */}
            <Star
                className="top-10 left-10 w-2 h-2"
                color="#ffffff"
                defaultOpacity={0.5}
                animation="pulse"
            />

            <Star
                className="top-40 right-20 w-1 h-1"
                color={primaryHex}
                defaultOpacity={0.7}
                animation="ping"
            />

            <Star
                className="bottom-32 left-1/4 w-1.5 h-1.5"
                color={accentHex}
                defaultOpacity={0.6}
                animation="none"
            />

            <Star
                className="top-1/2 right-10 w-1 h-1"
                color="#ffffff"
                defaultOpacity={0.4}
                animation="none"
            />

            {/* Floating Dust Vignette using react-native-svg */}
            <View className="absolute top-0 bottom-0 left-0 right-0" pointerEvents="none">
                <Svg height="100%" width="100%">
                    <Defs>
                        <RadialGradient
                            id="vignette-grad"
                            cx="50%"
                            cy="50%"
                            rx="50%"
                            ry="50%"
                            fx="50%"
                            fy="50%"
                        >
                            <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
                            <Stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
                        </RadialGradient>
                    </Defs>
                    {/* Fill the entire screen with the gradient */}
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#vignette-grad)" />
                </Svg>
            </View>
        </View>
    );
};

export default StarField;
