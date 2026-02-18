import { useState, useCallback } from "react";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import axios from "axios";
import bs58 from "bs58";
import { setItem } from "../utils/secureStore";

const APP_IDENTITY = {
  name: "ItsU",
  uri: "itsu://",
  asset: "favicon.png",
};

const API_URL = "http://192.168.54.44:3000";

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
        const nonceRes = await axios.get(
          `${API_URL}/auth/nonce/${walletAddress}`,
        );

        if (nonceRes.status != 200 && nonceRes.status != 201)
          throw new Error("Failed to fetch nonce");

        const nonce = nonceRes.data.nonce;

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
        const verifyRes = await axios.post(`${API_URL}/auth/login`, {
          walletAddress,
          signature: signatureBase58,
        });

        if (verifyRes.status !== 201 && verifyRes.status !== 200) {
          throw new Error("Signature verification failed");
        }

        // On success set the accessToken and publicKey
        setItem("accessToken", verifyRes.data.accessToken);
        setItem("publicKey", pubkey.toString());
        setPublicKey(pubkey);

        console.log("Login successful!");

        return authResult;
      });
    } catch (error: any) {
      console.error("Connect wallet failed:", error.message);
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
