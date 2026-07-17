import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles } from "lucide-react";

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRegister: () => void;
  onTryDemo: () => void;
}

export const ExitIntentModal: React.FC<ExitIntentModalProps> = ({
  isOpen,
  onClose,
  onNavigateToRegister,
  onTryDemo,
}) => {
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if already shown this session
    const sessionShown = sessionStorage.getItem("exit_intent_shown");
    if (sessionShown) {
      setHasShown(true);
    }
  }, []);

  const handleMouseMove = (e: MouseEvent) => {
    if (hasShown || isOpen) return;

    // Detect when mouse leaves viewport from top
    if (e.clientY <= 0) {
      const timeOnPage = Date.now() - performance.timing.navigationStart;
      const minTimeOnPage = 10000; // 10 seconds minimum

      if (timeOnPage > minTimeOnPage) {
        sessionStorage.setItem("exit_intent_shown", "true");
        setHasShown(true);
        // Trigger parent to open
        window.dispatchEvent(new CustomEvent("show-exit-intent"));
      }
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [hasShown, isOpen]);

  const handleClose = () => {
    onClose();
    sessionStorage.setItem("exit_intent_shown", "true");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          onClick={handleClose}
        />
      )}
      
      {isOpen && (
        <div key="modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-gradient-to-br from-gray-950 to-black border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="exit-intent-title"
            >
              {/* Decorative gradient orb */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/[0.05] text-gray-500 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative p-8 sm:p-10">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>

                {/* Content */}
                <h2 id="exit-intent-title" className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
                  Wait! Don't leave empty-handed
                </h2>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8">
                  Get your first BRD generated in 60 seconds. No credit card required. Cancel anytime.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => { handleClose(); onNavigateToRegister(); }}
                    className="flex-1 px-6 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { handleClose(); onTryDemo(); }}
                    className="flex-1 px-6 py-3.5 rounded-xl border border-white/[0.12] text-white font-semibold text-sm hover:bg-white/[0.04] transition-all min-h-[48px]"
                  >
                    Try Demo
                  </button>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>5 seats free</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
      )}
    </AnimatePresence>
  );
};
