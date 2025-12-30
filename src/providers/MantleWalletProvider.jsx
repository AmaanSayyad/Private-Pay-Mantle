import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { MANTLE_CONFIG, addMantleNetworkToMetaMask, switchToMantleNetwork } from '../config/mantle-config.js';
import { mantleBlockchainService } from '../lib/mantle/mantleBlockchainService.js';
import toast from 'react-hot-toast';

/**
 * @typedef {Object} MantleWalletContextType
 * @property {string|null} account - Connected wallet address
 * @property {boolean} isConnected - Connection status
 * @property {boolean} isConnecting - Connection in progress
 * @property {ethers.BrowserProvider|null} provider - Ethers provider
 * @property {ethers.Signer|null} signer - Ethers signer
 * @property {Function} connect - Connect wallet function
 * @property {Function} disconnect - Disconnect wallet function
 * @property {Function} switchNetwork - Switch to Mantle network function
 * @property {number|null} chainId - Current chain ID
 * @property {boolean} isCorrectNetwork - Whether connected to Mantle network
 */

/** @type {React.Context<MantleWalletContextType>} */
const MantleWalletContext = createContext({
  account: null,
  isConnected: false,
  isConnecting: false,
  provider: null,
  signer: null,
  connect: async () => {},
  disconnect: async () => {},
  switchNetwork: async () => {},
  chainId: null,
  isCorrectNetwork: false,
});

export const useMantleWallet = () => {
  const context = useContext(MantleWalletContext);
  if (!context) {
    throw new Error('useMantleWallet must be used within a MantleWalletProvider');
  }
  return context;
};

export default function MantleWalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  const initializeProvider = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      console.warn('MetaMask is not installed');
      return;
    }

    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethProvider);

      const accounts = await ethProvider.listAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        setAccount(account.address);
        setIsConnected(true);
        
        const signer = await ethProvider.getSigner();
        setSigner(signer);

        try {
          await mantleBlockchainService.initialize();
          mantleBlockchainService.signer = signer;
          console.log('Mantle blockchain service signer initialized');
        } catch (error) {
          console.error('Failed to initialize Mantle blockchain service signer:', error);
        }

        const network = await ethProvider.getNetwork();
        setChainId(Number(network.chainId));
        setIsCorrectNetwork(Number(network.chainId) === MANTLE_CONFIG.chainId);
      }
    } catch (error) {
      console.error('Failed to initialize provider:', error);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('Please install MetaMask to connect your wallet');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethProvider);

      const account = accounts[0];
      setAccount(account);
      setIsConnected(true);

      const signer = await ethProvider.getSigner();
      setSigner(signer);

      try {
        await mantleBlockchainService.initialize();
        mantleBlockchainService.signer = signer;
        console.log('Mantle blockchain service signer set successfully');
      } catch (error) {
        console.error('Failed to set Mantle blockchain service signer:', error);
      }

      const network = await ethProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);
      
      if (currentChainId !== MANTLE_CONFIG.chainId) {
        setIsCorrectNetwork(false);
        toast.error(`Please switch to ${MANTLE_CONFIG.chainName} network`);
        
        try {
          await switchToMantleNetwork();
          setIsCorrectNetwork(true);
          toast.success(`Connected to ${MANTLE_CONFIG.chainName}`);
        } catch (switchError) {
          console.error('Failed to switch network:', switchError);
        }
      } else {
        setIsCorrectNetwork(true);
        toast.success(`Connected to ${MANTLE_CONFIG.chainName}`);
      }

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
      setIsConnecting(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setAccount(null);
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsCorrectNetwork(false);
    toast.success('Wallet disconnected');
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('MetaMask is not installed');
      return;
    }

    try {
      await switchToMantleNetwork();
      
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await ethProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);
      setIsCorrectNetwork(currentChainId === MANTLE_CONFIG.chainId);
      
      if (currentChainId === MANTLE_CONFIG.chainId) {
        toast.success(`Switched to ${MANTLE_CONFIG.chainName}`);
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast.error('Failed to switch network');
    }
  }, []);

  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        if (provider) {
          provider.getSigner().then(setSigner).catch(console.error);
        }
      }
    };

    const handleChainChanged = (chainId) => {
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);
      setIsCorrectNetwork(newChainId === MANTLE_CONFIG.chainId);
      
      if (newChainId !== MANTLE_CONFIG.chainId) {
        toast.error(`Please switch to ${MANTLE_CONFIG.chainName} network`);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, provider, disconnect]);

  useEffect(() => {
    initializeProvider();
  }, [initializeProvider]);

  const contextValue = {
    account,
    isConnected,
    isConnecting,
    provider,
    signer,
    connect,
    disconnect,
    switchNetwork,
    chainId,
    isCorrectNetwork,
  };

  return (
    <MantleWalletContext.Provider value={contextValue}>
      {children}
    </MantleWalletContext.Provider>
  );
}

// Backward compatibility hooks
export const useQIEWallet = useMantleWallet;
export const useAptos = () => {
  const mantleWallet = useMantleWallet();
  
  return {
    account: mantleWallet.account,
    isConnected: mantleWallet.isConnected,
    connect: mantleWallet.connect,
    disconnect: mantleWallet.disconnect,
    provider: mantleWallet.provider,
    signer: mantleWallet.signer,
    chainId: mantleWallet.chainId,
    isCorrectNetwork: mantleWallet.isCorrectNetwork,
    switchNetwork: mantleWallet.switchNetwork,
  };
};
