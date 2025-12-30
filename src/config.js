import { MANTLE_CONFIG, MANTLE_TESTNET_CONFIG, MANTLE_MAINNET_CONFIG } from "./config/mantle-config.js";

// Contract addresses from Mantle deployment
export const CONTRACT_ADDRESS = MANTLE_CONFIG.contracts.StealthAddressRegistry.address;
export const PAYMENT_MANAGER_ADDRESS = MANTLE_CONFIG.contracts.PaymentManager.address;

export const MAINNET_CHAINS = [
  // Mantle Mainnet (Primary network)
  {
    blockExplorerUrls: MANTLE_MAINNET_CONFIG.blockExplorerUrls,
    chainId: MANTLE_MAINNET_CONFIG.chainId,
    chainName: MANTLE_MAINNET_CONFIG.chainName,
    iconUrls: ["https://www.mantle.xyz/favicon.ico"],
    name: MANTLE_MAINNET_CONFIG.chainName,
    nativeCurrency: MANTLE_MAINNET_CONFIG.nativeCurrency,
    networkId: MANTLE_MAINNET_CONFIG.chainId,
    rpcUrls: MANTLE_MAINNET_CONFIG.rpcUrls,
    vanityName: "Mantle",
    group: "mantle",
  },
  // ethereum
  {
    blockExplorerUrls: ["https://etherscan.io"],
    chainId: 0x1,
    chainName: "Ethereum",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
    name: "Ethereum",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    networkId: 0x1,
    rpcUrls: ["https://eth.drpc.org"],
    vanityName: "Ethereum",
  },
  {
    blockExplorerUrls: ["https://bscscan.com"],
    chainId: 0x38,
    chainName: "Binance Smart Chain",
    chainlistUrl: "https://chainlist.org/chain/56",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/bnb.svg"],
    name: "Binance Smart Chain",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    networkId: 0x38,
    rpcUrls: ["https://binance.llamarpc.com"],
    vanityName: "Binance Smart Chain",
  },
];

export const TESTNET_CHAINS = [
  // Mantle Sepolia Testnet (Primary network)
  {
    blockExplorerUrls: MANTLE_TESTNET_CONFIG.blockExplorerUrls,
    chainId: MANTLE_TESTNET_CONFIG.chainId,
    chainName: MANTLE_TESTNET_CONFIG.chainName,
    iconUrls: ["https://www.mantle.xyz/favicon.ico"],
    name: MANTLE_TESTNET_CONFIG.chainName,
    nativeCurrency: MANTLE_TESTNET_CONFIG.nativeCurrency,
    networkId: MANTLE_TESTNET_CONFIG.chainId,
    rpcUrls: MANTLE_TESTNET_CONFIG.rpcUrls,
    vanityName: "Mantle Sepolia",
    group: "mantle",
  },
  // ethereum sepolia
  {
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
    chainId: 0xaa36a7,
    chainName: "Ethereum Sepolia",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
    name: "Ethereum Sepolia",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    networkId: 0xaa36a7,
    rpcUrls: ["https://sepolia.drpc.org"],
    vanityName: "Ethereum Sepolia",
  },
  // polygon amoy
  {
    blockExplorerUrls: ["https://amoy.polygonscan.com"],
    chainId: 0x13882,
    chainName: "Polygon Amoy",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/bsc.svg"],
    name: "Polygon Amoy",
    nativeCurrency: {
      name: "Pol",
      symbol: "POL",
      decimals: 18,
    },
    networkId: 0x13882,
    rpcUrls: ["https://polygon-amoy.drpc.org"],
    vanityName: "Polygon Amoy",
  },
];

export const customEvmNetworks =
  import.meta.env.VITE_APP_ENVIRONMENT === "dev"
    ? TESTNET_CHAINS
    : MAINNET_CHAINS;

export const CHAINS = [
  // Mantle Sepolia Testnet
  {
    id: MANTLE_TESTNET_CONFIG.chainId,
    name: MANTLE_TESTNET_CONFIG.chainName,
    chainlistUrl: "https://chainlist.org/chain/5003",
    rpcUrl: MANTLE_TESTNET_CONFIG.rpcUrls[0],
    nativeToken: MANTLE_TESTNET_CONFIG.nativeCurrency.symbol,
    blockExplorerUrl: MANTLE_TESTNET_CONFIG.blockExplorerUrls[0],
    imageUrl: "https://www.mantle.xyz/favicon.ico",
    isTestnet: true,
    network: "testnet",
  },
  // Mantle Mainnet
  {
    id: MANTLE_MAINNET_CONFIG.chainId,
    name: MANTLE_MAINNET_CONFIG.chainName,
    chainlistUrl: "https://chainlist.org/chain/5000",
    rpcUrl: MANTLE_MAINNET_CONFIG.rpcUrls[0],
    nativeToken: MANTLE_MAINNET_CONFIG.nativeCurrency.symbol,
    blockExplorerUrl: MANTLE_MAINNET_CONFIG.blockExplorerUrls[0],
    imageUrl: "https://www.mantle.xyz/favicon.ico",
    isTestnet: false,
    network: "mainnet",
  },
  // Mainnet Chains
  {
    id: 1,
    name: "Ethereum Mainnet",
    chainlistUrl: "https://chainlist.org/chain/1",
    rpcUrl: `https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`,
    nativeToken: "ETH",
    blockExplorerUrl: "https://etherscan.io",
    imageUrl: "https://filebucketz.sgp1.cdn.digitaloceanspaces.com/misc/chains/ethereum.svg",
    isTestnet: false,
    network: "mainnet",
  },
  {
    id: 137,
    name: "Polygon Mainnet",
    chainlistUrl: "https://chainlist.org/chain/137",
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`,
    nativeToken: "MATIC",
    blockExplorerUrl: "https://polygonscan.com",
    imageUrl: "https://filebucketz.sgp1.cdn.digitaloceanspaces.com/misc/chains/matic.svg",
    isTestnet: false,
    network: "mainnet",
  },
  {
    id: 56,
    name: "Binance Smart Chain",
    chainlistUrl: "https://chainlist.org/chain/56",
    rpcUrl: `https://bsc-mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`,
    nativeToken: "BNB",
    blockExplorerUrl: "https://bscscan.com/",
    imageUrl: "https://filebucketz.sgp1.cdn.digitaloceanspaces.com/misc/chains/bsc.svg",
    isTestnet: false,
    network: "mainnet",
  },
  // Testnet Chains
  {
    id: 11155111,
    name: "Ethereum Sepolia",
    chainlistUrl: "https://chainlist.org/chain/11155111",
    rpcUrl: `https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`,
    nativeToken: "ETH",
    blockExplorerUrl: "https://sepolia.etherscan.io/",
    imageUrl: "https://filebucketz.sgp1.cdn.digitaloceanspaces.com/misc/chains/ethereum.svg",
    isTestnet: true,
    network: "testnet",
  },
];
