import * as z from "zod";

export const loginSchema = z.object({
  walletAddress: z.string(),
  signature: z.string(),
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
