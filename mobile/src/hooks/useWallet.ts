import { useState, useCallback } from "react";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import bs58 from "bs58";
import { setItem } from "../utils/secureStore";
import { config } from "../config";
import { apiClient } from "../utils/apiHandler";
import { Toast } from "toastify-react-native";
import { getCalendars } from "expo-localization";

const APP_IDENTITY = {
  name: "ItsU",
  uri: "itsu://",
  asset: "favicon.png",
};

const API_URL = config.SERVER_URL;

export const useWallet = () => {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);
  const cluster = "mainnet-beta";
  const connection = new Connection(clusterApiUrl(cluster), "confirmed");

  const signInWithSolana = async () => {
    setConnecting(true);
    try {
      const signInResult = await transact(async (wallet: Web3MobileWallet) => {
        const authResult = await wallet.authorize({
          chain: `solana:${cluster}`,
          identity: APP_IDENTITY,
        });

        const addressBase64 = authResult.accounts[0].address;
        const pubkey = new PublicKey(Buffer.from(addressBase64, "base64"));
        const walletAddress = pubkey.toBase58();

        // Retrieve nonce from server
        const { nonce } = await apiClient.get<{ nonce: string }>(
          `${API_URL}/auth/nonce/${walletAddress}`,
        );

        // Create a message to send into wallet
        const expectedMessage = `Sign in into ItsU. Nonce: ${nonce}`;
        const messageBuffer = new Uint8Array(Buffer.from(expectedMessage));

        //Sign the message
        const signedMessages = await wallet.signMessages({
          addresses: [addressBase64],
          payloads: [messageBuffer],
        });

        // Retrieve the signed message and encode it
        const signatureBytes = signedMessages[0];
        const signatureBase58 = bs58.encode(signatureBytes);

        // Server check if the signature is valid or not
        const { accessToken, refreshToken } = await apiClient.post<{
          accessToken: string;
          refreshToken: string;
          timezone: string;
        }>(`${API_URL}/auth/login`, {
          walletAddress,
          signature: signatureBase58,
          timezone: getCalendars()[0].timeZone || "UTC",
        });

        // On success set the accessToken and publicKey
        setItem("accessToken", accessToken);
        setItem("refreshToken", refreshToken);
        setItem("publicKey", pubkey.toString());
        setPublicKey(pubkey);

        Toast.success("Login successful!");
        console.log("Login successful!");

        return authResult;
      });
    } catch (error: any) {
      console.error("Connect wallet failed:", error.message);
      Toast.error("Someting went wrong");
      throw error;
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
