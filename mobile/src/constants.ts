import { LAMPORTS_PER_SOL } from "@solana/web3.js";


type StakeCurrency = "SOL" | "SKR";

const SKR_DECIMALS = 9 as const;
const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3" as const;

function requireEnvFloat(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  const parsed = parseFloat(raw);
  if (!Number.isFinite(parsed)) throw new Error(`Env var ${key}="${raw}" is not a valid number`);
  return parsed;
}

const STAKE_AMOUNT_SOL = requireEnvFloat("EXPO_PUBLIC_STAKE_AMOUNT_SOL", 0.01);
const STAKE_AMOUNT_SKR = requireEnvFloat("EXPO_PUBLIC_STAKE_AMOUNT_SKR", 100);

const STAKE_AMOUNT_LAMPORTS = Math.round(STAKE_AMOUNT_SOL * LAMPORTS_PER_SOL);
const STAKE_AMOUNT_SKR_RAW = Math.round(STAKE_AMOUNT_SKR * 10 ** SKR_DECIMALS);

const STAKE_DISPLAY: Record<StakeCurrency, string> = {
  SOL: `${STAKE_AMOUNT_SOL} SOL`,
  SKR: `${STAKE_AMOUNT_SKR} SKR`,
};

export {
  SKR_DECIMALS,
  SKR_MINT,
  STAKE_AMOUNT_SOL,
  STAKE_AMOUNT_SKR,
  STAKE_AMOUNT_LAMPORTS,
  STAKE_AMOUNT_SKR_RAW,
  STAKE_DISPLAY,
  type StakeCurrency,
};