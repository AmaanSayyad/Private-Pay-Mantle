/**
 * Mantle Network Utility Functions
 */

import { MANTLE_CONFIG, MANTLE_TESTNET_CONFIG, MANTLE_MAINNET_CONFIG } from '../config/mantle-config.js';

/**
 * Get Mantle transaction URL for block explorer
 * @param {string} txHash - Transaction hash
 * @param {string} network - 'testnet' or 'mainnet'
 * @returns {string} Block explorer URL
 */
export const getMantleTransactionUrl = (txHash, network = 'testnet') => {
  if (!txHash || typeof txHash !== 'string') {
    return '';
  }
  
  const baseUrl = network === 'mainnet' 
    ? MANTLE_MAINNET_CONFIG.blockExplorerUrls[0]
    : MANTLE_TESTNET_CONFIG.blockExplorerUrls[0];
    
  return `${baseUrl}/tx/${txHash}`;
};

/**
 * Get Mantle address URL for block explorer
 * @param {string} address - Wallet address
 * @param {string} network - 'testnet' or 'mainnet'
 * @returns {string} Block explorer URL
 */
export const getMantleAddressUrl = (address, network = 'testnet') => {
  if (!address || typeof address !== 'string') {
    return '';
  }
  
  const baseUrl = network === 'mainnet'
    ? MANTLE_MAINNET_CONFIG.blockExplorerUrls[0]
    : MANTLE_TESTNET_CONFIG.blockExplorerUrls[0];
    
  return `${baseUrl}/address/${address}`;
};

/**
 * Get Mantle block URL for block explorer
 * @param {number|string} blockNumber - Block number
 * @param {string} network - 'testnet' or 'mainnet'
 * @returns {string} Block explorer URL
 */
export const getMantleBlockUrl = (blockNumber, network = 'testnet') => {
  const baseUrl = network === 'mainnet'
    ? MANTLE_MAINNET_CONFIG.blockExplorerUrls[0]
    : MANTLE_TESTNET_CONFIG.blockExplorerUrls[0];
    
  return `${baseUrl}/block/${blockNumber}`;
};

/**
 * Format MNT balance for display
 * @param {string|number|bigint} balance - Balance in wei
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted balance
 */
export const formatMNTBalance = (balance, decimals = 4) => {
  if (!balance) return '0';
  
  const balanceNum = typeof balance === 'bigint' 
    ? Number(balance) / 1e18
    : parseFloat(balance) / 1e18;
    
  return balanceNum.toFixed(decimals);
};

/**
 * Parse MNT amount to wei
 * @param {string|number} amount - Amount in MNT
 * @returns {bigint} Amount in wei
 */
export const parseMNTToWei = (amount) => {
  return BigInt(Math.floor(parseFloat(amount) * 1e18));
};

/**
 * Format wei to MNT
 * @param {string|number|bigint} wei - Amount in wei
 * @returns {string} Amount in MNT
 */
export const formatWeiToMNT = (wei) => {
  const weiNum = typeof wei === 'bigint' ? wei : BigInt(wei);
  return (Number(weiNum) / 1e18).toString();
};

/**
 * Shorten address for display
 * @param {string} address - Full address
 * @param {number} chars - Number of characters to show on each side
 * @returns {string} Shortened address
 */
export const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Shorten transaction hash for display
 * @param {string} hash - Full transaction hash
 * @param {number} chars - Number of characters to show on each side
 * @returns {string} Shortened hash
 */
export const shortenTxHash = (hash, chars = 6) => {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
};

/**
 * Check if address is valid Mantle/EVM address
 * @param {string} address - Address to validate
 * @returns {boolean}
 */
export const isValidMantleAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Check if transaction hash is valid
 * @param {string} hash - Transaction hash to validate
 * @returns {boolean}
 */
export const isValidTxHash = (hash) => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

/**
 * Get network name from chain ID
 * @param {number} chainId - Chain ID
 * @returns {string} Network name
 */
export const getNetworkName = (chainId) => {
  if (chainId === 5003) return 'Mantle Sepolia Testnet';
  if (chainId === 5000) return 'Mantle Mainnet';
  return 'Unknown Network';
};

/**
 * Check if chain ID is Mantle network
 * @param {number} chainId - Chain ID
 * @returns {boolean}
 */
export const isMantleChainId = (chainId) => {
  return chainId === 5003 || chainId === 5000;
};

/**
 * Get fallback gas values for Mantle
 * @returns {Object} Fallback gas configuration
 */
export const getFallbackGasValues = () => {
  return {
    gasLimit: 21000,
    gasPrice: 20000000, // 0.02 gwei
    maxFeePerGas: 50000000,
    maxPriorityFeePerGas: 1000000
  };
};

/**
 * Calculate estimated transaction time based on gas price
 * @param {string|number} gasPrice - Gas price in wei
 * @returns {string} Estimated time
 */
export const estimateTransactionTime = (gasPrice) => {
  const price = BigInt(gasPrice);
  const basePrice = 20000000n;
  
  if (price >= basePrice * 15n / 10n) return '~15 seconds';
  if (price >= basePrice * 12n / 10n) return '~30 seconds';
  return '~60 seconds';
};

export default {
  getMantleTransactionUrl,
  getMantleAddressUrl,
  getMantleBlockUrl,
  formatMNTBalance,
  parseMNTToWei,
  formatWeiToMNT,
  shortenAddress,
  shortenTxHash,
  isValidMantleAddress,
  isValidTxHash,
  getNetworkName,
  isMantleChainId,
  getFallbackGasValues,
  estimateTransactionTime
};


/**
 * Format MNT amount with proper decimals
 * @param {string|number} amount - Amount in wei or MNT
 * @param {boolean} fromWei - Whether amount is in wei (default: false)
 * @param {number} decimals - Decimal places to show (default: 4)
 * @returns {string} Formatted amount
 */
export const formatMNTAmount = (amount, fromWei = false, decimals = 4) => {
  if (!amount) return '0';
  
  let mntAmount;
  if (fromWei) {
    mntAmount = parseFloat(amount) / Math.pow(10, 18);
  } else {
    mntAmount = parseFloat(amount);
  }
  
  return mntAmount.toFixed(decimals);
};

/**
 * Convert wei to MNT
 * @param {string|number} weiAmount - Amount in wei
 * @returns {string} Amount in MNT
 */
export const weiToMNT = (weiAmount) => {
  if (!weiAmount) return '0';
  return (parseFloat(weiAmount) / Math.pow(10, 18)).toString();
};

/**
 * Get network display information
 * @param {string} network - Network identifier ('mantle' or 'aptos')
 * @returns {Object} Network display information
 */
export const getNetworkDisplayInfo = (network = 'mantle') => {
  const networkInfo = {
    mantle: {
      symbol: 'MNT',
      name: 'Mantle Network',
      icon: 'https://www.mantle.xyz/favicon.ico',
      color: 'primary',
      explorerUrl: MANTLE_TESTNET_CONFIG.blockExplorerUrls[0],
      isEVM: true
    },
    aptos: {
      symbol: 'APT',
      name: 'Aptos Network',
      icon: 'https://aptoslabs.com/favicon.ico',
      color: 'warning',
      explorerUrl: 'https://explorer.aptoslabs.com',
      isEVM: false
    }
  };

  return networkInfo[network.toLowerCase()] || networkInfo.mantle;
};

/**
 * Determine transaction network from transaction data
 * @param {Object} transaction - Transaction object
 * @returns {string} Network identifier
 */
export const determineTransactionNetwork = (transaction) => {
  if (transaction.network) {
    return transaction.network;
  }

  if (transaction.mantle_transaction_hash || transaction.mantle_block_number || transaction.gas_used) {
    return 'mantle';
  }

  if (transaction.sender_address?.startsWith('0x') || transaction.recipient_address?.startsWith('0x')) {
    return 'mantle';
  }

  return transaction.created_at && new Date(transaction.created_at) < new Date('2024-01-01') ? 'aptos' : 'mantle';
};

/**
 * Format transaction amount with network-specific symbol
 * @param {number|string} amount - Transaction amount
 * @param {string} network - Network identifier
 * @param {boolean} isPositive - Whether amount is positive (received) or negative (sent)
 * @returns {string} Formatted amount string
 */
export const formatTransactionAmount = (amount, network = 'mantle', isPositive = true) => {
  const networkInfo = getNetworkDisplayInfo(network);
  const sign = isPositive ? '+' : '-';
  const absAmount = Math.abs(parseFloat(amount));
  const formattedAmount = absAmount.toFixed(4);
  
  return `${sign}${formattedAmount} ${networkInfo.symbol}`;
};

/**
 * Get transaction explorer URL
 * @param {string} txHash - Transaction hash
 * @param {string} network - Network identifier
 * @returns {string} Explorer URL
 */
export const getTransactionExplorerUrl = (txHash, network = 'mantle') => {
  const networkInfo = getNetworkDisplayInfo(network);
  
  if (network === 'mantle') {
    return `${networkInfo.explorerUrl}/tx/${txHash}`;
  } else if (network === 'aptos') {
    return `${networkInfo.explorerUrl}/txn/${txHash}`;
  }
  
  return `${networkInfo.explorerUrl}/tx/${txHash}`;
};

/**
 * Check if transaction is from legacy Aptos network
 * @param {Object} transaction - Transaction object
 * @returns {boolean} True if transaction is from Aptos
 */
export const isLegacyAptosTransaction = (transaction) => {
  return determineTransactionNetwork(transaction) === 'aptos';
};

/**
 * Get network indicator badge props
 * @param {string} network - Network identifier
 * @returns {Object} Badge props for UI components
 */
export const getNetworkBadgeProps = (network = 'mantle') => {
  const networkInfo = getNetworkDisplayInfo(network);
  
  return {
    label: network.toUpperCase(),
    color: networkInfo.color,
    variant: 'flat',
    size: 'sm'
  };
};
