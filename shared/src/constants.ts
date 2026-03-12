import { LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * Entry fee in SOL.
 * Priority: STAKE_AMOUNT_SOL -> EXPO_PUBLIC_STAKE_AMOUNT_SOL -> default 0.01
 */
export const STAKE_AMOUNT_SOL = parseFloat(
  process.env.STAKE_AMOUNT_SOL ??
    process.env.EXPO_PUBLIC_STAKE_AMOUNT_SOL ??
    "0.010",
);

/** Entry fee in lamports (on-chain unit, as BigInt) */
export const STAKE_AMOUNT_LAMPORTS = BigInt(
  Math.round(STAKE_AMOUNT_SOL * LAMPORTS_PER_SOL),
);

export const STAKE_AMOUNT_SKR = 100;
export const SKR_DECIMALS = 4;
export const STAKE_AMOUNT_SKR_RAW = BigInt(STAKE_AMOUNT_SKR) * BigInt(10 ** SKR_DECIMALS);
