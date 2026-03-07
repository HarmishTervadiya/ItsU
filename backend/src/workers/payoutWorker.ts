import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction as SolanaTransaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from "@solana/web3.js";
import { prisma } from "@itsu/shared/src/lib/prisma";
import { logger } from "../utils/logger";
import { config } from "../config";
import bs58 from "bs58";

export class PayoutWorker {
  private static isProcessing = false;

  private static getKeypair(): Keypair | null {
    try {
      if (!config.PAYOUT_PRIVATE_KEY) {
        logger.warn("[PayoutWorker] PAYOUT_PRIVATE_KEY is not configured.");
        return null;
      }

      try {
        const decoded = bs58.decode(config.PAYOUT_PRIVATE_KEY);
        return Keypair.fromSecretKey(decoded);
      } catch (e) {
        const arr = JSON.parse(config.PAYOUT_PRIVATE_KEY);
        return Keypair.fromSecretKey(Uint8Array.from(arr));
      }
    } catch (e: any) {
      logger.error(
        { error: e.message },
        "[PayoutWorker] Failed to parse internal private key",
      );
      return null;
    }
  }

  public static async processPendingPayouts() {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    try {
      const keypair = this.getKeypair();
      if (!keypair) return;

      const rpcUrl =
        config.SOLANA_RPC_URL || clusterApiUrl(config.SOLANA_NETWORK);
      const connection = new Connection(rpcUrl, "confirmed");

      const pendingTx = await prisma.transaction.findMany({
        where: {
          type: "PAYOUT",
          status: "PENDING",
        },
        include: {
          user: true,
        },
        take: 10, // Process in batches
      });

      if (pendingTx.length === 0) {
        return;
      }

      logger.info(
        `[PayoutWorker] Processing ${pendingTx.length} pending payouts...`,
      );

      for (const tx of pendingTx) {
        try {
          if (!tx.user.walletAddress) {
            throw new Error("User has no wallet address configured");
          }

          const toPubkey = new PublicKey(tx.user.walletAddress);

          const transaction = new SolanaTransaction();

          if (tx.currency === "SOL") {
            transaction.add(
              SystemProgram.transfer({
                fromPubkey: keypair.publicKey,
                toPubkey: toPubkey,
                lamports: Number(tx.amount),
              }),
            );
          } else if (tx.currency === "SKR") {
            // TODO: Handle SPL token transfer. Needs Mint Address and Associated Token Accounts.
            throw new Error(
              "SKR Token transfer logic not yet implemented for custodial payouts",
            );
          }

          logger.debug(
            {
              txId: tx.id,
              to: toPubkey.toString(),
              amount: tx.amount.toString(),
            },
            "[PayoutWorker] Sending transaction on-chain...",
          );

          const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair],
          );

          // Update DB on Success
          await prisma.transaction.update({
            where: { id: tx.id },
            data: {
              status: "CONFIRMED",
              txSignature: signature,
            },
          });

          logger.info(
            { txId: tx.id, signature },
            "[PayoutWorker] Successfully processed payout",
          );
        } catch (txError: any) {
          logger.error(
            { txId: tx.id, error: txError.message },
            "[PayoutWorker] Failed to process specific payout",
          );

          // Optionally mark as failed or leave pending to retry based on error
          await prisma.transaction.update({
            where: { id: tx.id },
            data: {
              status: "FAILED",
            },
          });
        }
      }
    } catch (error: any) {
      logger.error(
        { error: error.message },
        "[PayoutWorker] Critical error during processing run",
      );
    } finally {
      this.isProcessing = false;
    }
  }
}
