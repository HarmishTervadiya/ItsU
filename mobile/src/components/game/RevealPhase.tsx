import React from 'react';
import { View, Text } from 'react-native';
import { Shield, Skull as WolfIcon } from 'lucide-react-native';
import { useGameStore } from '@/src/stores/gameStore';

interface RevealPhaseProps {
    myPlayer: any;
}

export const RevealPhase: React.FC<RevealPhaseProps> = ({ myPlayer }) => {
    const { game } = useGameStore();

    const isWolf = myPlayer?.role === 'WOLF';

    return (
        <View className="absolute inset-0 z-40 bg-black/85 flex-col items-center justify-center px-8" pointerEvents="none">
            {/* Role Icon */}
            <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${isWolf ? 'bg-red-900/40 border-2 border-red-500/40' : 'bg-primary/20 border-2 border-primary/40'}`}>
                {isWolf ? <WolfIcon size={40} color="#f87171" /> : <Shield size={40} color="#8B5CF6" />}
            </View>

            <Text className="text-xs font-black text-slate-500 tracking-[6px] uppercase mb-1">Your Role</Text>
            <Text className={`text-5xl font-black uppercase ${isWolf ? 'text-red-500' : 'text-primary'}`}>
                {myPlayer?.role}
            </Text>

            <View className="mt-6 bg-panel border-2 border-[#12121A] p-4 rounded-2xl max-w-[85%] items-center">
                <Text className="text-xl font-bold text-white text-center leading-5">
                    {isWolf
                        ? `🐺 Hunt the citizens.\nYour clue: "${game?.hint}"`
                        : `🛡️ Find the Wolf.\nThe secret item: "${game?.item}"`
                    }
                </Text>
            </View>

            <Text className="text-[10px] text-slate-500 font-bold mt-4 tracking-widest uppercase">Game starting shortly...</Text>
        </View>
    );
};
