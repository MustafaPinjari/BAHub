import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "../../assets/logo.png";

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const lastUpdated = "July 10, 2026";

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* Navbar */}
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
          <h1 className="text-4xl font-black tracking-tight text-white mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-gray-400 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Who We Are</h2>
            <p>
              BAHub ("we", "our", "us") is an AI-powered Business Analyst Workspace platform operated by BAHub. Our platform helps business analysts, product managers, and software teams synthesize requirements, generate specifications, and manage project documentation.
            </p>
            <p className="mt-3">
              Contact: <a href="mailto:bahubofficial@gmail.com" className="text-purple-400 hover:text-purple-300">bahubofficial@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect the following categories of information:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><span className="text-white font-semibold">Account information:</span> Email address, username, first and last name, and password (stored as a bcrypt hash).</li>
              <li><span className="text-white font-semibold">Workspace data:</span> Projects, requirements, stakeholders, user stories, diagrams, documents, meetings, risks, and audit logs you create within the platform.</li>
              <li><span className="text-white font-semibold">Usage data:</span> Pages visited, features used, and actions performed within the workspace — used to improve the product.</li>
              <li><span className="text-white font-semibold">Session data:</span> IP address, user agent, and login timestamps for security and session management.</li>
              <li><span className="text-white font-semibold">Payment data:</span> Billing is handled by Stripe. We do not store full card numbers. We receive subscription status and billing history from Stripe.</li>
              <li><span className="text-white font-semibold">AI inputs:</span> Text prompts you submit to the AI Workspace are processed to generate outputs. We do not use your prompts to train AI models.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>To provide, maintain, and improve the BAHub platform.</li>
              <li>To authenticate your identity and secure your account.</li>
              <li>To send transactional emails (account verification, password reset, billing receipts).</li>
              <li>To enforce subscription limits and manage billing through Stripe.</li>
              <li>To generate AI outputs based on prompts you submit.</li>
              <li>To detect and prevent fraudulent or abusive activity.</li>
              <li>To comply with legal obligations.</li>
            </ul>
            <p className="mt-3">We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Data Sharing</h2>
            <p className="mb-3">We share your data only with:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><span className="text-white font-semibold">Stripe:</span> Payment processing. Subject to Stripe's Privacy Policy.</li>
              <li><span className="text-white font-semibold">Google Gemini / OpenAI:</span> AI prompt processing when you use the AI Workspace. Your prompts are sent to their APIs subject to their data policies. We do not send personal identifiers with AI prompts.</li>
              <li><span className="text-white font-semibold">Render / Hosting providers:</span> Infrastructure hosting. Your data is stored on servers managed by our infrastructure provider.</li>
              <li><span className="text-white font-semibold">Legal authorities:</span> When required by law, court order, or to protect the safety of users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Data Security</h2>
            <p>
              We implement industry-standard security practices including HTTPS encryption in transit, bcrypt password hashing, JWT token rotation and blacklisting, and multi-tenant data isolation to prevent cross-organization data access.
            </p>
            <p className="mt-3">
              All user actions are recorded in immutable audit logs for compliance and security review. Sessions can be viewed and revoked by users from their profile settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. If you delete your account, your personal data and workspace content are permanently deleted within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate personal data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Export your workspace data.</li>
              <li>Object to or restrict certain processing.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at <a href="mailto:bahubofficial@gmail.com" className="text-purple-400 hover:text-purple-300">bahubofficial@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Cookies</h2>
            <p>
              BAHub uses minimal cookies strictly necessary for authentication (JWT tokens stored in localStorage) and session management. We do not use third-party tracking cookies or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Children's Privacy</h2>
            <p>
              BAHub is a professional B2B platform not directed at children under 16. We do not knowingly collect personal data from anyone under 16. If you believe a child has provided us data, contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify registered users by email and update the "Last updated" date above. Continued use of BAHub after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Contact Us</h2>
            <p>
              For privacy-related questions, requests, or concerns:
            </p>
            <div className="mt-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm">
              <p className="text-white font-semibold">BAHub</p>
              <p className="text-gray-400">Email: <a href="mailto:bahubofficial@gmail.com" className="text-purple-400 hover:text-purple-300">bahubofficial@gmail.com</a></p>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.06] px-6 py-8 text-center">
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} BAHub. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
          <button onClick={() => navigate("/terms")} className="hover:text-gray-400 transition-colors">Terms of Service</button>
          <span>·</span>
          <button onClick={() => navigate("/privacy")} className="hover:text-gray-400 transition-colors text-purple-400">Privacy Policy</button>
          <span>·</span>
          <button onClick={() => navigate("/contact")} className="hover:text-gray-400 transition-colors">Contact</button>
        </div>
      </div>
    </div>
  );
};
