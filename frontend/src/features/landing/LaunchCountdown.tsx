import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Mail, CheckCircle, Loader2, X } from "lucide-react";

// Launch date: July 18, 2026 at 12:01 AM IST
const LAUNCH_DATE = new Date("2026-07-18T00:01:00+05:30");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft {
  const now = new Date().getTime();
  const target = LAUNCH_DATE.getTime();
  const diff = Math.max(0, target - now);

  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

const CountUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div className="relative w-full aspect-square max-w-[96px] min-w-[56px] rounded-2xl border border-white/[0.08] bg-[#0c0c0c]/80 backdrop-blur-md flex items-center justify-center overflow-hidden group shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        {/* Subtle top reflection highlights */}
        <div className="absolute inset-x-0 top-0 h-[50%] bg-white/[0.02] pointer-events-none" />
        {/* Horizontal split-flap line overlay */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/80 z-20" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/[0.05] z-10" />

        {/* Ambient indicator glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <AnimatePresence mode="wait">
          <motion.span
            key={display}
            initial={{ y: -15, opacity: 0, filter: "blur(2px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 15, opacity: 0, filter: "blur(2px)" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl sm:text-3xl md:text-4xl font-black text-white tabular-nums tracking-tight z-10 bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">{label}</span>
    </div>
  );
};

interface LaunchCountdownProps {
  onWaitlistJoin?: (email: string) => void;
}

export const LaunchCountdown: React.FC<LaunchCountdownProps> = ({ onWaitlistJoin }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft());
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      const tl = getTimeLeft();
      setTimeLeft(tl);
      if (tl.days === 0 && tl.hours === 0 && tl.minutes === 0 && tl.seconds === 0) {
        setLaunched(true);
        clearInterval(t);
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const base = isLocal ? "http://127.0.0.1:8000" : "https://bahub-backend.onrender.com";

      const res = await fetch(`${base}/api/v1/public/waitlist/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setSubmitted(true);
        onWaitlistJoin?.(email.trim());
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || data?.email?.[0] || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (launched) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full py-8 sm:py-12 px-2 overflow-hidden"
    >
      <div className="relative z-10 max-w-xl mx-auto text-center flex flex-col items-center gap-10">

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/15 bg-purple-500/[0.04] text-[9px] font-bold uppercase tracking-wider text-purple-300">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span>LAUNCHING JULY 18, 2026</span>
          <Rocket className="w-3 h-3 text-purple-400" />
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl sm:text-[32px] font-black tracking-tight text-white leading-tight">
            Something big is coming.<br />
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
              Be the first to know.
            </span>
          </h2>
          <p className="text-[12px] sm:text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
            BAHub is opening its doors on July 18. Join the waitlist and get exclusive early access with 3 months free Pro.
          </p>
        </div>

        {/* Grid-based Countdown - Completely Responsive */}
        <div className="grid grid-cols-4 gap-3 sm:gap-5 w-full max-w-md mx-auto px-2">
          <CountUnit value={timeLeft.days}    label="Days"    />
          <CountUnit value={timeLeft.hours}   label="Hours"   />
          <CountUnit value={timeLeft.minutes} label="Mins"    />
          <CountUnit value={timeLeft.seconds} label="Secs"    />
        </div>

        {/* Waitlist Form */}
        <div className="w-full max-w-md px-2 mt-2">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onSubmit={handleSubmit}
                className="w-full flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm bg-white/[0.03] border border-white/[0.08] text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Join Waitlist</>
                    )}
                  </button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-500/15 rounded-xl px-3.5 py-2.5"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </motion.div>
                )}

                <p className="text-[9px] text-gray-700 text-center tracking-wide">
                  No spam. Unsubscribe anytime. We'll notify you the moment we launch.
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/25 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.1)]">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-sm font-bold text-white">You're on the list!</p>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  We've sent a confirmation to <span className="text-gray-300 font-semibold">{email}</span>. We'll email you on launch day.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
};
