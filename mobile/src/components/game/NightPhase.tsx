import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { EyeOff, Target } from 'lucide-react-native';
import { useGameStore } from '@/src/stores/gameStore';

interface NightPhaseProps {
    alivePlayers: { id: string; name: string; color: string; isMe: boolean }[];
    myPlayer: any;
}

export const NightPhase: React.FC<NightPhaseProps> = ({ alivePlayers, myPlayer }) => {
    const { game, executeKill } = useGameStore();

    const handleKill = (targetId: string) => {
        if (game?.id) executeKill(game.id, targetId);
    };

    return (
        <View className="absolute inset-0 z-40" pointerEvents="box-none">
            {/* Night overlay visual */}
            <View className="absolute inset-0 bg-[#0a0a20]/80" pointerEvents="none" />

            {/* Night Title */}
            <View className="absolute top-[50%] left-0 right-0 items-center" pointerEvents="none">
                <EyeOff size={48} color="#6D28D9" />
                <Text className="text-2xl font-black text-primary uppercase tracking-widest mt-2">Night</Text>
                <Text className="text-slate-500 text-xs font-bold mt-1">
                    {myPlayer?.role === 'WOLF' ? 'Choose your target...' : 'The wolf is hunting...'}
                </Text>
            </View>

            {/* Wolf Target Selection */}
            {myPlayer?.role === 'WOLF' && (
                <View className="absolute bottom-0 inset-x-0" pointerEvents="auto">
                    <View className="mx-3 mb-3 bg-red-950/90 border-4 border-red-900/60 rounded-3xl p-4">
                        <View className="flex-row items-center justify-center gap-2 mb-3">
                            <Target size={18} color="#f87171" />
                            <Text className="text-red-400 font-black uppercase tracking-widest text-xs">Select Target</Text>
                        </View>
                        <View className="flex-row justify-center gap-2 flex-wrap">
                            {alivePlayers.filter(p => !p.isMe).map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    onPress={() => handleKill(p.id)}
                                    activeOpacity={0.7}
                                    className="bg-[#12121A] border-2 border-red-900/40 rounded-xl px-4 py-2.5 flex-col items-center gap-1"
                                >
                                    <View className="w-5 h-5 rounded-full border-2 border-[#12121A]" style={{ backgroundColor: p.color }} />
                                    <Text className="text-[10px] font-black text-white">{p.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};
