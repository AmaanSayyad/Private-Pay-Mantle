import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@nextui-org/react";
import { Icons } from "../shared/Icons.jsx";
import { useAptos } from "../../providers/MantleWalletProvider.jsx";
import { getUserBalance, withdrawFunds } from "../../lib/supabase.js";
import toast from "react-hot-toast";
import { getMantleTransactionUrl, formatMNTAmount } from "../../utils/mantle-utils.js";
import { MANTLE_CONFIG } from "../../config/mantle-config.js";
import { ethers } from "ethers";

const TREASURY_WALLET_ADDRESS = import.meta.env.VITE_TREASURY_WALLET_ADDRESS;
const TREASURY_PRIVATE_KEY = import.meta.env.VITE_TREASURY_PRIVATE_KEY;

export function MantleWithdraw() {
  const navigate = useNavigate();
  const { account, isConnected, connect } = useAptos();
  
  const [username, setUsername] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      if (account) {
        const savedUsername = localStorage.getItem(`mantle_username_${account}`);
        const userUsername = savedUsername || account.slice(2, 8);
        setUsername(userUsername);
        setDestinationAddress(account);
        await loadBalance();
      }
    }
    
    loadUserData();
  }, [account]);

  const loadBalance = async () => {
    try {
      setIsLoadingBalance(true);
      // getUserBalance expects wallet address, not username
      const balanceAmount = await getUserBalance(account);
      setAvailableBalance(balanceAmount || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
      toast.error('Failed to load balance');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connect();
      toast.success("Wallet connected successfully!");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error(error.message || "Failed to connect wallet");
    }
  };

  const handleMaxClick = () => {
    // Limit to 8 decimal places to avoid floating point issues
    const maxAmount = parseFloat(availableBalance).toFixed(8);
    setWithdrawAmount(maxAmount);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(withdrawAmount) > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!destinationAddress || !ethers.isAddress(destinationAddress)) {
      toast.error("Please enter a valid destination address");
      return;
    }

    if (!TREASURY_WALLET_ADDRESS || !TREASURY_PRIVATE_KEY) {
      toast.error("Treasury wallet not configured");
      return;
    }

    setIsWithdrawing(true);
    try {
      const provider = new ethers.JsonRpcProvider(MANTLE_CONFIG.rpcUrls[0]);
      const treasuryWallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);
      
      if (treasuryWallet.address.toLowerCase() !== TREASURY_WALLET_ADDRESS.toLowerCase()) {
        throw new Error('Treasury wallet configuration mismatch');
      }

      const treasuryBalance = await provider.getBalance(TREASURY_WALLET_ADDRESS);
      
      // Fix floating point precision - limit to 18 decimals max
      const cleanAmount = parseFloat(withdrawAmount).toFixed(18).replace(/\.?0+$/, '');
      const withdrawAmountWei = ethers.parseEther(cleanAmount);
      
      if (treasuryBalance < withdrawAmountWei) {
        throw new Error('Insufficient treasury balance');
      }

      const transaction = {
        to: destinationAddress,
        value: withdrawAmountWei,
        gasLimit: 100000000, // Mantle requires higher gas limit
      };

      const feeData = await provider.getFeeData();
      if (feeData.gasPrice) {
        transaction.gasPrice = feeData.gasPrice;
      } else {
        transaction.maxFeePerGas = feeData.maxFeePerGas;
        transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      }

      const txResponse = await treasuryWallet.sendTransaction(transaction);
      const receipt = await provider.waitForTransaction(txResponse.hash, 1);

      await withdrawFunds({
        fromAddress: TREASURY_WALLET_ADDRESS,
        toAddress: destinationAddress,
        userWalletAddress: account, // User's wallet for balance tracking
        amount: parseFloat(withdrawAmount),
        transactionHash: txResponse.hash
      });
      await loadBalance();

      window.dispatchEvent(new Event('balance-updated'));

      const shortHash = txResponse.hash.slice(0, 6) + "..." + txResponse.hash.slice(-4);
      
      toast.success(
        (t) => (
          <div 
            onClick={() => {
              window.open(getMantleTransactionUrl(txResponse.hash), '_blank');
              toast.dismiss(t.id);
            }}
            className="cursor-pointer hover:underline"
          >
            Withdrawal successful! TX: {shortHash} (click to view)
          </div>
        ),
        { duration: 8000 }
      );

      setWithdrawAmount("");
      
    } catch (error) {
      console.error("Withdrawal error:", error);
      
      if (error.message.includes('Insufficient treasury balance')) {
        toast.error("Treasury has insufficient funds. Please contact support.");
      } else if (error.message.includes('configuration mismatch')) {
        toast.error("Treasury wallet configuration error. Please contact support.");
      } else if (error.message.includes('insufficient funds')) {
        toast.error("Insufficient gas fees in treasury wallet");
      } else if (error.message.includes('rejected')) {
        toast.error("Transaction was rejected");
      } else {
        toast.error(error.message || "Withdrawal failed");
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="relative flex flex-col w-full max-w-md items-center justify-center bg-[#F9F9FA] rounded-[32px] p-4 md:p-6">
      <div className="flex items-center justify-between w-full mb-6">
        <h1 className="font-bold text-lg text-[#19191B]">Withdraw Funds</h1>
        <Button
          onClick={() => navigate("/")}
          className="bg-white rounded-full px-4 h-10 flex items-center gap-2"
        >
          <Icons.back className="size-4" />
          <span className="text-sm">Back</span>
        </Button>
      </div>

      <div className="bg-white rounded-[32px] py-6 px-6 flex flex-col gap-4 w-full border border-gray-200 shadow-lg">
        {!isConnected ? (
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm text-blue-800 text-center">
                Connect your Mantle wallet to withdraw funds
              </p>
            </div>
            <Button
              onClick={handleConnectWallet}
              className="bg-primary text-white font-bold py-5 px-6 h-16 w-full rounded-[32px]"
              size="lg"
            >
              Connect Mantle Wallet
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-800 font-medium">Wallet Connected</p>
                  <p className="text-xs text-green-600 mt-1">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </p>
                </div>
                <svg className="text-green-600 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-800 font-medium">Available Balance</p>
                  <p className="text-xs text-primary-600 mt-1">Held in treasury wallet</p>
                </div>
                <div className="text-right">
                  {isLoadingBalance ? (
                    <div className="animate-pulse bg-primary-200 h-6 w-16 rounded"></div>
                  ) : (
                    <p className="text-lg font-bold text-primary-900">
                      {formatMNTAmount(availableBalance.toString(), false, 6)} MNT
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Input
              label="Destination Address"
              placeholder="0x..."
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              description="Address where you want to receive the MNT tokens"
              classNames={{
                input: "text-sm",
                inputWrapper: "h-14",
              }}
            />

            <div className="relative">
              <Input
                label="Withdraw Amount (MNT)"
                type="number"
                placeholder="0.0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                description={`Available: ${formatMNTAmount(availableBalance.toString(), false, 6)} MNT`}
                classNames={{
                  input: "text-lg pr-16",
                  inputWrapper: "h-14",
                }}
                min="0"
                step="0.00000001"
                max={availableBalance}
                endContent={
                  <Button
                    size="sm"
                    onClick={handleMaxClick}
                    className="bg-primary-100 text-primary-700 font-medium"
                    disabled={availableBalance <= 0}
                  >
                    Max
                  </Button>
                }
              />
            </div>

            <Button
              onClick={handleWithdraw}
              isLoading={isWithdrawing}
              disabled={
                !withdrawAmount || 
                parseFloat(withdrawAmount) <= 0 || 
                parseFloat(withdrawAmount) > availableBalance ||
                !destinationAddress ||
                !ethers.isAddress(destinationAddress)
              }
              className="bg-primary text-white font-bold py-5 px-6 h-16 w-full rounded-[32px]"
              size="lg"
            >
              {isWithdrawing ? "Processing..." : `Withdraw ${withdrawAmount || "0"} MNT`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
