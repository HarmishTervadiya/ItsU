import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import bs58 from "bs58";
import { setItem } from "../utils/secureStore";
import { Toast } from "toastify-react-native";
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
  const cluster = "mainnet-beta";
  const login = useAuthStore((s) => s.login);

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
      Toast.error("Something went wrong");
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setPublicKey(null);
  };

  return {
    publicKey,
    connecting,
    connected: !!publicKey,
    signInWithSolana,
    disconnectWallet,
  };
};
