import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Sparkles, CheckCircle2 } from "lucide-react";

export default function MobileSupportAlert() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this alert before
    const dismissed = localStorage.getItem("mobile-support-alert-dismissed");
    if (!dismissed) {
      // Show after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("mobile-support-alert-dismissed", "true");
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-2xl">
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-pulse opacity-75"></div>
            
            {/* Content */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-5">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              {/* Icon and content */}
              <div className="flex items-start gap-4 pr-8">
                {/* Animated icon container */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl blur-md opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  {/* Sparkle effects */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                </div>

                {/* Text content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Now Works 100% on Mobile!
                    </h3>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </motion.div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                    Experience seamless wallet connections on iOS, Android, and all mobile devices. 
                    Connect your MetaMask wallet instantly and send private payments on the go! 🚀
                  </p>
                  
                  {/* Feature badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      <CheckCircle2 className="w-3 h-3" />
                      iOS Ready
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      <CheckCircle2 className="w-3 h-3" />
                      Android Ready
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                      <CheckCircle2 className="w-3 h-3" />
                      Try It Out!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
