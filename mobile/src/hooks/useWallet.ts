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
import { ERROR_MESSAGES } from "../constants/errors";
import { getNonceApi } from "../api/auth";
import { useAuthStore } from "../stores/authStore";

const APP_IDENTITY = {
  name: "ItsU",
  uri: "itsu://",
  asset: "favicon.png",
};

export const useWallet = () => {
  const publicKey = useAuthStore((s) => s.publicKey);
  const setPublicKey = useAuthStore((s) => s.setPublicKey);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const cluster = "devnet";
  const login = useAuthStore((s) => s.login);

  const connection = useMemo(
    () => new Connection("https://api.devnet.solana.com", "confirmed"),
    [],
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
    
      if (
        error.message?.includes("User cancel") ||
        error.message?.includes("Authorization failed") ||
        error.message?.includes("User declined")
      ) {
        errorMessage = ERROR_MESSAGES["USER_REJECTED_WALLET"];
      } else if (error.message?.includes("Network request failed")) {
        errorMessage = ERROR_MESSAGES["NETWORK_ERROR"];
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
        if (
          error.message?.includes("User cancel") ||
          error.message?.includes("Authorization failed") ||
          error.message?.includes("User declined")
        ) {
          errorMessage = ERROR_MESSAGES["USER_REJECTED_WALLET"];
        } else if (error.message?.includes("Network request failed")) {
          errorMessage = ERROR_MESSAGES["NETWORK_ERROR"];
        } else if (
          error.message?.includes("insufficient lamports") ||
          error.message?.includes("InsufficientFunds")
        ) {
          errorMessage = ERROR_MESSAGES["INSUFFICIENT_FUNDS"];
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
  };
};
