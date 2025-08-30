import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const MONAD_RPC = process.env.MONAD_RPC || "https://testnet-rpc.monad.xyz";
const PK = process.env.PRIVATE_KEY || "0x" + "1".repeat(64);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    monadTestnet: {
      url: MONAD_RPC,
      chainId: 10143,
      accounts: [PK]
    }
  }
};

export default config;

