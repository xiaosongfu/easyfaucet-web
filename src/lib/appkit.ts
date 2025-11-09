// lib/appkit.ts
import { browser } from "$app/environment";
import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bscTestnet } from "@reown/appkit/networks";

// Only initialize in browser environment
let appKit: ReturnType<typeof createAppKit> | undefined = undefined;
let wagmiAdapter: WagmiAdapter | undefined = undefined;

if (browser) {
  const projectId = "ff6b9e9edcf34c61406a30878ceea7dc"; //import.meta.env.VITE_PROJECT_ID
  if (!projectId) {
    throw new Error("VITE_PROJECT_ID is not set");
  }

  const networks = [bscTestnet];

  // Create adapter
  wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
  });

  // Initialize AppKit
  appKit = createAppKit({
    adapters: [wagmiAdapter],
    networks: [bscTestnet],
    defaultNetwork: bscTestnet,
    projectId,
    metadata: {
      name: "easyfaucet",
      description: "easyfaucet web",
      url: "https://reown.com/appkit",
      icons: ["https://avatars.githubusercontent.com/u/179229932?s=200&v=4"],
    },
  });
}

export { appKit, wagmiAdapter };
