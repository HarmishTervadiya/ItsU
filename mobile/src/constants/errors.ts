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
  | "UNKNOWN_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "USER_REJECTED_WALLET";

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
  NETWORK_ERROR: "Network error. Please check your internet connection.",
  TIMEOUT_ERROR: "The request took too long. Please try again.",
  USER_REJECTED_WALLET: "Transaction cancelled by user.",
};

// --- Wallet rejection errors ---

/**
 * User-facing categories — intentionally coarse.
 * The user does not need to know the difference between
 * ExecutionException and InterruptedException.
 */
export type WalletErrorCategory =
  | "USER_CANCELLED"
  | "NO_WALLET"
  | "TIMED_OUT"
  | "CONNECTION_FAILED"
  | "TRANSACTION_FAILED"
  | "UNKNOWN";

export const WALLET_ERROR_MESSAGES: Record<WalletErrorCategory, string | null> =
  {
    USER_CANCELLED: null,
    NO_WALLET: "No wallet app found. Please install Phantom or Solflare.",
    TIMED_OUT: "Wallet didn't respond. Make sure it's open and try again.",
    CONNECTION_FAILED: "Couldn't connect to your wallet. Please try again.",
    TRANSACTION_FAILED: "Wallet rejected the request. Please try again.",
    UNKNOWN: "Something went wrong with your wallet. Please try again.",
  };
