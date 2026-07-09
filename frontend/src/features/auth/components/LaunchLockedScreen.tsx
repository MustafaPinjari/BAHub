import React from "react";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, ShieldAlert } from "lucide-react";
import { LaunchCountdown } from "../../landing/LaunchCountdown";

interface LaunchLockedScreenProps {
  onAdminClick: () => void;
  onBackToHome: () => void;
}

export const LaunchLockedScreen: React.FC<LaunchLockedScreenProps> = ({ onAdminClick, onBackToHome }) => {
  return (
    <div className="w-screen min-h-screen bg-black text-white flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px] top-0 right-0 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px] bottom-0 left-0 pointer-events-none" />

      {/* Navigation Header */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={onBackToHome}
          className="text-[10px] font-bold text-gray-600 hover:text-gray-300 cursor-pointer flex items-center gap-1.5 bg-transparent border-none outline-none transition-colors duration-150"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>
      </div>

      <div className="max-w-2xl w-full flex flex-col items-center text-center gap-6 relative z-10">
        {/* Animated Lock Icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.15)]"
        >
          <Lock className="w-7 h-7" />
        </motion.div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
            Platform is Closed
          </h1>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            BAHub is currently locked during our private preparation phase. We will open public registrations on launch day. Sign up to get notified!
          </p>
        </div>

        {/* Embedded Launch Countdown */}
        <div className="w-full border border-white/[0.06] bg-white/[0.01] backdrop-blur-md rounded-3xl p-4 sm:p-8">
          <LaunchCountdown />
        </div>

        {/* Admin Bypass Link */}
        <button
          onClick={onAdminClick}
          className="mt-4 inline-flex items-center gap-1.5 text-[9px] font-bold text-gray-600 hover:text-purple-400 uppercase tracking-widest bg-transparent border-none outline-none cursor-pointer transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5" /> Are you a platform admin? Sign In
        </button>
      </div>
    </div>
  );
};
