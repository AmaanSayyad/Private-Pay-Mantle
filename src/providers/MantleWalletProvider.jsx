import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { MANTLE_CONFIG, addMantleNetworkToMetaMask, switchToMantleNetwork } from '../config/mantle-config.js';
import { mantleBlockchainService } from '../lib/mantle/mantleBlockchainService.js';
import { registerUser } from '../lib/supabase.js';
import toast from 'react-hot-toast';

// Lazy load MetaMask SDK to prevent blocking initialization
let MetaMaskSDK = null;
let SDKLoading = false;
const loadMetaMaskSDK = async () => {
  if (MetaMaskSDK) return MetaMaskSDK;
  if (SDKLoading) {
    // Wait for ongoing load
    while (SDKLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return MetaMaskSDK;
  }
  
  SDKLoading = true;
  try {
    // Use dynamic import with error handling
    const module = await import('@metamask/sdk').catch(err => {
      console.warn('MetaMask SDK import failed:', err);
      return null;
    });
    
    if (module && module.default) {
      MetaMaskSDK = module.default;
    }
  } catch (error) {
    console.warn('Failed to load MetaMask SDK:', error);
  } finally {
    SDKLoading = false;
  }
  
  return MetaMaskSDK;
};

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
  const [metaMaskSDK, setMetaMaskSDK] = useState(null);

  // Initialize MetaMask SDK for mobile support (non-blocking)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;

    // Only initialize SDK on mobile devices and only if window.ethereum is not available
    // Use setTimeout to ensure this doesn't block initial render
    if (isMobile && !window.ethereum) {
      // Delay SDK initialization to not block app rendering
      setTimeout(() => {
        loadMetaMaskSDK()
          .then((SDK) => {
            if (!SDK) {
              console.log('MetaMask SDK not available, app will work without it');
              return;
            }
            
            try {
              const sdk = new SDK({
                dappMetadata: {
                  name: 'PrivatePay',
                  url: window.location.origin,
                },
                injectProvider: true,
                checkInstallation: false, // Disable to prevent redirects
                shouldShimWeb3: false, // Don't shim web3
                communicationLayerPreference: 'socket', // Use socket for better mobile support
                useDeeplink: true, // Enable deep linking
                openDeeplink: (deeplink) => {
                  // Custom deeplink handler
                  console.log('Opening MetaMask deeplink:', deeplink);
                  // Store flag before navigating
                  localStorage.setItem('metamask_auto_connect', 'true');
                  window.location.href = deeplink;
                },
              });
              setMetaMaskSDK(sdk);
              console.log('MetaMask SDK initialized successfully');
            } catch (error) {
              console.warn('Failed to initialize MetaMask SDK:', error);
              // Don't set SDK on error - app should still work without it
            }
          })
          .catch((error) => {
            console.warn('Failed to load MetaMask SDK:', error);
            // App should continue to work without SDK
          });
      }, 100); // Small delay to ensure app renders first
    }
  }, []);

  const isMetaMaskInstalled = () => {
    if (typeof window === 'undefined') return false;
    
    // Check for desktop MetaMask or SDK-injected provider
    if (typeof window.ethereum !== 'undefined') {
      return true;
    }
    
    // On mobile, MetaMask SDK will inject the provider
    // or we can try to connect via deep link
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS || isAndroid) {
      // MetaMask mobile is available via SDK or deep link
      return true;
    }
    
    return false;
  };

  const initializeProvider = useCallback(async () => {
    // Wait for SDK to inject provider on mobile
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    
    if (isMobile && !window.ethereum && metaMaskSDK) {
      // Give SDK time to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check if window.ethereum exists and is available
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      console.warn('MetaMask provider not available');
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

        // Register user in Supabase (creates default payment link)
        try {
          const user = await registerUser(account.address);
          if (user) {
            console.log('User registered/retrieved on init:', user);
            const username = user.username || account.address.slice(2, 8).toLowerCase();
            localStorage.setItem(`mantle_username_${account.address}`, username);
          }
        } catch (regError) {
          console.warn('Could not register user on init:', regError);
        }

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
  }, [metaMaskSDK]);

  const connect = useCallback(async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    
    // On mobile, if no provider yet, try to wait for SDK to inject it
    if (isMobile && !window.ethereum && metaMaskSDK) {
      // Give SDK time to inject provider
      let waited = 0;
      while (!window.ethereum && waited < 3000) {
        await new Promise(resolve => setTimeout(resolve, 200));
        waited += 200;
      }
    }

    // Check for desktop MetaMask or SDK-injected provider
    if (typeof window !== 'undefined' && window.ethereum && typeof window.ethereum.request === 'function') {
      setIsConnecting(true);
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });

        if (accounts.length === 0) {
          throw new Error('No accounts found');
        }

        if (!window.ethereum) {
          throw new Error('MetaMask provider not available');
        }

        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethProvider);

        const account = accounts[0];
        setAccount(account);
        setIsConnected(true);

        const signer = await ethProvider.getSigner();
        setSigner(signer);

        // Register user in Supabase (creates default payment link)
        try {
          const user = await registerUser(account);
          if (user) {
            console.log('User registered/retrieved:', user);
            // Save username to localStorage
            const username = user.username || account.slice(2, 8).toLowerCase();
            localStorage.setItem(`mantle_username_${account}`, username);
          }
        } catch (regError) {
          console.warn('Could not register user:', regError);
        }

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
        if (error.code === 4001) {
          toast.error('Connection rejected by user');
        } else {
          toast.error('Failed to connect wallet');
        }
        setIsConnecting(false);
      } finally {
        setIsConnecting(false);
      }
    } else {
      // MetaMask not detected - show appropriate message
      if (isMobile) {
        // On mobile, try to use MetaMask SDK or deep link
        if (metaMaskSDK) {
          try {
            // Wait a bit more for SDK to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (window.ethereum && typeof window.ethereum.request === 'function') {
              // SDK injected provider, retry connection
              setIsConnecting(true);
              try {
                const accounts = await window.ethereum.request({
                  method: 'eth_requestAccounts',
                });

                if (accounts.length === 0) {
                  throw new Error('No accounts found');
                }

                if (!window.ethereum) {
                  throw new Error('MetaMask provider not available');
                }

                const ethProvider = new ethers.BrowserProvider(window.ethereum);
                setProvider(ethProvider);

                const account = accounts[0];
                setAccount(account);
                setIsConnected(true);

                const signer = await ethProvider.getSigner();
                setSigner(signer);

                // Register user
                try {
                  const user = await registerUser(account);
                  if (user) {
                    const username = user.username || account.slice(2, 8).toLowerCase();
                    localStorage.setItem(`mantle_username_${account}`, username);
                  }
                } catch (regError) {
                  console.warn('Could not register user:', regError);
                }

                const network = await ethProvider.getNetwork();
                const currentChainId = Number(network.chainId);
                setChainId(currentChainId);
                setIsCorrectNetwork(currentChainId === MANTLE_CONFIG.chainId);
                
                toast.success(`Connected to ${MANTLE_CONFIG.chainName}`);
                setIsConnecting(false);
                return;
              } catch (error) {
                console.error('Failed to connect via SDK:', error);
                setIsConnecting(false);
              }
            }
          } catch (error) {
            console.error('SDK connection failed:', error);
          }
        }
        
        // If still no provider, use deep link to open in MetaMask app
        // Store a flag to auto-connect when returning
        localStorage.setItem('metamask_auto_connect', 'true');
        toast.info('Opening in MetaMask app...');
        
        // Use MetaMask SDK's connect method if available
        if (metaMaskSDK) {
          try {
            // The SDK should handle the deep link and connection
            // But we'll also set up the deep link as fallback
            if (typeof metaMaskSDK.connect === 'function') {
              setIsConnecting(true);
              const result = await metaMaskSDK.connect();
              console.log('SDK connect result:', result);
              // If SDK connected, the provider should be injected
              // Wait a moment and retry
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (window.ethereum) {
                // Retry connection with injected provider
                return connect();
              }
            }
          } catch (error) {
            console.warn('SDK connect failed, using deep link:', error);
          }
        }
        
        // Fallback: use direct deep link
        // Add connection request to URL so MetaMask knows to prompt
        const currentUrl = window.location.href;
        const connectUrl = currentUrl.includes('?') 
          ? `${currentUrl}&connect=true`
          : `${currentUrl}?connect=true`;
        const deepLink = `https://metamask.app.link/dapp/${encodeURIComponent(connectUrl)}`;
        window.location.href = deepLink;
      } else {
        toast.error('Please install MetaMask to connect your wallet');
        window.open('https://metamask.io/download/', '_blank');
      }
    }
  }, [metaMaskSDK]);

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
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('MetaMask is not installed');
      return;
    }

    try {
      await switchToMantleNetwork();
      
      if (!window.ethereum) {
        throw new Error('MetaMask provider not available');
      }
      
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
    // Check if window.ethereum exists before setting up listeners
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      return;
    }

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

    // Only set up listeners if window.ethereum exists and has the 'on' method
    if (window.ethereum && typeof window.ethereum.on === 'function') {
      try {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      } catch (error) {
        console.warn('Failed to set up ethereum event listeners:', error);
      }
    }

    return () => {
      if (window.ethereum && typeof window.ethereum.removeListener === 'function') {
        try {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        } catch (error) {
          console.warn('Failed to remove ethereum event listeners:', error);
        }
      }
    };
  }, [account, provider, disconnect]);

  useEffect(() => {
    initializeProvider();
  }, [initializeProvider]);

  // Auto-connect when returning from MetaMask deep link on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    
    // Check if we should auto-connect (set when deep linking or URL has connect param)
    const shouldAutoConnect = localStorage.getItem('metamask_auto_connect') === 'true' || 
                              new URLSearchParams(window.location.search).get('connect') === 'true';
    
    // Also check if we're in MetaMask's browser (has ethereum provider)
    const isInMetaMaskBrowser = window.ethereum && window.ethereum.isMetaMask;
    
    if (isMobile && (shouldAutoConnect || isInMetaMaskBrowser) && !isConnected && !isConnecting) {
      // Wait a bit for MetaMask to fully initialize
      const timeout = setTimeout(async () => {
        if (window.ethereum && typeof window.ethereum.request === 'function') {
          localStorage.removeItem('metamask_auto_connect');
          
          // Remove connect param from URL
          if (window.location.search.includes('connect=true')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('connect');
            window.history.replaceState({}, '', url.toString());
          }
          
          // Direct connection request - this will show the popup
          try {
            setIsConnecting(true);
            console.log('Auto-connecting to MetaMask...');
            
            const accounts = await window.ethereum.request({
              method: 'eth_requestAccounts',
            });
            
            if (accounts && accounts.length > 0) {
              const ethProvider = new ethers.BrowserProvider(window.ethereum);
              setProvider(ethProvider);
              setAccount(accounts[0]);
              setIsConnected(true);
              
              const signer = await ethProvider.getSigner();
              setSigner(signer);
              
              // Register user
              try {
                const user = await registerUser(accounts[0]);
                if (user) {
                  const username = user.username || accounts[0].slice(2, 8).toLowerCase();
                  localStorage.setItem(`mantle_username_${accounts[0]}`, username);
                }
              } catch (regError) {
                console.warn('Could not register user:', regError);
              }
              
              const network = await ethProvider.getNetwork();
              const currentChainId = Number(network.chainId);
              setChainId(currentChainId);
              setIsCorrectNetwork(currentChainId === MANTLE_CONFIG.chainId);
              
              toast.success(`Connected to ${MANTLE_CONFIG.chainName}`);
            }
          } catch (error) {
            console.warn('Auto-connect failed:', error);
            if (error.code === 4001) {
              toast.error('Connection rejected by user');
            }
          } finally {
            setIsConnecting(false);
          }
        }
      }, 1500); // Wait 1.5 seconds for MetaMask to initialize
      
      return () => clearTimeout(timeout);
    }
  }, [isConnected, isConnecting]);

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

// Backward compatibility hooks (deprecated - use useMantleWallet instead)
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
