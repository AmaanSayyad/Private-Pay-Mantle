import {
  Modal,
  ModalContent,
  Button,
  Input,
  Skeleton,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import Confetti from "react-dom-confetti";
import SquidlLogo from "../../assets/squidl.svg?react";
import { useAtom } from "jotai";
import { isGetStartedDialogAtom } from "../../store/dialog-store";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@uidotdev/usehooks";
import { createPaymentLink, isAliasAvailable, registerUser, updateUsername } from "../../lib/supabase.js";
import { useAptos } from "../../providers/MantleWalletProvider.jsx";

const confettiConfig = {
  angle: 90,
  spread: 300,
  startVelocity: 20,
  elementCount: 60,
  dragFriction: 0.1,
  duration: 3000,
  stagger: 3,
  width: "8px",
  height: "8px",
  perspective: "500px",
};

export default function GetStartedDialog() {
  const [isOpen, setOpen] = useAtom(isGetStartedDialogAtom);
  const [step, setStep] = useState("one");

  return (
    <Modal
      isOpen={isOpen}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      hideCloseButton
      placement="center"
    >
      <ModalContent className="bg-white rounded-4xl p-8 max-w-[562px] flex flex-col items-start relative">
        {step === "one" ? (
          <StepOne setStep={setStep} />
        ) : (
          <StepTwo setOpen={setOpen} />
        )}
      </ModalContent>
    </Modal>
  );
}

function StepOne({ setStep }) {
  const [username, setUsername] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const debouncedUsername = useDebounce(username, 500);
  const { account, isConnected } = useAptos();

  const handleCheckUsername = async () => {
    try {
      if (!debouncedUsername) {
        setIsUsernameAvailable(false);
        return;
      }

      setIsCheckingUsername(true);
      const available = await isAliasAvailable(debouncedUsername.toLowerCase());
      setIsUsernameAvailable(available);
    } catch (error) {
      console.error('Error checking username', error);
      setIsUsernameAvailable(false);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  useEffect(() => {
    if (!debouncedUsername) {
      setIsUsernameAvailable(false);
      setIsCheckingUsername(false);
      return;
    } else {
      handleCheckUsername();
    }
  }, [debouncedUsername]);

  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (loading) return;

    if (!username) {
      return toast.error("Please provide a username");
    }

    if (!isConnected || !account) {
      return toast.error("Please connect your wallet first");
    }

    setLoading(true);

    try {
      toast.loading("Creating your payment link...", {
        id: 'loading-payment-link',
      });

      // Register user in Supabase (if not already registered)
      await registerUser(account);

      // Update username in Supabase (this also creates payment link)
      await updateUsername(account, username.toLowerCase());

      toast.success("Payment link created successfully!", {
        id: 'loading-payment-link',
      });

      // Dispatch event to update payment links
      window.dispatchEvent(new CustomEvent('payment-links-updated'));

      setStep("two");
    } catch (e) {
      console.error('Error creating payment link', e);
      if (e.message?.includes('already taken')) {
        toast.error("This username is already taken", {
          id: 'loading-payment-link',
        });
      } else {
        toast.error("Error creating your payment link", {
          id: 'loading-payment-link',
        });
      }
    } finally {
      toast.dismiss('loading-payment-link');
      setLoading(false);
    }
  }

  return (
    <>
      <p className="text-2xl font-semibold">Let's get started!</p>
      <p className="text-lg mt-4">
        Pick a cool username for your PrivatePay. This will be your payment link,
        so anyone can easily send you money on Mantle Network.
      </p>
      <div className="mt-8 rounded-xl size-24 aspect-square bg-neutral-100 overflow-hidden mx-auto">
        <img
          src="/assets/nouns-placeholder.png"
          alt="nouns-placeholder"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="mt-8 w-full flex items-center relative">
        <Input
          className="w-full"
          type="text"
          classNames={{
            mainWrapper: "rounded-2xl",
            inputWrapper: "h-16",
            input:
              "focus-visible:outline-primary text-base placeholder:text-neutral-300",
          }}
          value={username}
          onChange={(e) => {
            const val = e.target.value.replace(/[^a-zA-Z0-9-_]/g, '');
            setUsername(val);
          }}
          placeholder="your-username"
          variant="bordered"
          isInvalid={!isUsernameAvailable && username}
        />
        <p className="absolute right-4 text-neutral-400">.privatepay.me</p>
      </div>
      {(!isUsernameAvailable && username) && (
        <div className="text-red-500 mt-1">
          Username is already taken
        </div>
      )}
      <Button
        onClick={handleUpdate}
        isLoading={loading || isCheckingUsername}
        isDisabled={loading || !isUsernameAvailable || isCheckingUsername || !isConnected}
        className="h-16 rounded-full text-white flex items-center justify-center w-full mt-4 bg-primary-600"
      >
        {!isConnected ? "Connect Wallet First" : "Continue"}
      </Button>
    </>
  );
}

function StepTwo({ setOpen }) {
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const { account } = useAptos();
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Get username from localStorage
    if (account) {
      const savedUsername = localStorage.getItem(`mantle_username_${account}`);
      setUsername(savedUsername || account.slice(0, 8));
    }
  }, [account]);

  useEffect(() => {
    const interval = setInterval(() => {
      setConfettiTrigger((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <p className="text-2xl font-semibold">You're all set!</p>
      <p className="text-lg mt-4">
        Your PrivatePay username is live and ready for action. Share it with anyone
        to start receiving payments on Mantle Network.
      </p>
      {/* Card */}
      <div className="w-full rounded-2xl bg-primary-600 h-[221px] mt-5 flex flex-col overflow-hidden relative">
        <div className="w-full flex items-center justify-end px-6 py-5 text-white">
          <p className="text-xl">{username}.privatepay.me</p>
        </div>
        <div className="bg-primary-50 flex-1 flex flex-col justify-end">
          <div className="w-full flex items-end justify-between py-5 px-6">
            <p className="text-primary-600 text-2xl font-medium">PRIVATEPAY</p>
            <SquidlLogo className="w-14" />
          </div>
        </div>
        {/* Image */}
        <div className="absolute size-24 top-6 left-6 rounded-xl bg-neutral-200 overflow-hidden">
          <img
            src="/assets/nouns-placeholder.png"
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <Button
        onClick={async () => {
          try {
            await navigator.share({
              title: "PrivatePay Link",
              text: `Send me payments: ${username}.privatepay.me`,
              url: `https://${username}.privatepay.me`
            });
          } catch (e) {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`https://${username}.privatepay.me`);
            toast.success("Link copied to clipboard!");
          }
        }}
        className="h-16 rounded-full text-white flex items-center justify-center w-full mt-4 bg-primary-600"
      >
        Start Sharing
      </Button>
      <Button
        onClick={() => {
          setOpen(false);
          navigate("/");
        }}
        className="h-16 rounded-full bg-transparent flex items-center justify-center w-full mt-1 text-primary-600"
      >
        Go to dashboard
      </Button>
      <div className="absolute inset-0 overflow-hidden flex flex-col items-center mx-auto pointer-events-none">
        <Confetti
          active={confettiTrigger}
          config={confettiConfig}
          className="-translate-y-[4rem] translate-x-[0.4rem]"
        />
      </div>
    </>
  );
}
