"use client";
import { Address, createPublicClient, createWalletClient, custom, http, parseEther } from "viem";
import { monadTestnet } from "../lib/chain-monad";
import { SlotMachineVaultABI } from "../lib/abi/SlotMachineVault";
import { useEffect, useState } from "react";

type SymbolRow = { name:string; imageURI:string; weight:number; multiplier:number; };

export default function AdminPanel({ vault }: { vault: Address }) {
  const [symbols, setSymbols] = useState<SymbolRow[]>([]);
  const [entryFee, setEntryFee] = useState("0.1");
  const [caps, setCaps] = useState({ maxPerSpin: "5", dailyCap: "500", perUserCap: "50" });

  useEffect(() => {
    const client = createPublicClient({ chain: monadTestnet, transport: http() });
    (async () => {
      const [list] = await client.readContract({ address: vault, abi: SlotMachineVaultABI, functionName: "getSymbols" }) as any;
      setSymbols(list.map((s:any)=>({ name:s.name, imageURI:s.imageURI, weight:Number(s.weight), multiplier:Number(s.multiplier) })));
    })();
  }, [vault]);

  async function saveSymbols() {
    const wallet = createWalletClient({ chain: monadTestnet, transport: custom((window as any).ethereum) });
    await wallet.writeContract({ address: vault, abi: SlotMachineVaultABI, functionName: "setSymbols", args: [symbols] });
    alert("Symbols updated");
  }

  async function saveEntry() {
    const wallet = createWalletClient({ chain: monadTestnet, transport: custom((window as any).ethereum) });
    await wallet.writeContract({ address: vault, abi: SlotMachineVaultABI, functionName: "setEntryFee", args: [parseEther(entryFee)] });
    alert("Entry fee updated");
  }

  async function saveCaps() {
    const wallet = createWalletClient({ chain: monadTestnet, transport: custom((window as any).ethereum) });
    await wallet.writeContract({
      address: vault, abi: SlotMachineVaultABI, functionName: "setCaps",
      args: [parseEther(caps.maxPerSpin), parseEther(caps.dailyCap), parseEther(caps.perUserCap)]
    });
    alert("Caps updated");
  }

  function setField(i:number, key:keyof SymbolRow, val:string) {
    setSymbols(prev => prev.map((s,idx)=> idx===i ? { ...s, [key]: key==="weight"||key==="multiplier" ? Number(val) : val } : s));
  }

  return (
    <div className="card space-y-4">
      <div className="text-xl font-semibold">Admin Panel</div>

      <div className="space-y-2">
        <div className="font-medium">Entry Fee (MON)</div>
        <div className="flex gap-2">
          <input className="card w-40" value={entryFee} onChange={e=>setEntryFee(e.target.value)} />
          <button className="btn" onClick={saveEntry}>Save</button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Caps (MON)</div>
        <div className="grid grid-cols-3 gap-2 max-w-xl">
          <input className="card" value={caps.maxPerSpin} onChange={e=>setCaps({...caps, maxPerSpin: e.target.value})} placeholder="maxPerSpin" />
          <input className="card" value={caps.dailyCap} onChange={e=>setCaps({...caps, dailyCap: e.target.value})} placeholder="dailyCap" />
          <input className="card" value={caps.perUserCap} onChange={e=>setCaps({...caps, perUserCap: e.target.value})} placeholder="perUserCap" />
        </div>
        <button className="btn" onClick={saveCaps}>Save Caps</button>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Symbols</div>
        <div className="space-y-3">
          {symbols.map((s, i)=>(
            <div key={i} className="grid grid-cols-5 gap-2">
              <input className="card" value={s.name} onChange={e=>setField(i,"name",e.target.value)} placeholder="name" />
              <input className="card col-span-2" value={s.imageURI} onChange={e=>setField(i,"imageURI",e.target.value)} placeholder="ipfs://..." />
              <input className="card" value={s.weight} onChange={e=>setField(i,"weight",e.target.value)} placeholder="weight" />
              <input className="card" value={s.multiplier} onChange={e=>setField(i,"multiplier",e.target.value)} placeholder="multiplier(=100=>1x)" />
            </div>
          ))}
          <div className="flex gap-2">
            <button className="btn" onClick={()=>setSymbols([...symbols, { name:"new", imageURI:"", weight:1, multiplier:100 }])}>+ Add Symbol</button>
            <button className="btn" onClick={saveSymbols}>Save Symbols</button>
          </div>
        </div>
      </div>
    </div>
  );
}

