import React from "react";
import { motion } from "framer-motion";
import { Zap, Shield, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "../../components/common/UIComponents";

export const BRDSoftwarePage: React.FC = () => {
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
            BRD Software That Actually Works
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl">
            Generate professional Business Requirements Documents in minutes, not weeks. 
            AI-powered BRD software with built-in traceability, collaboration, and compliance features.
          </p>
          <div className="flex gap-4">
            <Button className="bg-purple-600 hover:bg-purple-500">
              Try Free BRD Generator
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" className="border-white/20">
              View Sample BRD
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Why BAHub is the Best BRD Software</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6 text-purple-400" />,
                title: "AI-Powered Generation",
                description: "Convert meeting notes into structured BRDs automatically. Our AI understands business context and requirements."
              },
              {
                icon: <Shield className="w-6 h-6 text-blue-400" />,
                title: "Built-in Compliance",
                description: "SOC 2 compliant with audit trails. Every change tracked for regulatory requirements and stakeholder sign-off."
              },
              {
                icon: <Users className="w-6 h-6 text-green-400" />,
                title: "Team Collaboration",
                description: "Real-time collaboration with version control. Stakeholders can review, comment, and approve requirements."
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
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">BAHub vs Traditional BRD Tools</h2>
          <div className="space-y-4">
            {[
              { feature: "AI-powered requirement extraction", bahub: true, traditional: false },
              { feature: "Real-time collaboration", bahub: true, traditional: false },
              { feature: "Built-in traceability matrix", bahub: true, traditional: false },
              { feature: "Compliance audit trails", bahub: true, traditional: false },
              { feature: "Jira integration", bahub: true, traditional: false },
              { feature: "Version control", bahub: true, traditional: true },
              { feature: "PDF export", bahub: true, traditional: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-white/10">
                <span className="font-medium">{item.feature}</span>
                <div className="flex gap-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-5 h-5 ${item.bahub ? 'text-green-400' : 'text-gray-600'}`} />
                    <span className="text-sm text-gray-400">BAHub</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-5 h-5 ${item.traditional ? 'text-green-400' : 'text-gray-600'}`} />
                    <span className="text-sm text-gray-400">Traditional</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your BRD Process?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of business analysts who've cut their BRD cycle from weeks to days.
          </p>
          <Button className="bg-purple-600 hover:bg-purple-500 text-lg px-8 py-4">
            Start Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
};
