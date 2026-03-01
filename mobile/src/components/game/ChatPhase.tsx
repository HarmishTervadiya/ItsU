import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MessageSquare, Send } from 'lucide-react-native';
import { useGameStore } from '@/src/stores/gameStore';

interface ChatPhaseProps {
    players: { id: string; name: string; color: string; isMe: boolean }[];
}

export const ChatPhase: React.FC<ChatPhaseProps> = ({ players }) => {
    const { game, sendChat } = useGameStore();
    const [chatMsg, setChatMsg] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

    const handleSendChat = () => {
        if (!chatMsg.trim() || !game?.id) return;
        sendChat(game.id, chatMsg.trim());
        setChatMsg('');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 40}
            className="absolute inset-x-0 bottom-0 z-40"
            pointerEvents="box-none"
        >
            <View className="mx-3 mb-3" pointerEvents="auto">
                {/* Tab Label */}
                <View className="absolute -top-5 left-1/2 -translate-x-[60px] bg-primary px-4 py-1 rounded-full border-2 border-[#12121A] flex-row items-center gap-2 z-10 w-[120px] justify-center shadow-lg">
                    <MessageSquare size={14} color="white" />
                    <Text className="text-white font-black uppercase text-[10px]">Chat</Text>
                </View>

                <View className="bg-panel border-4 border-[#12121A] rounded-3xl p-3 pt-5">
                    {/* Messages */}
                    <ScrollView
                        className="h-40 mb-2"
                        ref={scrollViewRef}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={false}
                    >
                        {(!game?.chat || game.chat.length === 0) && (
                            <Text className="text-slate-500 text-xs text-center mt-8">No messages yet. Say something!</Text>
                        )}
                        {game?.chat?.map((msg, i) => {
                            const sender = players.find(p => p.id === msg.senderId);
                            return (
                                <View key={i} className="mb-1.5 flex-row flex-wrap">
                                    <Text className="text-xs font-black" style={{ color: sender?.color || '#8B5CF6' }}>{sender?.name || 'Unknown'}: </Text>
                                    <Text className="text-xs text-white/90 flex-shrink">{msg.text}</Text>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {/* Input */}
                    <View className="flex-row gap-2">
                        <TextInput
                            placeholder="Type message..."
                            placeholderTextColor="#64748b"
                            className="flex-1 bg-background border-2 border-primary/30 rounded-xl px-3 py-2 text-sm text-white h-11"
                            value={chatMsg}
                            onChangeText={setChatMsg}
                            onSubmitEditing={handleSendChat}
                            returnKeyType="send"
                        />
                        <TouchableOpacity
                            className="bg-primary w-11 h-11 rounded-xl border-2 border-[#12121A] items-center justify-center shadow-[2px_2px_0_0_black]"
                            onPress={handleSendChat}
                            activeOpacity={0.7}
                        >
                            <Send size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};
