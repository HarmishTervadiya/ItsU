import { create } from "zustand";
import { GameState } from "~/shared/types/game";
import { Socket, io } from "socket.io-client";
import { config } from "../config";

interface GameStoreState {
  game: GameState | null;
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;

  connectToGame: (gameId: string, userId: string) => void;
  disconnect: () => void;
  clearError: () => void;
  sendChat: (gameId: string, message: string) => void;
  submitVote: (gameId: string, targetId: string) => void;
  executeKill: (gameId: string, targetId: string) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  game: null,
  socket: null,
  isConnected: false,
  error: null,

  clearError: () => set({ error: null }),

  connectToGame: (gameId: string, userId: string) => {
    // Disconnect existing socket if any
    if (get().socket) {
      get().socket?.disconnect();
    }

    // Initialize socket connection using the config's SERVER_URL
    const socket = io(config.SERVER_URL, {
      transports: ["websocket"],
      // Allow infinite reconnects for mobile app backgrounding
      reconnectionAttempts: Infinity,
    });

    socket.on("connect", () => {
      set({ isConnected: true, socket });
      // Join the specific game room
      socket.emit("joinGame", { gameId, userId });
    });

    // Listen for state updates broadcasted from the backend
    socket.on("gameStateUpdated", (state: any) => {
      // Backend serializes potAmount as string because socket.io can't handle BigInt
      if (state && typeof state.potAmount === "string") {
        state.potAmount = BigInt(state.potAmount);
      }
      set({ game: state as GameState });
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
    });

    socket.on("gameNotFound", () => {
      set({ error: "Game session lost or finished.", isConnected: false });
    });

    set({ socket, error: null });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, game: null });
    }
  },

  sendChat: (gameId: string, message: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit("sendChat", { gameId, message });
    }
  },

  submitVote: (gameId: string, targetId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit("submitVote", { gameId, targetId });
    }
  },

  executeKill: (gameId: string, targetId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit("wolfKill", { gameId, targetId });
    }
  },
}));
