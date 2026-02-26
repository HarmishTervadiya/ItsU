export type ErrorCode =
  | "INVALID_ACCESS_TOKEN"
  | "WALLET_NOT_FOUND"
  | "SIGNATURE_EXPIRED"
  | "INSUFFICIENT_FUNDS"
  | "GAME_FULL"
  | "RATE_LIMIT_EXCEEDED"
  | "VALIDATION_ERROR"
  | "INTERNAL_SERVER_ERROR"
  | "TRANSACTION_NOT_FOUND"
  | "TRANSACTION_ALREADY_PROCESSED"
  | "INVALID_TRANSACTION"
  | "BAD_REQUEST"
  | "NO_ACTIVE_ITEMS"
  | "UNKNOWN_ERROR";

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_ACCESS_TOKEN: "Your session has expired. Please sign in again.",
  WALLET_NOT_FOUND: "This Solana wallet is not registered with ItsU.",
  SIGNATURE_EXPIRED: "The cryptographic signature timed out. Try again.",
  INSUFFICIENT_FUNDS: "You do not have enough SOL to enter this lobby.",
  GAME_FULL: "This lobby just filled up! Please join another.",
  RATE_LIMIT_EXCEEDED: "You are doing that too fast. Please slow down.",
  VALIDATION_ERROR: "The requested data format is invalid.",
  INTERNAL_SERVER_ERROR:
    "Something went wrong on our end. Please try again later.",
  TRANSACTION_NOT_FOUND: "We could not find your transaction. Try again.",
  TRANSACTION_ALREADY_PROCESSED: "This transaction was already processed.",
  INVALID_TRANSACTION: "This transaction appears to be invalid.",
  BAD_REQUEST: "Something is wrong with your request.",
  NO_ACTIVE_ITEMS: "No active games available at the moment.",
  UNKNOWN_ERROR: "An unexpected error occurred in the arena.",
};
