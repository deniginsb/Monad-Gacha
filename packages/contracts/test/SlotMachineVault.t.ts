import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256, toUtf8Bytes, parseEther, getBytes } from "ethers";

function personalHash(encoded: string | Uint8Array) {
  const data = typeof encoded === "string" ? getBytes(encoded) : encoded;
  const prefix = `\x19Ethereum Signed Message:\n${data.length}`;
  return keccak256(new Uint8Array([...toUtf8Bytes(prefix), ...data]));
}

describe("SlotMachineVault", () => {
  it("deploys and sets symbols", async () => {
    const [owner, signer, player] = await ethers.getSigners();
    const C = await ethers.getContractFactory("SlotMachineVault");
    const c = await C.deploy(
      parseEther("0.1"),
      1, parseEther("5"), parseEther("100"), parseEther("10"),
      signer.address
    );
    await c.waitForDeployment();

    const symbols = [
      { name: "single", imageURI: "", weight: 100, multiplier: 200 }
    ];
    await (await c.setSymbols(symbols)).wait();

    const roundId = 123;
    const deadline = Math.floor(Date.now()/1000) + 3600;
    const serverSeedHash = keccak256(toUtf8Bytes("seed-abc"));

    const digest = personalHash(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address","address","uint256","uint256","uint256","bytes32"],
        [await c.getAddress(), player.address, roundId, 1, deadline, serverSeedHash]
      )
    );

    const signature = await signer.signMessage(ethers.getBytes(digest));

    await (await owner.sendTransaction({ to: await c.getAddress(), value: parseEther("10") })).wait();

    const tx = await c.connect(player).spin(roundId, deadline, serverSeedHash, signature, { value: parseEther("0.1") });
    const rc = await tx.wait();

    const ev = rc!.logs.find(l => (l as any).fragment?.name === "SpinResult") as any;
    expect(ev).to.exist;
    const payout = ev.args.payout as bigint;

    expect(payout).to.equal(parseEther("0.2"));
  });

  it("rejects bad signature / replay", async () => {
    const [owner, signer, player] = await ethers.getSigners();
    const C = await ethers.getContractFactory("SlotMachineVault");
    const c = await C.deploy(
      parseEther("0.1"),
      1, parseEther("5"), parseEther("100"), parseEther("10"),
      signer.address
    );
    await c.waitForDeployment();
    await (await c.setSymbols([{ name: "x", imageURI: "", weight: 100, multiplier: 100 }])).wait();
    await (await owner.sendTransaction({ to: await c.getAddress(), value: parseEther("1") })).wait();

    const roundId = 1;
    const deadline = Math.floor(Date.now()/1000) + 3600;
    const serverSeedHash = keccak256(toUtf8Bytes("seed"));

    const digest = personalHash(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address","address","uint256","uint256","uint256","bytes32"],
        [await c.getAddress(), player.address, roundId, 1, deadline, serverSeedHash]
      )
    );
    const sigBad = await owner.signMessage(ethers.getBytes(digest));
    await expect(
      c.connect(player).spin(roundId, deadline, serverSeedHash, sigBad, { value: parseEther("0.1") })
    ).to.be.revertedWith("bad sig");
  });

  it("caps payout", async () => {
    const [owner, signer, player] = await ethers.getSigners();
    const C = await ethers.getContractFactory("SlotMachineVault");
    const c = await C.deploy(
      parseEther("0.1"),
      1, parseEther("0.05"), parseEther("0.05"), parseEther("0.05"),
      signer.address
    );
    await c.waitForDeployment();
    await (await c.setSymbols([{ name: "jackpot", imageURI: "", weight: 100, multiplier: 5000 }])).wait();
    await (await owner.sendTransaction({ to: await c.getAddress(), value: parseEther("10") })).wait();

    const roundId = 7;
    const deadline = Math.floor(Date.now()/1000) + 3600;
    const serverSeedHash = keccak256(toUtf8Bytes("seed"));

    const digest = personalHash(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address","address","uint256","uint256","uint256","bytes32"],
        [await c.getAddress(), player.address, roundId, 1, deadline, serverSeedHash]
      )
    );
    const sig = await signer.signMessage(ethers.getBytes(digest));

    const tx = await c.connect(player).spin(roundId, deadline, serverSeedHash, sig, { value: parseEther("0.1") });
    const rc = await tx.wait();
    const ev = rc!.logs.find(l => (l as any).fragment?.name === "SpinResult") as any;
    const payout = ev.args.payout as bigint;

    expect(payout).to.equal(parseEther("0.05"));
  });
});

