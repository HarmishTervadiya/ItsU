import { bigint } from "zod";

export interface User {
  id: string;
  walletAddress: string;
  nonce: string;
  name?: string;
  email?: string;
  priorityScore: number;
  totalSolWon: bigint;
  totalSkrWon: bigint;
  timezone: string;
}
