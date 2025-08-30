"use client";
import { useBalance, useAccount } from "wagmi";
export default function BalanceMON() {
  const { address } = useAccount();
  const { data } = useBalance({ address });
  return <div className="text-sm opacity-80">{data ? `Balance: ${data.formatted} ${data.symbol}` : "—"}</div>;
}

