import { Currency } from "../../generated/prisma/enums";
import * as z from "zod";
import { STAKE_AMOUNT_LAMPORTS, STAKE_AMOUNT_SKR_RAW } from "../constants";

export const insertStakeTransactionSchema = z
  .object({
    reference: z.string().min(1),
    currency: z.nativeEnum(Currency),
    amount: z.preprocess((val) => {
      if (typeof val === "string" || typeof val === "number") {
        return BigInt(Math.round(Number(val)));
      }
      return val;
    }, z.bigint()),
  })
  .superRefine((data, ctx) => {
    if (data.currency === Currency.SOL) {
      if (data.amount < STAKE_AMOUNT_LAMPORTS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Minimum SOL stake is ${STAKE_AMOUNT_LAMPORTS} lamports`,
          path: ["amount"],
        });
      }
    } else if (data.currency === Currency.SKR) {
      if (data.amount < STAKE_AMOUNT_SKR_RAW) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Minimum SKR stake is ${STAKE_AMOUNT_SKR_RAW} base units`,
          path: ["amount"],
        });
      }
    }
  });
