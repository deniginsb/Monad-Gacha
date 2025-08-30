import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const entryFee = ethers.parseEther("0.1");
  const seasonId = 1n;
  const maxPerSpin = ethers.parseEther("5");
  const dailyCap = ethers.parseEther("500");
  const perUserCap = ethers.parseEther("50");
  const signer = process.env.SIGNER_ADDRESS!;
  if (!signer) throw new Error("Set SIGNER_ADDRESS in .env");

  const Factory = await ethers.getContractFactory("SlotMachineVault");
  const c = await Factory.deploy(entryFee, seasonId, maxPerSpin, dailyCap, perUserCap, signer);
  await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log("Deployed SlotMachineVault at:", addr);

  const symbols = [
    { name: "cherry",  imageURI: "", weight: 40, multiplier: 120 },
    { name: "lemon",   imageURI: "", weight: 30, multiplier: 200 },
    { name: "seven",   imageURI: "", weight: 15, multiplier: 800 },
    { name: "diamond", imageURI: "", weight: 10, multiplier: 1500 },
    { name: "mythic",  imageURI: "", weight: 5,  multiplier: 5000 }
  ];

  const tx = await c.setSymbols(symbols);
  await tx.wait();
  console.log("Symbols set.");
}

main().catch((e) => { console.error(e); process.exit(1); });

