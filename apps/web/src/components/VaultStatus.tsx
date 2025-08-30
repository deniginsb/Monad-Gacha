"use client";
import { useEffect, useState } from "react";
import { Address, createPublicClient, http, formatEther } from "viem";
import { monadTestnet } from "../lib/chain-monad";
import { SlotMachineVaultABI } from "../lib/abi/SlotMachineVault";

export default function VaultStatus({ vault }: { vault: Address }) {
  const [cfg, setCfg] = useState<any>();
  const [bal, setBal] = useState<bigint>(0n);

  useEffect(() => {
    const client = createPublicClient({ chain: monadTestnet, transport: http() });
    (async () => {
      const [e,s,m,d,p,signer] = await client.readContract({ address: vault, abi: SlotMachineVaultABI, functionName: "getConfig" }) as any;
      setCfg({ entryFee: e, seasonId: s, maxPer: m, dailyCap: d, perUserCap: p, signer });
      const b = await client.getBalance({ address: vault });
      setBal(b);
    })();
  }, [vault]);

  if (!cfg) return null;
  return (
    <div className="card">
      <div className="text-sm">Vault: <b>{vault}</b></div>
      <div className="text-sm">Entry Fee: {formatEther(cfg.entryFee)} MON</div>
      <div className="text-sm">Season: {cfg.seasonId.toString()}</div>
      <div className="text-sm">Max/Spin: {formatEther(cfg.maxPer)} MON</div>
      <div className="text-sm">DailyCap: {formatEther(cfg.dailyCap)} MON • PerUserCap: {formatEther(cfg.perUserCap)} MON</div>
      <div className="text-sm">Signer: {cfg.signer}</div>
      <div className="text-sm">Vault Balance: {formatEther(bal)} MON</div>
    </div>
  );
}

