"use client";
import Banner from "../components/Banner";
import ConnectButton from "../components/ConnectButton";
import BalanceMON from "../components/BalanceMON";
import VaultStatus from "../components/VaultStatus";
import Reels from "../components/Reels";
import SpinButton from "../components/SpinButton";
import ResultModal from "../components/ResultModal";
import Leaderboard from "../components/Leaderboard";
import { useEffect, useState } from "react";
import { Address, createPublicClient, http, formatEther } from "viem";
import { monadTestnet } from "../lib/chain-monad";
import { SlotMachineVaultABI } from "../lib/abi/SlotMachineVault";

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as Address;

export default function Home() {
  const [symbols, setSymbols] = useState<{name:string;imageURI:string}[]>([]);
  const [entryFee, setEntryFee] = useState<bigint>(0n);
  const [lastRes, setLastRes] = useState<number[]|undefined>(undefined);
  const [payout, setPayout] = useState<string|undefined>(undefined);

  useEffect(() => {
    const client = createPublicClient({ chain: monadTestnet, transport: http() });
    (async () => {
      const [list] = await client.readContract({ address: VAULT_ADDRESS, abi: SlotMachineVaultABI, functionName: "getSymbols" }) as any;
      setSymbols(list.map((s:any)=>({ name:s.name, imageURI:s.imageURI })));
      const fee = await client.readContract({ address: VAULT_ADDRESS, abi: SlotMachineVaultABI, functionName: "entryFee" }) as any;
      setEntryFee(fee);
    })();
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Banner />
        <div className="flex items-center gap-3">
          <BalanceMON />
          <ConnectButton />
        </div>
      </div>

      <VaultStatus vault={VAULT_ADDRESS} />

      <div className="card">
        <div className="text-2xl font-semibold mb-2">3-Reel Slots</div>
        <div className="text-sm opacity-70 mb-4">Pay {Number(formatEther(entryFee || 0n)).toFixed(4)} MON per spin.</div>
        <Reels symbols={symbols} result={lastRes} />
        <SpinButton
          vault={VAULT_ADDRESS}
          entryFee={entryFee}
          onResult={(reels, pay)=>{ setLastRes(reels); setPayout(pay); }}
        />
      </div>

      <Leaderboard vault={VAULT_ADDRESS} />

      <ResultModal payout={payout} onClose={()=>setPayout(undefined)} />
    </main>
  );
}

