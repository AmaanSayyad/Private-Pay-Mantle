import { Button } from "@nextui-org/react";
import { Link } from "react-router-dom";
import { Icons } from "./Icons.jsx";
import Nounsies from "./Nounsies.jsx";
import { useSetAtom } from "jotai";
import { isCreateLinkDialogAtom } from "../../store/dialog-store.js";
import { useState } from "react";
import { useAptos } from "../../providers/MantleWalletProvider.jsx";
import { getMantleAddressUrl } from "../../utils/mantle-utils.js";
import toast from "react-hot-toast";

export default function Header() {
  const setCreateLinkModal = useSetAtom(isCreateLinkDialogAtom);

  return (
    <nav className="fixed top-0 z-50 flex items-center px-5 md:px-12 h-20 justify-between bg-white md:bg-transparent w-full">
      <div className="flex flex-row items-center gap-12">
        <Link to={"/"} className="w-12">
          <img
            src="/assets/squidl-only.svg"
            alt="squidl-logo"
            className="w-full h-full object-contain"
          />
        </Link>
      </div>

      <div className="flex gap-4 items-center justify-center">
        <Button
          onClick={() => setCreateLinkModal(true)}
          className={"bg-primary h-12 rounded-full px-5 gap-2"}
        >
          <Icons.link className="text-white size-5" />
          <span className={"text-sm font-medium text-white"}>Create Link</span>
        </Button>

        <UserProfileButton />
      </div>
    </nav>
  );
}

const UserProfileButton = () => {
  const { account, isConnected, connect, disconnect } = useAptos();
  const [showMenu, setShowMenu] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        className="h-12 rounded-full bg-primary-50 text-primary font-medium px-6"
      >
        Connect Mantle Wallet
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="size-12 rounded-full overflow-hidden relative border-2 border-primary/30 hover:border-primary/50 transition-colors"
      >
        <Nounsies address={account || ""} />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-16 z-50 bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden min-w-[300px]">
            {/* Wallet Info Section */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-200">
              <div className="size-12 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
                <Nounsies address={account || ""} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </p>
                <p className="text-xs text-gray-500 font-medium">Mantle Wallet</p>
              </div>
            </div>

            {/* Actions Section */}
            <div className="py-2">
              <button
                onClick={() => {
                  if (account) {
                    navigator.clipboard.writeText(account);
                    toast.success("Address copied to clipboard", {
                      duration: 2000,
                      position: "bottom-center",
                    });
                    setShowMenu(false);
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors w-full text-left"
              >
                <div className="flex items-center justify-center size-8 rounded-lg bg-neutral-100">
                  <Icons.copy className="size-4 text-gray-700" />
                </div>
                <span className="text-sm font-medium text-gray-700">Copy Address</span>
              </button>

              <button
                onClick={() => {
                  if (account) {
                    window.open(
                      getMantleAddressUrl(account),
                      "_blank"
                    );
                    setShowMenu(false);
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors w-full text-left"
              >
                <div className="flex items-center justify-center size-8 rounded-lg bg-neutral-100">
                  <Icons.externalLink className="size-4 text-gray-700" />
                </div>
                <span className="text-sm font-medium text-gray-700">View on Explorer</span>
              </button>

            </div>

            {/* Disconnect Section */}
            <div className="border-t border-neutral-200 pt-2 pb-2">
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors w-full text-left"
              >
                <div className="flex items-center justify-center size-8 rounded-lg bg-red-50">
                  <Icons.logout className="size-4 text-red-600" />
                </div>
                <span className="text-sm font-medium text-red-600">Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
