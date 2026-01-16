import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg mx-auto mb-4"
        >
          <div className="relative w-full rounded-3xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* Content */}
            <div className="px-6 py-5 pr-12">
              <p className="text-center text-base text-gray-700 leading-relaxed">
                <span className="font-semibold text-primary">Now works 100% on mobile iOS and the rest.</span>
                {" "}
                <span className="text-gray-600">Try it out!</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
