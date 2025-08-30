"use client";
import { useEffect, useState } from "react";

type Reveal = { seed: `0x${string}`; hash: `0x${string}`; ts: number };

export default function FairnessPage() {
  const [items, setItems] = useState<Reveal[]>([]);
  useEffect(() => {
    fetch("/api/reveal").then(r=>r.json()).then(setItems);
  },[]);
  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="text-2xl font-semibold">Fairness</div>
      <div className="card text-sm">
        <div className="grid grid-cols-3 gap-2 font-mono">
          <div>Timestamp</div><div>Hash</div><div>Seed</div>
          {items.map((x,i)=>(
            <><div key={`t${i}`}>{new Date(x.ts*1000).toISOString()}</div>
              <div key={`h${i}`}>{x.hash}</div>
              <div key={`s${i}`}>{x.seed}</div></>
          ))}
        </div>
      </div>
    </main>
  );
}

