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
  io.to(gameId).emit("gameStateUpdated", state);
  BotEngine.handleStateChange(gameId, state);
};

io.on("connection", async (socket) => {
  logger.debug(`New client connected: ${socket.id}`);

  // Any new user joins the game
  socket.on("joinGame", ({ gameId, userId }) => {
    socket.join(gameId);

    socket.data.userId = userId;
    logger.debug(`User ${userId} joined room ${gameId}`);

    const currentState = gameManager.getGame(gameId);
    if (currentState) {
      socket.emit("gameStateUpdated", currentState);
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
  });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/games", gamesRouter);
app.use("/api/transactions", transactionsRouter);

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

export { app, server };
