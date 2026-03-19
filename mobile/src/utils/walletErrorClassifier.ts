import {
  WALLET_ERROR_MESSAGES,
  WalletErrorCategory,
} from "../constants/errors";

const PROTOCOL_CODE_MAP: Record<string, WalletErrorCategory> = {
  ["-1"]: "USER_CANCELLED",
  ["-2"]: "TRANSACTION_FAILED",
  ["-3"]: "TRANSACTION_FAILED",
  ["-4"]: "TRANSACTION_FAILED",
  ["-5"]: "TRANSACTION_FAILED",
  ["-100"]: "CONNECTION_FAILED",
};

type Classifier = {
  category: WalletErrorCategory;
  matches: string[];
};

const STRING_CLASSIFIERS: readonly Classifier[] = [
  {
    category: "USER_CANCELLED",
    matches: [
      "user cancel",
      "user declined",
      "cancellationexception",
      "local association cancelled by user",
      "authorization failed",
      "authorization request failed",
    ],
  },
  {
    category: "NO_WALLET",
    matches: [
      "activitynotfoundexception",
      "error_wallet_not_found",
      "found no installed wallet",
    ],
  },
  {
    category: "TIMED_OUT",
    matches: ["timeoutexception", "error_session_timeout", "timed out waiting"],
  },
  {
    category: "CONNECTION_FAILED",
    matches: [
      "session not established",
      "interruptedexception",
      "interrupted while waiting",
      "executionexception",
      "failed establishing local association",
      "error_session_closed",
      "error_invalid_protocol_version",
      "failed to start session",
      "failed to invoke",
      "failed to end session",
    ],
  },
  {
    category: "TRANSACTION_FAILED",
    matches: ["json_rpc_error", "-32602"],
  },
] as const;

export function classifyWalletError(error: unknown): WalletErrorCategory {
  const numericCode = Number((error as any)?.code);
  if (!Number.isNaN(numericCode)) {
    const mapped = PROTOCOL_CODE_MAP[numericCode];
    if (mapped !== undefined) return mapped;
  }

  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error ?? "").toLowerCase();

  for (const { category, matches } of STRING_CLASSIFIERS) {
    for (const match of matches) {
      if (message.includes(match)) return category;
    }
  }

  return "UNKNOWN";
}

export function getWalletErrorMessage(error: unknown): string | null {
  return WALLET_ERROR_MESSAGES[classifyWalletError(error)];
}
