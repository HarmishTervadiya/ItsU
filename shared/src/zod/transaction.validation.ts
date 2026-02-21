import { Currency } from '@/generated/prisma/enums'
import * as z from 'zod'

export const insertStakeTransactionSchema = z.object({
    reference: z.string().min(1),
    currency: z.enum(Currency),
    amount: z.bigint().min(50000000n)
})