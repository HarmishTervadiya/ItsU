import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { config } from "./config";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import gamesRouter from "./routes/games.routes";
import transactionsRouter from "./routes/transactions.routes";
import { matchMaker } from "./workers/matchmaker";
import { logger } from "./utils/logger";
import { gameManager } from "./state/gameStore";
import { BotEngine } from "./workers/botEngine";
import http from "http";
import { Server } from "socket.io";
import { prisma } from "@itsu/shared/src/lib/prisma";

const app = express();
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

matchMaker();

gameManager.onStateChange = (gameId, state) => {
  const serializedState = {
    ...state,
    potAmount: state.potAmount.toString(),
  };

  io.to(gameId).emit("gameStateUpdated", serializedState);
};

io.on("connection", async (socket) => {
  logger.debug(`New client connected: ${socket.id}`);

  // Users connect globally to receive matchmaking events before joining a specific game
  socket.on("joinLobby", ({ userId }) => {
    socket.join(`lobby_${userId}`);
    socket.data.userId = userId;
    logger.debug(`User ${userId} joined their lobby channel`);
  });

  // Any new user joins the game
  socket.on("joinGame", ({ gameId, userId }) => {
    socket.join(gameId);

    // Also remove them from their lobby channel since they're in a game now
    socket.leave(`lobby_${userId}`);

    socket.data.userId = userId;
    socket.data.gameId = gameId;
    logger.debug(`User ${userId} joined room ${gameId}`);

    gameManager.handlePlayerReconnect(gameId, userId);

    const currentState = gameManager.getGame(gameId);
    if (currentState) {
      const serializedState = {
        ...currentState,
        potAmount: currentState.potAmount.toString(),
      };
      socket.emit("gameStateUpdated", serializedState);
    } else {
      socket.emit("gameNotFound");
    }
  });

  // Users join the matchmaking queue
  socket.on("joinQueueTest", async ({ userId }, callback) => {
    try {
      if (!userId) {
        if (callback) callback({ success: false, error: "User ID required" });
        return;
      }

      logger.debug(
        { userId },
        "[Join Queue TEST] Pushing user to queue via WebSockets",
      );

      const existing = await prisma.queueEntry.findUnique({
        where: { userId },
      });

      if (existing) {
        if (callback)
          callback({ success: false, error: "User is already in the queue" });
        return;
      }

      await prisma.queueEntry.create({
        data: {
          userId,
          currency: "SOL",
          intent: "PENDING",
        },
      });

      logger.debug(
        { userId },
        "[Join Queue TEST] Successfully created new queue entry via WebSockets",
      );

      const { startMatchMaker } = require("./workers/matchmaker");
      startMatchMaker();

      if (callback) callback({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Error joining queue via WebSockets");
      if (callback) callback({ success: false, error: "Failed to join queue" });
    }
  });

  socket.on("sendChat", ({ gameId, message }) => {
    const userId = socket.data.userId;
    if (userId) {
      gameManager.addChat(gameId, userId, message);
    }
  });

  socket.on("submitVote", ({ gameId, targetId }) => {
    const userId = socket.data.userId;
    if (userId) {
      gameManager.addVote(gameId, userId, targetId);
    }
  });

  socket.on("wolfKill", async ({ gameId, targetId }) => {
    const userId = socket.data.userId;
    if (userId) {
      gameManager.killPlayer(gameId, userId, targetId);
    }
  });

  socket.on("disconnect", () => {
    logger.debug(`Client disconnected: ${socket.id}`);
    const userId = socket.data.userId;
    const gameId = socket.data.gameId;

    // Trigger the 10-second penalty timer if they were in an active game
    if (userId && gameId) {
      gameManager.handlePlayerDisconnect(gameId, userId);
    }
  });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/games", gamesRouter);
app.use("/api/transactions", transactionsRouter);
app.get("/api/healthcheck", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;

  let message = err.message;
  if (config.NODE_ENV === "production" && statusCode === 500) {
    message = "Internal Server Error";
  }

  logger.error({
    err: config.NODE_ENV === "production" ? undefined : err,
    status: statusCode,
    path: req.originalUrl,
  });

  res.setHeader("Content-Type", "application/json");
  res.status(statusCode).json({
    success: false,
    message: message,
  });
});

export { app, server, io };
