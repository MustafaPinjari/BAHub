import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "../../assets/logo.png";

export const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate();
  const lastUpdated = "July 10, 2026";

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

      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-black tracking-tight text-white mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-10 text-gray-400 leading-relaxed text-sm">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using BAHub ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users including free tier, Pro, and Enterprise plan subscribers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Description of Service</h2>
            <p>BAHub is an AI-powered Business Analyst Workspace that provides tools for requirements management, process diagram generation, document compilation, stakeholder management, and related business analysis workflows. We may update, modify, or discontinue features at any time with reasonable notice to active subscribers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Account Registration</h2>
            <p className="mb-3">To use BAHub you must create an account with a valid email address. You are responsible for:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Maintaining the confidentiality of your credentials.</li>
              <li>All activity that occurs under your account.</li>
              <li>Notifying us immediately of any unauthorized access at <a href="mailto:bahubofficial@gmail.com" className="text-purple-400 hover:text-purple-300">bahubofficial@gmail.com</a>.</li>
            </ul>
            <p className="mt-3">You must be at least 16 years old to create an account.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Use the Service for any unlawful purpose or in violation of any regulations.</li>
              <li>Attempt to gain unauthorized access to other users' data or workspaces.</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service.</li>
              <li>Use automated scripts, bots, or scrapers against the Service without prior written consent.</li>
              <li>Upload malicious code, viruses, or any content designed to harm the Service or its users.</li>
              <li>Resell or sublicense access to the Service without a written agreement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Subscription and Billing</h2>
            <p className="mb-3">BAHub offers Free, Pro Growth, and Enterprise subscription tiers. Paid subscriptions are billed on a monthly or annual basis as selected at checkout.</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Payments are processed by Stripe. By subscribing, you agree to Stripe's Terms of Service.</li>
              <li>Subscriptions auto-renew unless cancelled before the renewal date.</li>
              <li>Refunds are considered on a case-by-case basis. Contact us within 7 days of a charge for refund requests.</li>
              <li>Downgrading your plan takes effect at the end of the current billing period.</li>
              <li>We reserve the right to change pricing with 30 days notice to existing subscribers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. AI Features</h2>
            <p>BAHub's AI features use third-party language model APIs (Google Gemini, OpenAI). AI-generated outputs are provided as-is and should be reviewed before use. We do not guarantee the accuracy, completeness, or suitability of AI outputs for any specific purpose. You are responsible for reviewing and validating all AI-generated content before relying on it in business decisions or documents.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Intellectual Property</h2>
            <p className="mb-3">You retain ownership of all content you create within BAHub, including requirements, diagrams, and documents.</p>
            <p>BAHub retains all rights to the platform software, design, branding, and underlying technology. The BAHub name, logo, and product design are protected intellectual property.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Data and Privacy</h2>
            <p>Your use of the Service is also governed by our <button onClick={() => navigate("/privacy")} className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</button>, which is incorporated into these Terms by reference.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Service Availability</h2>
            <p>We aim for high availability but do not guarantee uninterrupted service. We are not liable for downtime caused by infrastructure providers, maintenance windows, or force majeure events. We will communicate planned maintenance via email to active subscribers when possible.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, BAHub and its contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability to you for any claim shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Termination</h2>
            <p>We may suspend or terminate your account for violations of these Terms. You may delete your account at any time from your profile settings. Upon termination, your data will be deleted within 30 days per our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify active users by email at least 14 days before material changes take effect. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">13. Contact</h2>
            <div className="mt-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-white font-semibold">BAHub</p>
              <p className="text-gray-400">Email: <a href="mailto:bahubofficial@gmail.com" className="text-purple-400 hover:text-purple-300">bahubofficial@gmail.com</a></p>
            </div>
          </section>

        </div>
      </div>

      <div className="border-t border-white/[0.06] px-6 py-8 text-center">
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} BAHub. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
          <button onClick={() => navigate("/terms")} className="hover:text-gray-400 transition-colors text-purple-400">Terms of Service</button>
          <span>·</span>
          <button onClick={() => navigate("/privacy")} className="hover:text-gray-400 transition-colors">Privacy Policy</button>
          <span>·</span>
          <button onClick={() => navigate("/contact")} className="hover:text-gray-400 transition-colors">Contact</button>
        </div>
      </div>
    </div>
  );
};
