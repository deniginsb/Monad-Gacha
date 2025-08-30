"use client";
export default function ResultModal({ payout, onClose }:{ payout?: string; onClose:()=>void }) {
  if (payout === undefined) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="card max-w-sm">
        <div className="text-lg font-semibold mb-2">Result</div>
        <div className="mb-4">{payout === "0" ? "No win this time." : `You won ${payout} MON!`}</div>
        <button className="btn" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

