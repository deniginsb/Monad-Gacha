"use client";
import { createConfig, http } from "wagmi";
import { monadTestnet } from "./chain-monad";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { cookieStorage, createStorage } from "wagmi";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "demo";

export const wagmiConfig = createConfig(
  defaultWagmiConfig({
    projectId,
    chains: [monadTestnet],
    transports: { [monadTestnet.id]: http(monadTestnet.rpcUrls.default.http[0]) },
    storage: createStorage({ storage: cookieStorage })
  })
);

