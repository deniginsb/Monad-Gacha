import { Address, PublicClient, getAddress } from "viem";

export async function fetchLeaderboard(client: PublicClient, vault: Address, fromBlock?: bigint, toBlock?: bigint) {
  const logs = await client.getLogs({
    address: vault,
    event: {
      type: 'event',
      name: 'SpinResult',
      inputs: [
        { indexed: true, name: 'player', type: 'address' },
        { indexed: false, name: 'seasonId', type: 'uint256' },
        { indexed: false, name: 'roundId', type: 'uint256' },
        { indexed: false, name: 'reels', type: 'uint8[3]' },
        { indexed: false, name: 'payout', type: 'uint256' }
      ]
    } as any,
    fromBlock: fromBlock ?? 0n,
    toBlock: toBlock ?? 'latest'
  });

  const map = new Map<string, { spins: number; totalWin: bigint }>();
  for (const lg of logs) {
    const player = getAddress(`0x${lg.topics[1]!.slice(26)}`);
    const payout = (lg as any).args?.payout as bigint ?? 0n;
    const entry = map.get(player) ?? { spins: 0, totalWin: 0n };
    entry.spins += 1; entry.totalWin += payout;
    map.set(player, entry);
  }
  const arr = [...map.entries()].map(([player, v]) => ({ player, ...v }));
  arr.sort((a, b) => Number(b.totalWin - a.totalWin));
  return arr.slice(0, 20);
}

