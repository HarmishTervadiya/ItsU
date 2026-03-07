import { LAMPORTS_PER_SOL } from "@solana/web3.js";

/** Entry fee in SOL — configured via EXPO_PUBLIC_STAKE_AMOUNT_SOL */
export const STAKE_AMOUNT_SOL = parseFloat(
  process.env.EXPO_PUBLIC_STAKE_AMOUNT_SOL ?? "0.010",
);

/** Entry fee in lamports (on-chain unit, as a plain number) */
export const STAKE_AMOUNT_LAMPORTS = Math.round(
  STAKE_AMOUNT_SOL * LAMPORTS_PER_SOL,
);

/** Entry fee in SKR tokens */
export const STAKE_AMOUNT_SKR = 100;

export const STAKE_DISPLAY: Record<"SOL" | "SKR", string> = {
  SOL: `${STAKE_AMOUNT_SOL} SOL`,
  SKR: `${STAKE_AMOUNT_SKR} SKR`,
};
