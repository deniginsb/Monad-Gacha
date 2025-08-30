import { NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { Hex, keccak256, encodeAbiParameters, toBytes } from "viem";
import { randomBytes } from "crypto";

const SIGNER_KEY = process.env.SIGNER_KEY as Hex;
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as Hex;
const SEASON_ID = BigInt(process.env.NEXT_PUBLIC_SEASON_ID || "1");
const account = SIGNER_KEY ? privateKeyToAccount(SIGNER_KEY) : undefined;

const revealQ: { seed: Hex; hash: Hex; ts: number }[] = [];
function pushReveal(seed: Hex) {
  const hash = keccak256(seed);
  revealQ.push({ seed, hash, ts: Math.floor(Date.now()/1000) });
  if (revealQ.length > 100) revealQ.shift();
}
export function getRevealList() { return revealQ; }

export async function POST(req: NextRequest) {
  try {
    if (!account) return NextResponse.json({ error: "Server SIGNER_KEY not set" }, { status: 500 });
    const { player } = await req.json();
    if (!player) return NextResponse.json({ error: "player required" }, { status: 400 });

    const roundId = Math.floor(Math.random()*1e9);
    const deadline = Math.floor(Date.now()/1000) + 120;

    const seed = ("0x"+randomBytes(32).toString("hex")) as Hex;
    const serverSeedHash = keccak256(seed);
    pushReveal(seed);

    const preimage = encodeAbiParameters(
      [
        { name:"vault", type:"address" },
        { name:"player", type:"address" },
        { name:"roundId", type:"uint256" },
        { name:"seasonId", type:"uint256" },
        { name:"deadline", type:"uint256" },
        { name:"serverSeedHash", type:"bytes32" }
      ],
      [VAULT_ADDRESS, player, BigInt(roundId), SEASON_ID, BigInt(deadline), serverSeedHash]
    );
    const messageHash = keccak256(preimage);
    const signature = await account.signMessage({ message: { raw: toBytes(messageHash) } });

    return NextResponse.json({ roundId, seasonId: Number(SEASON_ID), deadline, serverSeedHash, signature });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "seed error" }, { status: 500 });
  }
}

export const runtime = "nodejs";

