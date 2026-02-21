import * as z from "zod";

export const loginSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address cannot be empty"),
  signature: z.string().min(1, "Signature cannot be empty"),
    timezone: z
  .string()
  .trim()
  .refine((tz) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  })
});

export const refreshAccessTokenSchema = z.object({
  refreshToken: z.string(),
});
