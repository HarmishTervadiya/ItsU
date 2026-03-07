import { Currency } from "../../generated/prisma/enums";
import * as z from "zod";
import { STAKE_AMOUNT_LAMPORTS } from "../constants";

export const insertStakeTransactionSchema = z.object({
  reference: z.string().min(1),
  currency: z.nativeEnum(Currency),
  amount: z.preprocess((val) => {
    if (typeof val === "string" || typeof val === "number") {
      return BigInt(Math.round(Number(val)));
    }
    return val;
  }, z.bigint().min(STAKE_AMOUNT_LAMPORTS)),
});
