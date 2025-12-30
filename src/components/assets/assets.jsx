import useSWR from "swr";
import { squidlAPI } from "../../api/squidl.js";
import { useEffect, useState } from "react";
import { Spinner } from "@nextui-org/react";
import AssetItem from "../alias/AssetItem.jsx";
import { formatCurrency } from "@coingecko/cryptoformat";
import { useUser } from "../../providers/UserProvider.jsx";
import { useAptos } from "../../providers/MantleWalletProvider.jsx";
import { getMNTBalance } from "../../lib/mantle/mantleTransactionService.js";

export default function Assets() {
  const { assets } = useUser();
  const { account, isConnected } = useAptos();
  const [mntBalance, setMntBalance] = useState(null);
  const [isLoadingMNT, setIsLoadingMNT] = useState(true);

  // Load MNT balance
  useEffect(() => {
    const loadMNTBalance = async () => {
      if (account && isConnected) {
        try {
          const balance = await getMNTBalance(account);
          setMntBalance(balance);
        } catch (error) {
          console.error('Failed to load MNT balance:', error);
          setMntBalance({ mnt: '0', formatted: '0' });
        } finally {
          setIsLoadingMNT(false);
        }
      } else {
        setIsLoadingMNT(false);
      }
    };

    loadMNTBalance();

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      loadMNTBalance();
    };

    window.addEventListener('mantle-balance-updated', handleBalanceUpdate);
    window.addEventListener('balance-updated', handleBalanceUpdate);

    return () => {
      window.removeEventListener('mantle-balance-updated', handleBalanceUpdate);
      window.removeEventListener('balance-updated', handleBalanceUpdate);
    };
  }, [account, isConnected]);

  // Merge MNT balance with other assets
  const mergedAssets = [];

  // Add MNT native token first
  if (mntBalance && isConnected) {
    mergedAssets.push({
      balance: parseFloat(mntBalance.mnt),
      formattedBalance: mntBalance.formatted,
      nativeToken: {
        symbol: 'MNT',
        logo: 'https://www.mantle.xyz/favicon.ico',
        name: 'Mantle Token'
      },
      chainName: 'Mantle Sepolia',
      chainLogo: 'https://www.mantle.xyz/favicon.ico',
      priceUSD: 0,
      isMantle: true
    });
  }

  // Add other assets if available
  if (assets?.aggregatedBalances) {
    const otherAssets = [
      ...(assets.aggregatedBalances.native || []),
      ...(assets.aggregatedBalances.erc20 || []),
    ];
    mergedAssets.push(...otherAssets);
  }

  return (
    <div className={"relative flex w-full h-full"}>
      {(isLoadingMNT && !assets) ? (
        <Spinner
          size="md"
          color="primary"
          className="flex items-center justify-center w-full h-40"
        />
      ) : mergedAssets.length > 0 ? (
        <div className="flex flex-col w-full">
          {mergedAssets.map((item, idx) => (
            <AssetItem
              key={idx}
              logoImg={
                item?.nativeToken ? item.nativeToken.logo : item.token?.logo
              }
              balance={
                item.isMantle 
                  ? `${item.formattedBalance} MNT`
                  : `${formatCurrency(
                      item.balance,
                      item?.nativeToken ? item.nativeToken.symbol : item.token.symbol,
                      "de",
                      true,
                      {
                        significantFigures: 5,
                      }
                    )}`
              }
              chainName={item.chainName}
              chainLogo={item.chainLogo}
              priceUSD={
                item.isMantle 
                  ? "$0.00"
                  : formatCurrency(item.priceUSD, "USD", "en", false, {
                      significantFigures: 5,
                    })
              }
              tokenSymbol={
                item?.nativeToken ? item.nativeToken.symbol : item.token?.symbol
              }
            />
          ))}
        </div>
      ) : (
        <div className="w-full flex items-center justify-center min-h-64">
          {isConnected ? "No assets found" : "Connect wallet to view assets"}
        </div>
      )}
    </div>
  );
}
