import { keccak256, encodeAbiParameters, getAddress } from "viem";

export function buildDigest(contract: `0x${string}`, player: `0x${string}`, roundId: bigint, seasonId: bigint, deadline: bigint, serverSeedHash: `0x${string}`) {
  const payload = encodeAbiParameters(
    [
      { name: "vault", type: "address" },
      { name: "player", type: "address" },
      { name: "roundId", type: "uint256" },
      { name: "seasonId", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "serverSeedHash", type: "bytes32" }
    ],
    [getAddress(contract), getAddress(player), roundId, seasonId, deadline, serverSeedHash]
  );
  return keccak256(payload);
}

export function hashSeed(seedHex: `0x${string}`) {
  return keccak256(seedHex);
}

