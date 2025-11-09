// 合约配置 - 多链支持

export interface ChainConfig {
  chainId: number;
  chainName: string;
  beaconAddress: `0x${string}`;
  factoryAddress: `0x${string}`;
  deployBlock: bigint;
}

// BSC Testnet 配置
export const BSC_TESTNET_CONFIG: ChainConfig = {
  chainId: 97,
  chainName: "BSC Testnet",
  beaconAddress: "0xc633E74171C61Ede8913d5C7fC2F16bad3290E7A",
  factoryAddress: "0x00c706EaC85100E127A087966F0bc73a5b2ceaf0",
  deployBlock: 71805318n,
};

// Ethereum Sepolia 配置
export const SEPOLIA_CONFIG: ChainConfig = {
  chainId: 11155111,
  chainName: "Sepolia",
  beaconAddress: "0x6D239B2127Fba527f4a280c1780aa74FC3Add7E0",
  factoryAddress: "0x8C7270053166EA8D8d7A5F7bee73c30b26B7049F",
  deployBlock: 9594114n,
};

// 所有支持的链配置
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [BSC_TESTNET_CONFIG.chainId]: BSC_TESTNET_CONFIG,
  [SEPOLIA_CONFIG.chainId]: SEPOLIA_CONFIG,
};

// 获取指定链的配置
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return CHAIN_CONFIGS[chainId];
}

// 获取当前链的配置（默认 BSC Testnet）
export function getCurrentChainConfig(chainId?: number): ChainConfig {
  if (!chainId) {
    return BSC_TESTNET_CONFIG;
  }
  return CHAIN_CONFIGS[chainId] || BSC_TESTNET_CONFIG;
}

// 检查链是否被支持
export function isSupportedChain(chainId: number): boolean {
  return chainId in CHAIN_CONFIGS;
}

// 获取所有支持的链 ID
export function getSupportedChainIds(): number[] {
  return Object.keys(CHAIN_CONFIGS).map(Number);
}
