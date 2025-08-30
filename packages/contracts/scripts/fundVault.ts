import { ethers } from "hardhat";

async function main() {
  const VAULT = process.env.VAULT_ADDRESS!;
  if (!VAULT) throw new Error("Set VAULT_ADDRESS");
  const [sender] = await ethers.getSigners();
  const amount = ethers.parseEther(process.env.FUND_AMOUNT || "50");
  const tx = await sender.sendTransaction({ to: VAULT, value: amount });
  await tx.wait();
  console.log(`Funded vault ${VAULT} with ${ethers.formatEther(amount)} MON`);
}

main().catch((e) => { console.error(e); process.exit(1); });

