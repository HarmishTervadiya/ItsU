import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Map as MapIcon, Skull, LogOut } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGameStore } from "@/src/stores/gameStore";
import { useAuthStore } from "@/src/stores/authStore";
import StarField from "@/src/components/StarField";

import { ChatPhase } from "@/src/components/game/ChatPhase";
import { VotePhase } from "@/src/components/game/VotePhase";
import { NightPhase } from "@/src/components/game/NightPhase";
import { RevealPhase } from "@/src/components/game/RevealPhase";
import { FinishedPhase } from "@/src/components/game/FinishedPhase";
import ConfirmationModal from "@/src/components/ConfirmationModal";

export default function GameScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const { user } = useAuthStore();
  const { game, connectToGame, disconnect, isConnected, error, clearError } =
    useGameStore();

  useEffect(() => {
    if (id && user?.id) {
      connectToGame(id as string, user.id);
    }
    return () => {
      disconnect();
    };
  }, [id, user?.id]);

  const players = React.useMemo(() => {
    if (!game) return [];
    const colors = [
      "#8B5CF6",
      "#06B6D4",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#D946EF",
    ];
    return game.players.map((p, idx) => ({
      id: p.playerId,
      name:
        p.displayName ||
        (p.playerId === user?.id ? user?.name || "ME" : `PLAYER_${idx + 1}`),
      color: colors[idx % colors.length],
      role: p.role,
      isAlive: !p.isDead,
      isMe: p.playerId === user?.id,
    }));
  }, [game, user?.id, user?.name]);

  const myPlayer = players.find((p) => p.isMe);
  const alivePlayers = players.filter((p) => p.isAlive);
  const wolfPlayer = players.find((p) => p.role === "WOLF");

  const [isRevealing, setIsRevealing] = useState(true);
  const [recentlyKilled, setRecentlyKilled] = useState<any>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    if (
      game?.status === "LOBBY" ||
      (game?.status === "CHAT_PHASE" && isRevealing)
    ) {
      const timer = setTimeout(() => setIsRevealing(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setIsRevealing(false);
    }
  }, [game?.status]);

  const phaseMap: Record<string, string> = {
    CHAT_PHASE: "CHAT",
    NIGHT_PHASE: "NIGHT",
    VOTE_PHASE: "VOTE",
    FINISHED: "FINISHED",
  };

  const phase = isRevealing
    ? "REVEAL"
    : phaseMap[game?.status as string] || "REVEAL";

  const onLeaveGame = () => {
    if (game?.status === "FINISHED") {
      handleConfirmLeave();
    } else {
      setShowLeaveConfirm(true);
    }
  };

  const handleConfirmLeave = () => {
    disconnect();
    router.replace("/game");
  };

  const [timeLeft, setTimeLeft] = useState(0);

  const aliveCountRef = React.useRef(alivePlayers);
  const fullScreenFlashAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Trigger full screen flash and overlay if a player dies
    if (
      alivePlayers.length < aliveCountRef.current.length &&
      game?.status !== "LOBBY" &&
      game?.status !== "FINISHED"
    ) {
      const previousAliveIds = new Set(aliveCountRef.current.map((p) => p.id));
      const deadPlayer = aliveCountRef.current.find(
        (p) => !alivePlayers.some((ap) => ap.id === p.id),
      );

      if (deadPlayer) {
        setRecentlyKilled(deadPlayer);
        Animated.sequence([
          Animated.timing(fullScreenFlashAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(fullScreenFlashAnim, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]).start(() => setRecentlyKilled(null));
      }
    }
    aliveCountRef.current = alivePlayers;
  }, [alivePlayers, game?.status]);

  useEffect(() => {
    if (!game?.phaseEndTime) return;

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.floor((game.phaseEndTime - Date.now()) / 1000),
      );
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [game?.phaseEndTime]);

  if (!game) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="w-full text-center text-white font-bold text-lg">
          {error ? error : "Connecting to Game..."}
        </Text>
        {error && (
          <TouchableOpacity
            onPress={() => {
              clearError();
              router.replace("/game");
            }}
            className="w-56 mt-6 bg-primary border-4 border-[#12121A] rounded-2xl px-8 py-3 shadow-[4px_4px_0_0_black]"
          >
            <Text className="w-full text-center text-white font-black uppercase text-sm">
              Back to Lobby
            </Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  const phaseLabelMap: Record<string, string> = {
    CHAT: "💬 DISCUSSION",
    VOTE: "🗳️ VOTING",
    NIGHT: "🌙 NIGHT",
    REVEAL: "👁️ REVEAL",
    FINISHED: "🏆 FINISHED",
  };

  const phaseLabel = phaseLabelMap[phase] || "";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 relative overflow-hidden rounded-[32px] border-4 border-[#12121A] m-2 bg-panel">
        {/* Background Animation */}
        <StarField />

        {/* Dark overlay for contrast */}
        <View className="absolute inset-0 bg-black/30" pointerEvents="none" />

        {/* Header HUD */}
        <View className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 pb-2">
          <View className="w-full flex-row justify-between items-center">
            {/* Left: Leave + Timer */}
            <View className="flex-col gap-2">
              <TouchableOpacity
                className="bg-panel border-4 border-[#12121A] p-2.5 rounded-2xl shadow-[2px_2px_0_0_black]"
                onPress={onLeaveGame}
                activeOpacity={0.7}
              >
                <LogOut size={20} color="#D946EF" strokeWidth={3} />
              </TouchableOpacity>
              {phase !== "FINISHED" && phase !== "REVEAL" && timeLeft > 0 && (
                <View className="bg-[#12121A] border-2 border-primary/50 px-3 py-1.5 rounded-xl self-start">
                  <Text className="w-full text-center text-primary font-bold font-mono text-sm">
                    {timeLeft}s
                  </Text>
                </View>
              )}
            </View>

            {/* Center: Phase label */}
            <View className="bg-[#12121A]/90 border-2 border-primary/30 px-4 py-2 rounded-2xl">
              <Text className="w-full text-center text-white font-black text-xs uppercase tracking-widest">
                {phaseLabel}
              </Text>
            </View>

            {/* Right: Alive count + Connection */}
            <View className="flex-col items-end gap-2">
              <View className="bg-panel border-4 border-[#12121A] px-4 py-2 rounded-2xl flex-row items-center gap-2 shadow-[2px_2px_0_0_black]">
                <View className="w-2 h-2 rounded-full bg-green-400" />
                <Text className="text-center font-black text-white text-sm">
                  {alivePlayers.length}/{players.length}
                </Text>
              </View>
              {!isConnected && (
                <View className="bg-red-500/80 px-2 py-1 rounded-md">
                  <Text className="w-full text-center text-white text-[10px] font-bold">
                    Disconnected
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Players View — positioned in top half, pointer-events none so buttons below work */}
        <View
          className="absolute top-16 left-0 right-0 h-[45%] z-10"
          pointerEvents="none"
        >
          {players.map((player, index) => (
            <PlayerCharacter
              key={player.id}
              player={player}
              position={getPlayerPosition(index, players.length)}
              isDead={!player.isAlive}
            />
          ))}
        </View>

        {/* Phase Content — below characters, fully interactive */}
        <View className="absolute inset-0 z-20" pointerEvents="box-none">
          {phase === "REVEAL" && <RevealPhase myPlayer={myPlayer} />}
          {phase === "CHAT" && <ChatPhase players={players} />}
          {phase === "NIGHT" && (
            <NightPhase alivePlayers={alivePlayers} myPlayer={myPlayer} />
          )}
          {phase === "VOTE" && (
            <VotePhase alivePlayers={alivePlayers} players={players} />
          )}
          {phase === "FINISHED" && (
            <FinishedPhase
              onLeaveGame={onLeaveGame}
              winnerRole={game.winnerRole}
              wolfName={wolfPlayer?.name}
            />
          )}
        </View>

        {/* Dead Player Spectator Overlay */}
        {myPlayer && !myPlayer.isAlive && phase !== "FINISHED" && (
          <View className="absolute inset-x-0 top-0 h-[60%] bg-black/85 z-50 items-center justify-center p-8 rounded-t-[32px] border-t-4 border-red-900/60">
            <Skull size={56} color="#fca5a5" />
            <Text className="w-full text-center text-3xl font-black text-red-500 uppercase tracking-widest mt-4 mb-2">
              You Died
            </Text>
            <Text className="w-full text-center text-slate-400 font-bold leading-5 text-sm">
              You are now a spectator.{"\n"}Watch the crew fight for survival.
            </Text>
            <TouchableOpacity
              onPress={onLeaveGame}
              className="mt-6 bg-panel border-2 border-red-900/50 rounded-xl px-6 py-3"
            >
              <Text className="text-white font-black text-sm uppercase">
                Leave Game
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Full Screen Kill Flash & UI */}
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0 z-[60] bg-red-800/90 items-center justify-center"
          style={{ opacity: fullScreenFlashAnim }}
        >
          {recentlyKilled && (
            <View className="w-full items-center mt-[-60px]">
              <View
                className="w-24 h-24 rounded-full border-4 border-[#12121A] items-center justify-center shadow-lg"
                style={{ backgroundColor: recentlyKilled.color || "#450a0a" }}
              >
                <Skull size={48} color="#12121A" />
              </View>
              <Text className="w-full text-center text-white font-black text-3xl uppercase tracking-widest mt-6 drop-shadow-lg">
                {recentlyKilled.name}
              </Text>
              <Text className="w-full text-center text-red-300 font-bold text-lg mt-2 uppercase tracking-wide">
                Was Eliminated
              </Text>
            </View>
          )}
        </Animated.View>

        <ConfirmationModal
          isOpen={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          onConfirm={() => {
            setShowLeaveConfirm(false);
            handleConfirmLeave();
          }}
          title="Leave Game"
          message={
            myPlayer?.isAlive
              ? "Are you sure you want to leave? Abandoning an active mission may result in the loss of your staked funds!"
              : "Are you sure you want to leave the match?"
          }
          confirmText="Leave"
          cancelText="Remain"
          type={myPlayer?.isAlive ? "warning" : "info"}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * Positions characters in a tight arc across the top-center of the game board.
 * This keeps them well above the chat/vote/night panels at the bottom.
 */
const getPlayerPosition = (index: number, total: number) => {
  // Spread players in a semicircle arc at the top portion
  const startAngle = Math.PI * 0.05; // slight offset from left
  const endAngle = Math.PI * 0.75; // slight offset from right
  const angle =
    startAngle + (index / (total - 1 || 1)) * (endAngle - startAngle);

  const centerX = 50;
  const centerY = 55;
  const radiusX = 35; // horizontal spread
  const radiusY = 35; // vertical spread

  const x = centerX - radiusX * Math.cos(angle); // left to right
  const y = centerY - radiusY * Math.sin(angle); // arc upward

  return { left: `${x}%`, top: `${y}%` };
};

const PlayerCharacter = ({
  player,
  position,
  isDead,
}: {
  player: any;
  position: any;
  isDead: boolean;
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const shakeAnim = React.useRef(new Animated.Value(0)).current;
  const skullScaleAnim = React.useRef(new Animated.Value(3)).current;
  const skullOpacityAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(
    new Animated.Value(isDead ? 0.4 : 1),
  ).current;

  const wasDead = React.useRef(isDead);

  useEffect(() => {
    if (isDead && !wasDead.current) {
      wasDead.current = true;

      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        Animated.parallel([
          Animated.spring(skullScaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(skullOpacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (isDead && wasDead.current) {
      opacityAnim.setValue(0.4);
      scaleAnim.setValue(0.8);
      skullScaleAnim.setValue(1);
      skullOpacityAnim.setValue(1);
    }
  }, [isDead]);

  return (
    <Animated.View
      className="absolute -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{
        left: position.left,
        top: position.top,
        transform: [{ translateX: shakeAnim }, { scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <View
        className={`mb-1 px-2 py-0.5 rounded-md border border-white/10 ${isDead ? "bg-red-900/80" : "bg-[#12121A]/80"}`}
      >
        <Text
          className={`text-[9px] font-black tracking-wider uppercase ${isDead ? "text-red-300 line-through" : "text-white"}`}
        >
          {player.name}
        </Text>
      </View>

      <View
        className={`w-12 h-14 rounded-[20px] border-[3px] border-[#12121A] relative ${isDead ? "mt-4" : ""}`}
        style={{ backgroundColor: player.color }}
      >
        {!isDead && (
          <>
            <View className="absolute top-1.5 -right-1.5 w-6 h-4 bg-cyan-300 rounded-full border-[2px] border-[#12121A]" />
            <View className="absolute top-2 right-0 w-2 h-1 bg-white rounded-full opacity-80" />
            <View className="absolute top-2.5 -left-2 w-3 h-6 border-[3px] border-r-0 border-[#12121A] rounded-l-lg -z-10 bg-black/20" />
            <View className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-black/40 rounded-full" />
          </>
        )}
        {isDead && (
          <Animated.View
            className="absolute inset-0 items-center justify-center bg-red-900/40 rounded-[17px]"
            style={{
              opacity: skullOpacityAnim,
              transform: [{ scale: skullScaleAnim }],
            }}
          >
            <Skull size={28} color="#450a0a" />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};
