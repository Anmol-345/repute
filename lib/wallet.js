"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { isConnected, setAllowed, getAddress } from "@stellar/freighter-api";

const WalletContext = createContext(null);

// Normalizes the return from getAddress() which may be { address, error } or a bare string
function extractAddress(result) {
  if (!result) return null;
  if (typeof result === "string") return result || null;
  return result.address || null;
}

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // Auto-reconnect if already permitted on mount
  useEffect(() => {
    async function checkConnection() {
      try {
        const connected = await isConnected();
        // isConnected may return { isConnected: bool } or bool depending on version
        const isConn = typeof connected === "object" ? connected.isConnected : connected;
        if (isConn) {
          const result = await getAddress();
          const addr = extractAddress(result);
          if (addr) setAddress(addr);
        }
      } catch (err) {
        console.error("Failed to check Freighter connection:", err);
      }
    }
    checkConnection();
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const connected = await isConnected();
      const isConn = typeof connected === "object" ? connected.isConnected : connected;

      if (!isConn) {
        alert("Freighter extension not found. Please install it from freighter.app");
        return;
      }

      await setAllowed();
      const result = await getAddress();
      const addr = extractAddress(result);
      if (addr) {
        setAddress(addr);
      } else {
        console.warn("Wallet permission denied or address unavailable.");
      }
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider value={{ address, connecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
