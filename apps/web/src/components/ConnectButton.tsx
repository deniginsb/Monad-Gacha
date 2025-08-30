"use client";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";

export default function ConnectButton() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  return (
    <button className="btn" onClick={() => open()}>
      {isConnected ? `${address?.slice(0,6)}…${address?.slice(-4)}` : "Connect Wallet"}
    </button>
  );
}

