import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { config } from "./config";

const app = express();

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message:
      config.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
});

export { app };
