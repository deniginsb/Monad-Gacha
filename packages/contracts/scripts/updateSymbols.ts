import { ethers } from "hardhat";

async function main() {
  const VAULT = process.env.VAULT_ADDRESS!;
  if (!VAULT) throw new Error("Set VAULT_ADDRESS");
  const c = await ethers.getContractAt("SlotMachineVault", VAULT);

  const symbols = [
    { name: "cherry",  imageURI: "ipfs://...", weight: 40, multiplier: 120 },
    { name: "lemon",   imageURI: "ipfs://...", weight: 30, multiplier: 200 },
    { name: "seven",   imageURI: "ipfs://...", weight: 15, multiplier: 800 },
    { name: "diamond", imageURI: "ipfs://...", weight: 10, multiplier: 1500 },
    { name: "mythic",  imageURI: "ipfs://...", weight: 5,  multiplier: 5000 }
  ];

  const tx = await c.setSymbols(symbols);
  await tx.wait();
  console.log("Symbols updated.");
}

main().catch((e) => { console.error(e); process.exit(1); });

