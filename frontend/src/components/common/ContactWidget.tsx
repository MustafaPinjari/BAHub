import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Mail, Send, Minimize2, Maximize2 } from "lucide-react";

interface ContactWidgetProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ContactWidget: React.FC<ContactWidgetProps> = ({ isOpen: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [isSent, setIsSent] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const handleSend = () => {
    if (!message.trim()) return;
    // In production, this would send to your backend
    console.log("Contact message:", message);
    setIsSent(true);
    setMessage("");
    setTimeout(() => setIsSent(false), 3000);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 0.3 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        aria-label="Open contact widget"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-40 w-[350px] max-w-[calc(100vw-3rem)] bg-gray-950 border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-widget-title"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.08] bg-gradient-to-r from-purple-600/10 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 id="contact-widget-title" className="text-sm font-semibold text-white">Contact Support</h3>
                  <p className="text-[10px] text-gray-500">We typically reply within 24h</p>
                </div>
              </div>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] text-gray-500 hover:text-white transition-colors"
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Content */}
            {!isMinimized && (
              <div className="p-5">
                {!isSent ? (
                  <>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                      Have questions about BAHub? Send us a message and we'll get back to you as soon as possible.
                    </p>
                    
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you?"
                      className="w-full h-32 px-3 py-2.5 text-sm rounded-lg bg-gray-900 border border-white/[0.08] text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none resize-none"
                      aria-label="Your message"
                    />

                    <div className="flex items-center justify-between mt-4">
                      <a
                        href="mailto:support@bahub.io"
                        className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-purple-400 transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Email us directly</span>
                      </a>
                      <button
                        onClick={handleSend}
                        disabled={!message.trim()}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                      <Send className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-white mb-1">Message sent!</p>
                    <p className="text-xs text-gray-500">We'll get back to you soon.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
