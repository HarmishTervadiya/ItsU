import pino from "pino";
import { config } from "../config";

export const logger = pino({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "password",
      "confirmPassword",
      "card_number",
    ],
    remove: true,
  },
  base: {
    env: config.NODE_ENV,
  },
  transport:
    config.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname,env,service",
            errorLikeObjectKeys: ["err", "error"],
          },
        }
      : undefined,
});
