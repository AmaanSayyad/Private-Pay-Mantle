/**
 * Mantle Blockchain Service
 * Service for interacting with Mantle Network and smart contracts
 */

import { ethers } from 'ethers';
import { MANTLE_CONFIG } from '../../config/mantle-config.js';

// Contract ABIs
const STEALTH_REGISTRY_ABI = [
  "function registerMetaAddress(bytes spendPub, bytes viewingPub) external",
  "function announcePayment(address recipient, uint256 metaAddressIndex, bytes ephemeralPubKey, address stealthAddress, uint32 viewHint, uint32 k, uint256 amount) external",
  "function getMetaAddress(address user, uint256 index) external view returns (tuple(bytes spendPubKey, bytes viewingPubKey, uint256 createdAt))",
  "function getMetaAddressCount(address user) external view returns (uint256)",
  "function getAllMetaAddresses(address user) external view returns (tuple(bytes spendPubKey, bytes viewingPubKey, uint256 createdAt)[])",
  "event MetaAddressRegistered(address indexed user, uint256 indexed index, bytes spendPubKey, bytes viewingPubKey, uint256 timestamp)",
  "event PaymentAnnouncement(address indexed recipient, uint256 indexed metaAddressIndex, bytes ephemeralPubKey, address stealthAddress, uint32 viewHint, uint32 k, uint256 amount, uint256 timestamp)"
];

const PAYMENT_MANAGER_ABI = [
  "function sendPrivatePayment(address recipient, uint256 metaIndex, uint32 k, bytes ephemeralPubKey, address stealthAddress, uint32 viewHint) external payable",
  "function withdrawFromStealth(address payable to) external",
  "function getStealthBalance(address stealthAddress) external view returns (uint256)",
  "function registry() external view returns (address)",
  "event PrivatePaymentSent(address indexed sender, address indexed recipient, uint256 indexed metaAddressIndex, address stealthAddress, uint256 amount, uint256 timestamp)",
  "event StealthWithdrawal(address indexed stealthAddress, address indexed recipient, uint256 amount, uint256 timestamp)"
];

class MantleBlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.registryContract = null;
    this.paymentContract = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the service with provider and contracts
   */
  async initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(MANTLE_CONFIG.rpcUrls[0]);
      
      // Test connection
      await this.provider.getNetwork();
      
      // Initialize contracts (read-only)
      if (MANTLE_CONFIG.contracts.StealthAddressRegistry.address) {
        this.registryContract = new ethers.Contract(
          MANTLE_CONFIG.contracts.StealthAddressRegistry.address,
          STEALTH_REGISTRY_ABI,
          this.provider
        );
      }
      
      if (MANTLE_CONFIG.contracts.PaymentManager.address) {
        this.paymentContract = new ethers.Contract(
          MANTLE_CONFIG.contracts.PaymentManager.address,
          PAYMENT_MANAGER_ABI,
          this.provider
        );
      }
      
      this.isInitialized = true;
      console.log('Mantle Blockchain Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Mantle Blockchain Service:', error);
      throw error;
    }
  }

  /**
   * Connect to MetaMask and get signer
   */
  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await provider.getSigner();
      
      if (this.registryContract) {
        this.registryContract = this.registryContract.connect(this.signer);
      }
      
      if (this.paymentContract) {
        this.paymentContract = this.paymentContract.connect(this.signer);
      }
      
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * Get current network information
   */
  async getNetworkInfo() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    const network = await this.provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name,
      isMantleTestnet: Number(network.chainId) === 5003,
      isMantleMainnet: Number(network.chainId) === 5000
    };
  }

  /**
   * Register a meta address
   */
  async registerMetaAddress(spendPubKey, viewingPubKey) {
    if (!this.registryContract || !this.signer) {
      throw new Error('Contract or signer not available');
    }

    try {
      const tx = await this.registryContract.registerMetaAddress(spendPubKey, viewingPubKey);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Failed to register meta address:', error);
      throw error;
    }
  }

  /**
   * Get meta address for a user
   */
  async getMetaAddress(userAddress, index) {
    if (!this.registryContract) {
      throw new Error('Registry contract not available');
    }

    try {
      const metaAddress = await this.registryContract.getMetaAddress(userAddress, index);
      return {
        spendPubKey: metaAddress.spendPubKey,
        viewingPubKey: metaAddress.viewingPubKey,
        createdAt: Number(metaAddress.createdAt)
      };
    } catch (error) {
      console.error('Failed to get meta address:', error);
      throw error;
    }
  }

  /**
   * Get meta address count for a user
   */
  async getMetaAddressCount(userAddress) {
    if (!this.registryContract) {
      throw new Error('Registry contract not available');
    }

    try {
      const count = await this.registryContract.getMetaAddressCount(userAddress);
      return Number(count);
    } catch (error) {
      console.error('Failed to get meta address count:', error);
      throw error;
    }
  }

  /**
   * Send a private payment
   */
  async sendPrivatePayment(params) {
    if (!this.paymentContract || !this.signer) {
      throw new Error('Payment contract or signer not available');
    }

    const { recipient, metaIndex, k, ephemeralPubKey, stealthAddress, viewHint, amount } = params;

    try {
      const tx = await this.paymentContract.sendPrivatePayment(
        recipient,
        metaIndex,
        k,
        ephemeralPubKey,
        stealthAddress,
        viewHint,
        { value: amount }
      );
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        stealthAddress
      };
    } catch (error) {
      console.error('Failed to send private payment:', error);
      throw error;
    }
  }

  /**
   * Get stealth address balance
   */
  async getStealthBalance(stealthAddress) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const balance = await this.provider.getBalance(stealthAddress);
      return balance.toString();
    } catch (error) {
      console.error('Failed to get stealth balance:', error);
      throw error;
    }
  }

  /**
   * Withdraw funds from stealth address
   */
  async withdrawFromStealthAddress(stealthPrivateKey, recipientAddress, amount = null) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const stealthWallet = new ethers.Wallet(stealthPrivateKey, this.provider);
      const stealthAddress = stealthWallet.address;
      
      const balance = await this.provider.getBalance(stealthAddress);
      
      if (balance === 0n) {
        throw new Error('No funds available in stealth address');
      }

      const gasPrice = await this.provider.getFeeData();
      const gasLimit = 21000n;
      const gasCost = gasLimit * (gasPrice.gasPrice || gasPrice.maxFeePerGas || 20000000n);
      
      let withdrawAmount;
      if (amount) {
        withdrawAmount = BigInt(amount);
        if (withdrawAmount + gasCost > balance) {
          throw new Error('Insufficient balance for withdrawal including gas fees');
        }
      } else {
        withdrawAmount = balance - gasCost;
        if (withdrawAmount <= 0n) {
          throw new Error('Insufficient balance to cover gas fees');
        }
      }

      const transaction = {
        to: recipientAddress,
        value: withdrawAmount,
        gasLimit: gasLimit,
        gasPrice: gasPrice.gasPrice || gasPrice.maxFeePerGas
      };

      const tx = await stealthWallet.sendTransaction(transaction);
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        withdrawnAmount: withdrawAmount.toString(),
        stealthAddress,
        recipientAddress,
        gasCost: gasCost.toString()
      };
    } catch (error) {
      console.error('Failed to withdraw from stealth address:', error);
      throw error;
    }
  }

  /**
   * Get payment events
   */
  async getPaymentEvents(fromBlock = 0, toBlock = 'latest') {
    if (!this.registryContract) {
      throw new Error('Registry contract not available');
    }

    try {
      const filter = this.registryContract.filters.PaymentAnnouncement();
      const events = await this.registryContract.queryFilter(filter, fromBlock, toBlock);
      
      return events.map(event => ({
        recipient: event.args.recipient,
        metaAddressIndex: Number(event.args.metaAddressIndex),
        ephemeralPubKey: event.args.ephemeralPubKey,
        stealthAddress: event.args.stealthAddress,
        viewHint: Number(event.args.viewHint),
        k: Number(event.args.k),
        amount: event.args.amount.toString(),
        timestamp: Number(event.args.timestamp),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      }));
    } catch (error) {
      console.error('Failed to get payment events:', error);
      throw error;
    }
  }

  /**
   * Start real-time event monitoring
   */
  startEventMonitoring(callback) {
    if (!this.registryContract) {
      throw new Error('Registry contract not available');
    }

    const filter = this.registryContract.filters.PaymentAnnouncement();
    
    this.registryContract.on(filter, (recipient, metaAddressIndex, ephemeralPubKey, stealthAddress, viewHint, k, amount, timestamp, event) => {
      callback({
        recipient,
        metaAddressIndex: Number(metaAddressIndex),
        ephemeralPubKey,
        stealthAddress,
        viewHint: Number(viewHint),
        k: Number(k),
        amount: amount.toString(),
        timestamp: Number(timestamp),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });
  }

  /**
   * Stop event monitoring
   */
  stopEventMonitoring() {
    if (this.registryContract) {
      this.registryContract.removeAllListeners();
    }
  }

  /**
   * Validate address
   */
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const gasPrice = await this.provider.getFeeData();
      return {
        gasPrice: gasPrice.gasPrice?.toString(),
        maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
      };
    } catch (error) {
      console.error('Failed to get gas price:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const gasEstimate = await this.provider.estimateGas(transaction);
      return gasEstimate.toString();
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }
}

export const mantleBlockchainService = new MantleBlockchainService();
export default MantleBlockchainService;
