// lib/appkit.ts
import { browser } from "$app/environment";
import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bscTestnet, sepolia } from "@reown/appkit/networks";

// Only initialize in browser environment
let appKit: ReturnType<typeof createAppKit> | undefined = undefined;
let wagmiAdapter: WagmiAdapter | undefined = undefined;

if (browser) {
  const projectId = "ff6b9e9edcf34c61406a30878ceea7dc"; //import.meta.env.VITE_PROJECT_ID
  if (!projectId) {
    throw new Error("VITE_PROJECT_ID is not set");
  }

  // 支持的网络列表
  const networks = [bscTestnet, sepolia] as const;

  // Create adapter
  wagmiAdapter = new WagmiAdapter({
    networks: networks as any,
    projectId,
  });

  // Initialize AppKit
  appKit = createAppKit({
    adapters: [wagmiAdapter],
    networks: [bscTestnet, sepolia],
    defaultNetwork: bscTestnet,
    projectId,
    metadata: {
      name: "easyfaucet",
      description: "easyfaucet web",
      url: "https://reown.com/appkit",
      icons: ["https://avatars.githubusercontent.com/u/179229932?s=200&v=4"],
    },
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": "#667eea",
      "--w3m-border-radius-master": "12px",
      "--w3m-font-size-master": "14px",
    },
    featuredWalletIds: [],
  });
}

export { appKit, wagmiAdapter };
