/**
 * Mantle Network Configuration
 * Configuration for Mantle mainnet and Sepolia testnet integration
 */

export const MANTLE_TESTNET_CONFIG = {
  // Network Information
  chainId: 5003,
  chainName: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18
  },
  rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
  blockExplorerUrls: ['https://sepolia.mantlescan.xyz'],
  
  // Contract Addresses (deployed on Mantle Sepolia)
  contracts: {
    StealthAddressRegistry: {
      address: '0x6F40A56250fbB57F5a17C815BE66A36804590669',
      deploymentBlock: 32784334
    },
    PaymentManager: {
      address: '0x95bc083e6911DeBc46b36cDCE8996fAEB28bf9A6',
      deploymentBlock: 32784339
    }
  },
  
  // Gas Configuration (Mantle has lower gas costs)
  gas: {
    limit: 8000000,
    price: 20000000, // 0.02 gwei
    maxFeePerGas: 50000000, // 0.05 gwei
    maxPriorityFeePerGas: 1000000 // 0.001 gwei
  },
  
  // Transaction Configuration
  transaction: {
    confirmations: 1,
    timeout: 60000,
    retries: 3
  },
  
  // Stealth Address Configuration
  stealth: {
    viewHintBytes: 1,
    maxDerivationIndex: 2147483647,
    defaultK: 0
  },
  
  // Payment Links Configuration
  paymentLinks: {
    baseUrl: 'https://privatepay.me',
    maxAliasLength: 15,
    allowedCharacters: /^[a-z0-9]+$/,
    qrCodeSize: 256
  }
};

export const MANTLE_MAINNET_CONFIG = {
  // Network Information
  chainId: 5000,
  chainName: 'Mantle',
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18
  },
  rpcUrls: ['https://rpc.mantle.xyz'],
  wsUrls: ['wss://wss.mantle.xyz'],
  blockExplorerUrls: ['https://mantlescan.xyz'],
  
  // Contract Addresses (updated after deployment)
  contracts: {
    StealthAddressRegistry: {
      address: '',
      deploymentBlock: 0
    },
    PaymentManager: {
      address: '',
      deploymentBlock: 0
    }
  },
  
  // Gas Configuration
  gas: {
    limit: 8000000,
    price: 20000000,
    maxFeePerGas: 50000000,
    maxPriorityFeePerGas: 1000000
  },
  
  // Transaction Configuration
  transaction: {
    confirmations: 1,
    timeout: 60000,
    retries: 3
  },
  
  // Stealth Address Configuration
  stealth: {
    viewHintBytes: 1,
    maxDerivationIndex: 2147483647,
    defaultK: 0
  },
  
  // Payment Links Configuration
  paymentLinks: {
    baseUrl: 'https://privatepay.me',
    maxAliasLength: 15,
    allowedCharacters: /^[a-z0-9]+$/,
    qrCodeSize: 256
  }
};

// Current active configuration (default to testnet)
export const MANTLE_CONFIG = MANTLE_TESTNET_CONFIG;

// MetaMask network addition helper
export const addMantleNetworkToMetaMask = async (isMainnet = false) => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const config = isMainnet ? MANTLE_MAINNET_CONFIG : MANTLE_TESTNET_CONFIG;

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${config.chainId.toString(16)}`,
        chainName: config.chainName,
        nativeCurrency: config.nativeCurrency,
        rpcUrls: config.rpcUrls,
        blockExplorerUrls: config.blockExplorerUrls
      }]
    });
    return true;
  } catch (error) {
    console.error('Failed to add Mantle network to MetaMask:', error);
    throw error;
  }
};

// Network switching helper
export const switchToMantleNetwork = async (isMainnet = false) => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const config = isMainnet ? MANTLE_MAINNET_CONFIG : MANTLE_TESTNET_CONFIG;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${config.chainId.toString(16)}` }]
    });
    return true;
  } catch (error) {
    // If network doesn't exist, try to add it
    if (error.code === 4902) {
      return await addMantleNetworkToMetaMask(isMainnet);
    }
    console.error('Failed to switch to Mantle network:', error);
    throw error;
  }
};

// Validate Mantle address format (EVM compatible)
export const isValidMantleAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Format MNT amount with proper decimals
export const formatMNTAmount = (amount, decimals = 4) => {
  const mntAmount = parseFloat(amount) / Math.pow(10, 18);
  return mntAmount.toFixed(decimals);
};

// Convert MNT amount to wei
export const mntToWei = (mntAmount) => {
  return (parseFloat(mntAmount) * Math.pow(10, 18)).toString();
};

// Convert wei to MNT
export const weiToMNT = (weiAmount) => {
  return (parseFloat(weiAmount) / Math.pow(10, 18)).toString();
};

// Check if current network is Mantle
export const isMantleNetwork = (chainId) => {
  return chainId === MANTLE_TESTNET_CONFIG.chainId || chainId === MANTLE_MAINNET_CONFIG.chainId;
};

// Get config by chain ID
export const getMantleConfigByChainId = (chainId) => {
  if (chainId === MANTLE_MAINNET_CONFIG.chainId) {
    return MANTLE_MAINNET_CONFIG;
  }
  return MANTLE_TESTNET_CONFIG;
};

export default MANTLE_CONFIG;
