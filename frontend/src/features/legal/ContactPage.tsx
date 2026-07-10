import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, MessageSquare, Zap, Shield } from "lucide-react";
import logo from "../../assets/logo.png";

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Opens native mail client as a reliable no-backend contact method
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:bahubofficial@gmail.com?subject=${encodeURIComponent(form.subject || "BAHub Contact")}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <div className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>
        <div className="flex items-center gap-2">
          <img src={logo} alt="BAHub" className="w-5 h-5 object-contain" />
          <span className="text-xs font-bold text-white/70">BAHub</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="mb-14 text-center">
          <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-3">Support</p>
          <h1 className="text-4xl font-black tracking-tight text-white mb-4">Get in touch</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">We typically respond within 24 hours on business days.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* Left: contact info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {[
              {
                icon: <Mail className="w-4 h-4 text-purple-400" />,
                title: "Email us",
                desc: "For general enquiries, billing, and account questions.",
                value: "bahubofficial@gmail.com",
                href: "mailto:bahubofficial@gmail.com",
              },
              {
                icon: <Zap className="w-4 h-4 text-amber-400" />,
                title: "Feature requests",
                desc: "Have an idea that would make BAHub better?",
                value: "Send us a message",
                href: "mailto:bahubofficial@gmail.com?subject=Feature Request",
              },
              {
                icon: <Shield className="w-4 h-4 text-green-400" />,
                title: "Security issues",
                desc: "Found a vulnerability? Please report it responsibly.",
                value: "security@bahub (email)",
                href: "mailto:bahubofficial@gmail.com?subject=Security Report",
              },
              {
                icon: <MessageSquare className="w-4 h-4 text-blue-400" />,
                title: "Enterprise sales",
                desc: "Interested in an Enterprise plan or custom deployment?",
                value: "Contact sales",
                href: "mailto:bahubofficial@gmail.com?subject=Enterprise Enquiry",
              },
            ].map(item => (
              <a key={item.title} href={item.href}
                className="flex items-start gap-4 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all group">
                <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  <p className="text-xs text-purple-400 mt-2 font-medium">{item.value}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Right: contact form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-5">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Email client opened</h3>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">Your default email client should have opened with your message pre-filled. Send it and we'll get back to you within 24 hours.</p>
                <button onClick={() => setSubmitted(false)} className="mt-6 text-xs text-purple-400 hover:text-purple-300 transition-colors">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Send a message</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Your Name</label>
                    <input
                      type="text" required placeholder="Jane Smith"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-black border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-purple-500/60 transition-colors placeholder:text-gray-700"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Your Email</label>
                    <input
                      type="email" required placeholder="jane@company.com"
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="bg-black border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-purple-500/60 transition-colors placeholder:text-gray-700"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Subject</label>
                  <select
                    value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="bg-black border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-purple-500/60 transition-colors cursor-pointer"
                  >
                    <option value="">Select a topic...</option>
                    <option value="General Enquiry">General Enquiry</option>
                    <option value="Billing Question">Billing Question</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Enterprise Sales">Enterprise Sales</option>
                    <option value="Security Report">Security Report</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Message</label>
                  <textarea
                    required placeholder="Describe your question or request..."
                    value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={6}
                    className="bg-black border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-purple-500/60 transition-colors resize-none placeholder:text-gray-700"
                  />
                </div>

                <button type="submit"
                  className="w-full py-3 rounded-xl bg-white text-black text-xs font-bold hover:bg-gray-100 active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Open Email Client to Send
                </button>
                <p className="text-[10px] text-gray-600 text-center">This will open your email client with the message pre-filled.</p>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-6 py-8 text-center">
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} BAHub. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
          <button onClick={() => navigate("/terms")} className="hover:text-gray-400 transition-colors">Terms of Service</button>
          <span>·</span>
          <button onClick={() => navigate("/privacy")} className="hover:text-gray-400 transition-colors">Privacy Policy</button>
          <span>·</span>
          <button onClick={() => navigate("/contact")} className="hover:text-gray-400 transition-colors text-purple-400">Contact</button>
        </div>
      </div>
    </div>
  );
};
