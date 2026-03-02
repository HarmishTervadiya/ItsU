import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Trophy } from 'lucide-react-native';

interface FinishedPhaseProps {
    onLeaveGame: () => void;
    winnerRole?: "WOLF" | "CITIZEN";
    wolfName?: string;
}

export const FinishedPhase: React.FC<FinishedPhaseProps> = ({ onLeaveGame, winnerRole, wolfName }) => {
    return (
        <View className="absolute inset-0 z-50 bg-[#0a0a10]/95 flex-col items-center justify-center" pointerEvents="box-none">
            <View className="w-24 h-24 bg-yellow-500/20 rounded-full items-center justify-center mb-6 border-2 border-yellow-500/30">
                <Trophy size={56} color="#FACC15" />
            </View>

            <Text className="text-3xl font-black text-white tracking-widest uppercase text-center mb-2">
                Game Over
            </Text>

            {winnerRole && (
                <Text className={`text-xl font-black uppercase tracking-widest text-center mb-2 ${winnerRole === 'WOLF' ? 'text-red-500' : 'text-primary'}`}>
                    {winnerRole}S WIN
                </Text>
            )}

            {wolfName && (
                <Text className="text-lg font-bold text-red-400 text-center mb-4">
                    The Wolf was: {wolfName}
                </Text>
            )}

            <Text className="text-slate-400 text-sm font-bold text-center mb-8">The battle has ended.</Text>

            <TouchableOpacity
                onPress={onLeaveGame}
                activeOpacity={0.7}
                className="bg-primary border-4 border-[#12121A] rounded-2xl px-8 py-3 shadow-[4px_4px_0_0_black]"
                style={{ pointerEvents: 'auto' }}
            >
                <Text className="text-sm font-black text-white uppercase tracking-widest text-center">Return to Lobby</Text>
            </TouchableOpacity>
        </View>
    );
};
