import React from "react";
import { motion } from "framer-motion";
import { Layers, GitBranch, CheckCircle, ArrowRight, Zap } from "lucide-react";
import { Button } from "../../components/common/UIComponents";

export const RequirementsManagementPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Requirements Management Software
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl">
            Streamline your requirements lifecycle with AI-powered traceability, collaboration, and compliance. 
            The modern alternative to spreadsheets and legacy tools.
          </p>
          <div className="flex gap-4">
            <Button className="bg-purple-600 hover:bg-purple-500">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" className="border-white/20">
              Watch Demo
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Complete Requirements Lifecycle Management</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Layers className="w-6 h-6 text-purple-400" />,
                title: "Centralized Repository",
                description: "Single source of truth for all requirements with version control and history."
              },
              {
                icon: <GitBranch className="w-6 h-6 text-blue-400" />,
                title: "Traceability Matrix",
                description: "Link requirements to user stories, test cases, and documents automatically."
              },
              {
                icon: <Zap className="w-6 h-6 text-yellow-400" />,
                title: "AI Analysis",
                description: "Extract requirements from meeting notes and documents with AI."
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-green-400" />,
                title: "Approval Workflows",
                description: "Built-in sign-off process for stakeholders and compliance requirements."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl border border-white/10 bg-black/50"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Built for Every Industry</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Software Development",
                items: ["Functional requirements", "User stories", "API specifications"]
              },
              {
                title: "Financial Services",
                items: ["Compliance requirements", "Risk documentation", "Audit trails"]
              },
              {
                title: "Healthcare",
                items: ["HIPAA requirements", "Process documentation", "Validation protocols"]
              }
            ].map((industry, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-xl font-bold mb-4">{industry.title}</h3>
                <ul className="space-y-2">
                  {industry.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Transform Your Requirements Process</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join teams that have reduced requirements review time by 60% with BAHub.
          </p>
          <Button className="bg-purple-600 hover:bg-purple-500 text-lg px-8 py-4">
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
};
