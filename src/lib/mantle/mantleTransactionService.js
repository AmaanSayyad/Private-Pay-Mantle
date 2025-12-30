/**
 * Mantle Transaction Service
 * Handles Mantle blockchain transactions
 */

import { ethers } from 'ethers';
import { MANTLE_CONFIG } from '../../config/mantle-config.js';
import { getMantleTransactionUrl } from '../../utils/mantle-utils.js';

/**
 * Send MNT native token transfer
 */
export const sendMNTTransfer = async ({
  accountAddress,
  recipientAddress,
  amount,
  gasConfig = {}
}) => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
      to: recipientAddress,
      value: ethers.parseEther(amount.toString()),
      ...gasConfig
    });

    const receipt = await tx.wait();

    return {
      success: true,
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      explorerUrl: getMantleTransactionUrl(receipt.hash),
      status: receipt.status,
      network: 'mantle'
    };
  } catch (error) {
    console.error('MNT transfer error:', error);
    throw error;
  }
};

/**
 * Get MNT account balance
 */
export const getMNTBalance = async (address) => {
  try {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address format');
    }

    const provider = new ethers.JsonRpcProvider(MANTLE_CONFIG.rpcUrls[0]);
    const balance = await provider.getBalance(address);
    
    return {
      wei: balance.toString(),
      mnt: ethers.formatEther(balance),
      formatted: parseFloat(ethers.formatEther(balance)).toFixed(4),
    };
  } catch (error) {
    console.error('Error getting MNT balance:', error);
    throw error;
  }
};

/**
 * Get Mantle transaction details
 */
export const getMantleTransaction = async (txHash) => {
  try {
    if (!txHash || !txHash.startsWith('0x')) {
      throw new Error('Invalid transaction hash');
    }

    const provider = new ethers.JsonRpcProvider(MANTLE_CONFIG.rpcUrls[0]);
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!tx) {
      throw new Error('Transaction not found');
    }

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther(tx.value),
      gasLimit: tx.gasLimit.toString(),
      gasPrice: tx.gasPrice?.toString(),
      gasUsed: receipt?.gasUsed?.toString(),
      blockNumber: tx.blockNumber,
      blockHash: tx.blockHash,
      status: receipt?.status,
      confirmations: await tx.confirmations(),
      explorerUrl: getMantleTransactionUrl(txHash),
      network: 'mantle'
    };
  } catch (error) {
    console.error('Error getting Mantle transaction:', error);
    throw error;
  }
};

/**
 * Wait for Mantle transaction confirmation
 */
export const waitForMantleTransaction = async (txHash, confirmations = 1) => {
  try {
    const provider = new ethers.JsonRpcProvider(MANTLE_CONFIG.rpcUrls[0]);
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    
    if (!receipt) {
      throw new Error('Transaction not found or failed');
    }

    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
      explorerUrl: getMantleTransactionUrl(receipt.hash),
      network: 'mantle'
    };
  } catch (error) {
    console.error('Error waiting for Mantle transaction:', error);
    throw error;
  }
};

/**
 * Get Mantle network status
 */
export const getMantleNetworkStatus = async () => {
  try {
    const provider = new ethers.JsonRpcProvider(MANTLE_CONFIG.rpcUrls[0]);
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const gasPrice = await provider.getFeeData();

    return {
      blockNumber,
      blockTimestamp: block.timestamp,
      gasPrice: gasPrice.gasPrice?.toString(),
      maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString(),
      chainId: MANTLE_CONFIG.chainId,
      networkName: MANTLE_CONFIG.chainName,
    };
  } catch (error) {
    console.error('Error getting Mantle network status:', error);
    throw error;
  }
};

/**
 * Get gas price recommendations
 */
export const getMantleGasPriceRecommendations = async () => {
  try {
    const provider = new ethers.JsonRpcProvider(MANTLE_CONFIG.rpcUrls[0]);
    const feeData = await provider.getFeeData();

    const baseGasPrice = feeData.gasPrice || 20000000n;

    return {
      slow: {
        gasPrice: baseGasPrice.toString(),
        estimatedTime: '60 seconds'
      },
      standard: {
        gasPrice: (baseGasPrice * 12n / 10n).toString(),
        estimatedTime: '30 seconds'
      },
      fast: {
        gasPrice: (baseGasPrice * 15n / 10n).toString(),
        estimatedTime: '15 seconds'
      }
    };
  } catch (error) {
    console.error('Error getting gas price recommendations:', error);
    // Return fallback values
    return {
      slow: { gasPrice: '20000000', estimatedTime: '60 seconds' },
      standard: { gasPrice: '25000000', estimatedTime: '30 seconds' },
      fast: { gasPrice: '30000000', estimatedTime: '15 seconds' }
    };
  }
};

/**
 * Calculate transaction cost
 */
export const calculateMantleTransactionCost = (gasLimit, gasPrice, amount = 0n) => {
  const gasLimitBig = BigInt(gasLimit);
  const gasPriceBig = BigInt(gasPrice);
  const amountBig = BigInt(amount);
  
  const gasCost = gasLimitBig * gasPriceBig;
  const total = gasCost + amountBig;

  return {
    gasLimit: gasLimitBig.toString(),
    gasPrice: gasPriceBig.toString(),
    gasCost: gasCost.toString(),
    amount: amountBig.toString(),
    total: total.toString(),
    gasCostMNT: ethers.formatEther(gasCost),
    totalMNT: ethers.formatEther(total)
  };
};

/**
 * Estimate gas for transaction
 */
export const estimateMantleTransactionGas = async (transaction) => {
  try {
    const provider = new ethers.JsonRpcProvider(MANTLE_CONFIG.rpcUrls[0]);
    const gasEstimate = await provider.estimateGas(transaction);
    return gasEstimate.toString();
  } catch (error) {
    console.error('Error estimating gas:', error);
    // Return fallback gas limit
    return '21000';
  }
};

/**
 * Prepare transaction for storage (always marks as mantle)
 */
export const prepareMantleTransaction = (transactionData) => {
  return {
    ...transactionData,
    network: 'mantle',
    mantle_transaction_hash: transactionData.hash || transactionData.mantle_transaction_hash,
    mantle_block_number: transactionData.blockNumber || transactionData.mantle_block_number,
    gas_used: transactionData.gasUsed || transactionData.gas_used,
    gas_price: transactionData.gasPrice || transactionData.gas_price,
  };
};

export default {
  sendMNTTransfer,
  getMNTBalance,
  getMantleTransaction,
  waitForMantleTransaction,
  getMantleNetworkStatus,
  getMantleGasPriceRecommendations,
  calculateMantleTransactionCost,
  estimateMantleTransactionGas,
  prepareMantleTransaction
};
