export const config = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  GROQ_API_KEY: process.env.GROQ_API_KEY!,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  SARVAM_API_KEY: process.env.SARVAM_API_KEY!,
  ITSU_MAIN_WALLET: process.env.ITSU_MAIN_WALLET!,
  PAYOUT_PRIVATE_KEY: process.env.PAYOUT_PRIVATE_KEY || "", // Can be base58 or byte array
  SOLANA_NETWORK:
    (process.env.SOLANA_NETWORK as "devnet" | "mainnet-beta" | "testnet") ||
    "devnet",
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
  STAKE_AMOUNT_SOL: parseFloat(process.env.STAKE_AMOUNT_SOL || "0.01"),
  STAKE_AMOUNT_SKR: parseFloat(process.env.STAKE_AMOUNT_SKR || "100"),
  SKR_MINT: "9TiJBH3qPkCCgHG7t9SqyFxDRgmjbgitEurx71YLUMX8",
  SKR_DECIMALS: "4",
};
