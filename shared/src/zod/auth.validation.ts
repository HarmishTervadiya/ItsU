import * as z from "zod";

export const loginSchema = z.object({
  walletAddress: z.string(),
  signature: z.string(),
});

export const refreshAccessTokenSchema = z.object({
  refreshToken: z.string(),
});
