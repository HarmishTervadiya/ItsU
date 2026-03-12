import { useState, useCallback, useMemo } from "react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import bs58 from "bs58";
import { setItem } from "../utils/secureStore";
import { Toast } from "toastify-react-native";
import { ERROR_MESSAGES, WALLET_REJECTION_ERRORS } from "../constants/errors";
import { getNonceApi } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SKR_MINT, SKR_DECIMALS } from "../constants";

const APP_IDENTITY = {
  name: "ItsU",
  uri: "https://its-u-web.vercel.app",
  icon: "images/logo.png",
};

export const useWallet = () => {
  const publicKey = useAuthStore((s) => s.publicKey);
  const setPublicKey = useAuthStore((s) => s.setPublicKey);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const cluster = (process.env.EXPO_PUBLIC_SOLANA_NETWORK ?? "devnet") as
    | "devnet"
    | "mainnet-beta";
  const rpcUrl =
    process.env.EXPO_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const login = useAuthStore((s) => s.login);

  const connection = useMemo(
    () => new Connection(rpcUrl, "confirmed"),
    [rpcUrl],
  );

  const signInWithSolana = async () => {
    setConnecting(true);
    try {
      // 1. Authorize to get the wallet address
      const authResult = await transact(async (wallet: Web3MobileWallet) => {
        return await wallet.authorize({
          chain: `solana:${cluster}`,
          identity: APP_IDENTITY,
        });
      });

      const addressBase64 = authResult.accounts[0].address;
      const pubkey = new PublicKey(Buffer.from(addressBase64, "base64"));
      const walletAddress = pubkey.toBase58();

      // 2. Fetch nonce from server (APP IS NOW IN FOREGROUND, NETWORK WORKS!)
      const {
        data: nonceData,
        success: nonceSuccess,
        error: nonceError,
      } = await getNonceApi(walletAddress);
      if (!nonceSuccess) throw new Error(nonceError!);

      // Create a message to send into wallet
      const expectedMessage = `Sign in into ItsU. Nonce: ${nonceData?.nonce}`;
      const messageBuffer = new Uint8Array(Buffer.from(expectedMessage));

      // 3. Sign the message (APP GOES TO BACKGROUND AGAIN)
      let signatureBase58: string = "";
      await transact(async (wallet: Web3MobileWallet) => {
        // Re-authorize with the previous token to skip the approval screen
        await wallet.authorize({
          chain: `solana:${cluster}`,
          identity: APP_IDENTITY,
          auth_token: authResult.auth_token,
        });

        const signedMessages = await wallet.signMessages({
          addresses: [addressBase64],
          payloads: [messageBuffer],
        });

        // Retrieve the signed message and encode it
        const signatureBytes = signedMessages[0];
        signatureBase58 = bs58.encode(signatureBytes);
      });

      // 4. Perform actual login flow (APP IS NOW BACK IN FOREGROUND)
      // Note: Android takes a moment to restore networking when waking up from background
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const success = await login(walletAddress, signatureBase58);

      if (!success) {
        throw new Error("Login failed");
      }

      // On success set the publicKey
      setItem("publicKey", pubkey.toString());
      setPublicKey(pubkey);

      Toast.success("Login successful!");
      console.log("Login successful!");
    } catch (error: any) {
      console.error("Connect wallet failed:", error.message);

      let errorMessage = "Something went wrong";

      const errorStr =
        error?.message || error?.code || JSON.stringify(error) || "unknown";

      if (
        WALLET_REJECTION_ERRORS.some((msg) => String(errorStr).includes(msg))
      ) {
        errorMessage = ERROR_MESSAGES["USER_REJECTED_WALLET"];
      } else if (errorStr.includes("Network request failed")) {
        errorMessage = ERROR_MESSAGES["NETWORK_ERROR"];
      } else {
        // Fallback: don't show the literal "-1" or raw error to the user if we failed to parse it,
        // default to "Something went wrong" since we initialized it
      }

      Toast.error(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setPublicKey(null);
  };

  const sendSOL = useCallback(
    async (toAddress: string, amountSOL: number, reference?: PublicKey) => {
      console.log("[useWallet] sendSOL() called");
      console.log("[useWallet] to:", toAddress, "amount:", amountSOL);

      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setSending(true);
      try {
        const toPublicKey = new PublicKey(toAddress);
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();

        const lamports = Math.round(amountSOL * LAMPORTS_PER_SOL);
        const transaction = new Transaction();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        const transferInstruction = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: toPublicKey,
          lamports,
        });

        if (reference) {
          transferInstruction.keys.push({
            pubkey: reference,
            isSigner: false,
            isWritable: false,
          });
        }

        transaction.add(transferInstruction);

        const signedTransaction = await transact(
          async (wallet: Web3MobileWallet) => {
            await wallet.authorize({
              chain: `solana:${cluster}`,
              identity: APP_IDENTITY,
            });

            const signedTxs = await wallet.signTransactions({
              transactions: [transaction],
            });

            if (!signedTxs || signedTxs.length === 0) {
              throw new Error("No signed transaction returned from wallet");
            }

            return signedTxs[0];
          },
        );

        // Required delay for MWA networking context restoration
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const rawTransaction = signedTransaction.serialize();
        let signature: string | null = null;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`[useWallet] send attempt ${attempt}...`);
            signature = await connection.sendRawTransaction(rawTransaction, {
              skipPreflight: true,
              maxRetries: 2,
            });
            break;
          } catch (err: any) {
            lastError = err;
            console.log(`[useWallet] attempt ${attempt} failed:`, err.message);
            if (attempt < 3) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }

        if (!signature) {
          throw new Error(lastError?.message || "Failed to send transaction");
        }

        console.log("[useWallet] waiting for confirmation...");
        const confirmation = await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed",
        );

        if (confirmation.value.err) {
          throw new Error("Transaction failed during confirmation");
        }

        return signature;
      } catch (error: any) {
        console.error("Error while sending sol:", error);

        let errorMessage = "Failed to send transaction";
        const errorStr =
          error?.message || error?.code || JSON.stringify(error) || "unknown";

        if (
          WALLET_REJECTION_ERRORS.some((msg) => String(errorStr).includes(msg))
        ) {
          errorMessage = ERROR_MESSAGES["USER_REJECTED_WALLET"];
        } else if (errorStr.includes("Network request failed")) {
          errorMessage = ERROR_MESSAGES["NETWORK_ERROR"];
        } else if (
          errorStr.includes("insufficient lamports") ||
          errorStr.includes("InsufficientFunds")
        ) {
          errorMessage = ERROR_MESSAGES["INSUFFICIENT_FUNDS"];
        } else {
          // If we couldn't match the error, make sure we only display a safe string
          errorMessage = "Failed to send transaction";
        }

        Toast.error(errorMessage);
        throw error;
      } finally {
        setSending(false);
      }
    },
    [publicKey, connection, cluster],
  );

  const sendSKR = useCallback(
    async (toAddress: string, amountSKR: number, reference?: PublicKey) => {
      if (!publicKey) throw new Error("Wallet not connected");

      console.log(toAddress);
      setSending(true);

      try {
        const toPublicKey = new PublicKey(toAddress);
        const mintPublicKey = new PublicKey(SKR_MINT);

        // Fetch sender's actual token accounts for this mint
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint: mintPublicKey, programId: TOKEN_2022_PROGRAM_ID },
        );

        console.log(
          "[sendSKR] token accounts found:",
          tokenAccounts.value.length,
        );
        tokenAccounts.value.forEach((acc, i) => {
          console.log(
            `[sendSKR] account[${i}]:`,
            acc.pubkey.toBase58(),
            "balance:",
            acc.account.data.parsed.info.tokenAmount.uiAmount,
          );
        });

        if (tokenAccounts.value.length === 0) {
          throw new Error("No token account found for this mint");
        }

        const fromTokenAccount = tokenAccounts.value.reduce((best, current) => {
          const bestAmount = BigInt(
            best.account.data.parsed.info.tokenAmount.amount,
          );
          const currentAmount = BigInt(
            current.account.data.parsed.info.tokenAmount.amount,
          );
          return currentAmount > bestAmount ? current : best;
        });

        const fromAta = fromTokenAccount.pubkey;
        const toAta = await getAssociatedTokenAddress(
          mintPublicKey,
          toPublicKey,
          false, 
          TOKEN_2022_PROGRAM_ID
        );

        console.log("[sendSKR] fromAta:", fromAta.toBase58());
        console.log("[sendSKR] toAta:", toAta.toBase58());
        console.log("[sendSKR] mint:", mintPublicKey.toBase58());
        console.log("[sendSKR] sender:", publicKey.toBase58());
        console.log("[sendSKR] receiver:", toPublicKey.toBase58());

        const fromAccount = await getAccount(connection, fromAta, "confirmed", TOKEN_2022_PROGRAM_ID);
        const amount = BigInt(
          Math.round(amountSKR * Math.pow(10, SKR_DECIMALS)),
        );

        console.log("[sendSKR] fromAccount mint:", fromAccount.mint.toBase58());
        console.log(
          "[sendSKR] fromAccount balance (raw):",
          fromAccount.amount.toString(),
        );
        console.log("[sendSKR] transfer amount (raw):", amount.toString());

        if (fromAccount.amount < amount) {
          throw new Error(
            `Insufficient balance: have ${fromAccount.amount}, need ${amount}`,
          );
        }

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();

        const transaction = new Transaction();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Create destination ATA if it doesn't exist
        let toAccountExists = false;
        try {
          await getAccount(connection, toAta, "confirmed", TOKEN_2022_PROGRAM_ID);
          toAccountExists = true;
          console.log("[sendSKR] destination ATA exists");
        } catch (error) {
          if (
            error instanceof TokenAccountNotFoundError ||
            error instanceof TokenInvalidAccountOwnerError ||
            (error as Error).name === "TokenAccountNotFoundError"
          ) {
            console.log(
              "[sendSKR] destination ATA missing — adding creation instruction",
            );
            transaction.add(
              createAssociatedTokenAccountInstruction(
                publicKey,
                toAta,
                toPublicKey,
                mintPublicKey,
                TOKEN_2022_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
              ),
            );
          } else {
            console.error(
              "[sendSKR] unexpected error checking destination ATA:",
              error,
            );
            throw error;
          }
        }

        const transferInstruction = createTransferInstruction(
          fromAta,
          toAta,
          publicKey,
          amount,
          [],
          TOKEN_2022_PROGRAM_ID
        );

        if (reference) {
          transferInstruction.keys.push({
            pubkey: reference,
            isSigner: false,
            isWritable: false,
          });
        }

        transaction.add(transferInstruction);
        console.log(
          "[sendSKR] transaction instructions:",
          transaction.instructions.length,
        );

        const signedTransaction = await transact(
          async (wallet: Web3MobileWallet) => {
            await wallet.authorize({
              chain: `solana:${cluster}`,
              identity: APP_IDENTITY,
            });

            const signedTxs = await wallet.signTransactions({
              transactions: [transaction],
            });
            if (!signedTxs?.length)
              throw new Error("No signed transaction returned from wallet");

            return signedTxs[0];
          },
        );

        // Required delay for MWA networking context restoration
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const rawTransaction = signedTransaction.serialize();
        let signature: string | null = null;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`[sendSKR] send attempt ${attempt}/3`);
            signature = await connection.sendRawTransaction(rawTransaction, {
              skipPreflight: false,
              maxRetries: 2,
            });
            console.log("[sendSKR] signature:", signature);
            break;
          } catch (err: any) {
            lastError = err;
            console.error(`[sendSKR] attempt ${attempt} failed:`, err.message);
            if (attempt < 3)
              await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (!signature)
          throw new Error(lastError?.message ?? "Failed to send transaction");

        console.log("[sendSKR] waiting for confirmation...");
        const confirmation = await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed",
        );

        console.log(
          "[sendSKR] confirmation error:",
          confirmation.value.err ?? "none",
        );

        if (confirmation.value.err)
          throw new Error("Transaction failed during confirmation");

        console.log("[sendSKR] success:", signature);
        return signature;
      } catch (error: any) {
        console.error("[sendSKR] caught error:", error?.message);
        console.error("[sendSKR] full error:", JSON.stringify(error, null, 2));

        const errorStr =
          error?.message || error?.code || JSON.stringify(error) || "unknown";

        let errorMessage: string;
        if (
          WALLET_REJECTION_ERRORS.some((msg) => String(errorStr).includes(msg))
        ) {
          errorMessage = ERROR_MESSAGES["USER_REJECTED_WALLET"];
        } else if (errorStr.includes("Network request failed")) {
          errorMessage = ERROR_MESSAGES["NETWORK_ERROR"];
        } else if (
          /(insufficient lamports|InsufficientFunds|insufficient funds)/.test(
            errorStr,
          )
        ) {
          errorMessage = ERROR_MESSAGES["INSUFFICIENT_FUNDS"];
        } else {
          errorMessage = "Failed to send transaction";
        }

        Toast.error(errorMessage);
        throw error;
      } finally {
        setSending(false);
      }
    },
    [publicKey, connection, cluster],
  );

  return {
    publicKey,
    connecting,
    sending,
    connected: !!publicKey,
    signInWithSolana,
    disconnectWallet,
    sendSOL,
    sendSKR,
  };
};
