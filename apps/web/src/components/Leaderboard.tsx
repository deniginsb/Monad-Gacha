"use client";
import { useEffect, useState } from "react";
import { Address, createPublicClient, http, formatEther } from "viem";
import { monadTestnet } from "../lib/chain-monad";
import { fetchLeaderboard } from "../lib/leaderboard";

export default function Leaderboard({ vault }:{ vault: Address }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    const client = createPublicClient({ chain: monadTestnet, transport: http() });
    fetchLeaderboard(client, vault).then(setRows);
  }, [vault]);
  return (
    <div className="card">
      <div className="text-lg mb-2 font-semibold">Leaderboard</div>
      <div className="text-sm opacity-70 mb-2">Top by total won</div>
      <div className="space-y-1">
        {rows.map((r,i)=>(
          <div key={i} className="flex justify-between text-sm">
            <div>{i+1}. {r.player}</div>
            <div>{formatEther(r.totalWin)} MON • {r.spins} spins</div>
          </div>
        ))}
        {rows.length===0 && <div className="text-sm opacity-60">No data yet.</div>}
      </div>
    </div>
  );
}

