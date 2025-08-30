"use client";
import { Address, createPublicClient, createWalletClient, custom, http, formatEther } from "viem";
import { monadTestnet } from "../lib/chain-monad";
import { SlotMachineVaultABI } from "../lib/abi/SlotMachineVault";
import { useAccount } from "wagmi";
import { useState } from "react";
import { useReelsSpin } from "./Reels";

type SeedResp = { roundId: number; seasonId: number; deadline: number; serverSeedHash: `0x${string}`; signature: `0x${string}` };

export default function SpinButton({ vault, entryFee, onResult }:{ vault: Address; entryFee: bigint; onResult:(reels:number[], payout:string)=>void }) {
  const { address, chainId } = useAccount();
  const [busy, setBusy] = useState(false);
  const reels = useReelsSpin();

  async function spinNow() {
    if (!address) return alert("Connect wallet");
    if (chainId !== monadTestnet.id) return alert("Switch to Monad Testnet");

    setBusy(true); reels.start();
    try {
      const r = await fetch("/api/seed", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ player: address }) });
      const data: SeedResp = await r.json();

      const wallet = createWalletClient({ chain: monadTestnet, transport: custom((window as any).ethereum) });
      const txHash = await wallet.writeContract({
        address: vault,
        abi: SlotMachineVaultABI,
        functionName: "spin",
        args: [BigInt(data.roundId), BigInt(data.deadline), data.serverSeedHash, data.signature],
        value: entryFee
      });

      const pub = createPublicClient({ chain: monadTestnet, transport: http() });
      const receipt = await pub.waitForTransactionReceipt({ hash: txHash });
      const events = await pub.getLogs({ address: vault, fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber });
      const last = events[events.length-1] as any;
      const args = last.args;
      const reelsArr: number[] = Array.from(args.reels as any).map((x:any)=> Number(x));
      const payout = formatEther(args.payout as bigint);
      onResult(reelsArr, payout);
    } catch (e:any) {
      console.error(e);
      alert(e?.message || "Spin failed");
    } finally {
      reels.stop(); setBusy(false);
    }
  }

  return (
    <button className="btn w-full text-lg" onClick={spinNow} disabled={busy}>
      {busy ? "Spinning..." : `SPIN (0.1 MON)`}
    </button>
  );
}

