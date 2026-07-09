import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Mail, CheckCircle, Loader2, X } from "lucide-react";

// Launch date: July 18, 2026 at 00:00:00 UTC
const LAUNCH_DATE = new Date("2026-07-18T00:00:00Z");

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
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-white/[0.10] bg-white/[0.03] backdrop-blur-sm flex items-center justify-center overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
        <AnimatePresence mode="wait">
          <motion.span
            key={display}
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-600">{label}</span>
    </div>
  );
};

interface LaunchCountdownProps {
  /** Called after user joins waitlist, passes the submitted email */
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
      // Determine backend URL
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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full py-16 px-6 overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/[0.06] blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] rounded-full bg-purple-600/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center gap-8">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/[0.07] text-[10px] font-bold uppercase tracking-wider text-blue-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Launching July 18, 2026
          <Rocket className="w-3 h-3 ml-0.5" />
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Something big is coming.<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Be the first to know.
            </span>
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
            BAHub is opening its doors on July 18. Join the waitlist and get exclusive early access with 3 months free Pro.
          </p>
        </div>

        {/* Countdown blocks */}
        <div className="flex items-center gap-3 sm:gap-4">
          <CountUnit value={timeLeft.days}    label="Days"    />
          <span className="text-2xl font-black text-white/20 mb-5">:</span>
          <CountUnit value={timeLeft.hours}   label="Hours"   />
          <span className="text-2xl font-black text-white/20 mb-5">:</span>
          <CountUnit value={timeLeft.minutes} label="Minutes" />
          <span className="text-2xl font-black text-white/20 mb-5">:</span>
          <CountUnit value={timeLeft.seconds} label="Seconds" />
        </div>

        {/* Waitlist form */}
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onSubmit={handleSubmit}
              className="w-full max-w-md flex flex-col gap-3"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="Enter your email address"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm bg-white/[0.04] border border-white/[0.09] text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    required
                    disabled={submitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-gray-100 transition-all flex items-center gap-2 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
                  className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-500/15 rounded-lg px-3 py-2"
                >
                  <X className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </motion.div>
              )}

              <p className="text-[10px] text-gray-700">
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
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/25 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-sm font-bold text-white">You're on the list!</p>
              <p className="text-xs text-gray-500 max-w-xs">
                We've sent a confirmation to <span className="text-gray-300 font-semibold">{email}</span>. We'll email you on launch day.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider line */}
        <div className="w-full border-t border-white/[0.05]" />
      </div>
    </motion.section>
  );
};
