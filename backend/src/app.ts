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

const app = express();

matchMaker()

app.use(express.json());

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

export { app };
