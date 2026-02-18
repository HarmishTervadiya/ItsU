import { useState, useCallback } from "react";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";

const APP_IDENTITY = {
  name: "ItsU",
  uri: "itsu://",
  asset: "favicon.png",
};

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

        return authResult;
      });

      const pubkey = new PublicKey(
        Buffer.from(signInResult.accounts[0].address, "base64"),
      );

      setPublicKey(pubkey);
      return pubkey;
    } catch (error: any) {
      console.error("Connect wallet failed:", error);
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
