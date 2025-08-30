"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";

export type SymbolMeta = { name: string; imageURI: string; };

export default function Reels({ symbols, result }:{ symbols: SymbolMeta[]; result?: number[] }) {
  const [spinning, setSpinning] = useState(false);
  const [reelVals, setReelVals] = useState([0,0,0]);

  useEffect(() => {
    if (result) setReelVals(result);
  }, [result]);

  useEffect(() => {
    let id: any;
    if (spinning) {
      id = setInterval(() => {
        setReelVals(v => v.map(() => Math.floor(Math.random() * symbols.length)));
      }, 80);
    }
    return () => clearInterval(id);
  }, [spinning, symbols.length]);

  return (
    <div className="grid grid-cols-3 gap-3 my-4">
      {[0,1,2].map(i => (
        <div key={i} className={clsx("card h-32 flex items-center justify-center overflow-hidden", spinning && "animate-pulse")}>
          {symbols[reelVals[i]] ? (
            <div className="flex flex-col items-center">
              {symbols[reelVals[i]].imageURI ? (
                <img src={symbols[reelVals[i]].imageURI} alt={symbols[reelVals[i]].name} className="h-16 w-16 object-contain" />
              ) : <div className="text-2xl">{symbols[reelVals[i]].name}</div>}
            </div>
          ) : <div>—</div>}
        </div>
      ))}
      <style jsx>{`
        .animate-pulse { animation: pulse 0.6s infinite; }
        @keyframes pulse { 50% { opacity: .5 } }
      `}</style>
    </div>
  );
}

export function useReelsSpin() {
  const [spinning, setSpinning] = useState(false);
  const start = () => setSpinning(true);
  const stop  = () => setSpinning(false);
  return { spinning, start, stop };
}

