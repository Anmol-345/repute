"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { 
  StellarWalletsKit, 
  Networks 
} from "@creit-tech/stellar-wallets-kit";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";

const WalletContext = createContext(null);

// Initialize the kit — v2 uses static methods
if (typeof window !== "undefined") {
  StellarWalletsKit.init({
    network: Networks.TESTNET,
    modules: defaultModules(),
  });
}

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress");
    const savedType = localStorage.getItem("walletType");
    if (savedAddress && savedType) {
      setAddress(savedAddress);
      setWalletType(savedType);
    }
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      // In v2, authModal() is the standard way to trigger the connection UI
      const { address } = await StellarWalletsKit.authModal();

      if (address) {
        setAddress(address);
        // kit.selectedModule is also available statically if you want full info
        // but for state we'll just track that we're connected
        localStorage.setItem("walletAddress", address);
        
        // We'll peek at the selected module for the name
        try {
          const mod = StellarWalletsKit.selectedModule;
          setWalletType(mod.productName);
          localStorage.setItem("walletType", mod.productName);
        } catch (e) {
          setWalletType("Wallet");
        }
      }
    } catch (err) {
       // Kit throws on modal close or rejection
      console.error("Connection error:", err);
      if (err.message && err.message.toLowerCase().includes("not found")) {
        alert("Wallet extension not found. Please install it.");
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (err) {
      console.error("Disconnect error:", err);
    }
    setAddress(null);
    setWalletType(null);
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("walletType");
  }, []);

  const isConnected = !!address;

  const value = useMemo(() => ({
    address,
    walletType,
    isConnected,
    connecting,
    connect,
    disconnect
  }), [address, walletType, isConnected, connecting, connect, disconnect]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}

// Export the singleton reference (though it's static now)
export const kit = StellarWalletsKit;
