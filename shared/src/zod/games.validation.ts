import * as z from 'zod'

export const joinQueueSchema = z.object({
    signature: z.string().min(1, "Signature cannot be empty")
})