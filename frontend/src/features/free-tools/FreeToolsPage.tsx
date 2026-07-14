import React from "react";
import { motion } from "framer-motion";
import { FileText, GitBranch, Target, CheckSquare, Users, ListChecks, FileCheck, ArrowRight } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const TOOLS: Tool[] = [
  {
    id: "brd-generator",
    name: "BRD Generator",
    description: "Generate IEEE-structured Business Requirements Documents",
    icon: <FileText className="w-5 h-5" />,
    path: "/free-tools/brd-generator",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "user-story-generator",
    name: "User Story Generator",
    description: "Create Jira-ready user stories with acceptance criteria",
    icon: <GitBranch className="w-5 h-5" />,
    path: "/free-tools/user-story-generator",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "swot-generator",
    name: "SWOT Generator",
    description: "Analyze Strengths, Weaknesses, Opportunities, Threats",
    icon: <Target className="w-5 h-5" />,
    path: "/free-tools/swot-generator",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    id: "smart-goal-generator",
    name: "SMART Goal Generator",
    description: "Create Specific, Measurable, Achievable, Relevant, Time-bound goals",
    icon: <CheckSquare className="w-5 h-5" />,
    path: "/free-tools/smart-goal-generator",
    color: "from-amber-500 to-amber-600",
  },
  {
    id: "stakeholder-matrix",
    name: "Stakeholder Matrix",
    description: "Map and prioritize project stakeholders",
    icon: <Users className="w-5 h-5" />,
    path: "/free-tools/stakeholder-matrix",
    color: "from-rose-500 to-rose-600",
  },
  {
    id: "moscow-prioritization",
    name: "MoSCoW Prioritization",
    description: "Categorize requirements as Must, Should, Could, Won't",
    icon: <ListChecks className="w-5 h-5" />,
    path: "/free-tools/moscow-prioritization",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    id: "requirement-template",
    name: "Requirement Template",
    description: "Structured templates for writing clear requirements",
    icon: <FileCheck className="w-5 h-5" />,
    path: "/free-tools/requirement-template",
    color: "from-violet-500 to-violet-600",
  },
];

export const FreeToolsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Free Business Analysis Tools
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Professional-grade tools to streamline your requirements workflow. No signup required.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool, index) => (
            <motion.a
              key={tool.id}
              href={tool.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative bg-gray-950 border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.16] transition-all duration-300"
            >
              {/* Gradient glow on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}
              />
              
              <div className="relative">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {tool.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  {tool.description}
                </p>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                  <span>Try for free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      {/* SEO Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/[0.06]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="prose prose-invert prose-lg max-w-none"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Why Use Our Free BA Tools?</h2>
          <p className="text-gray-400 mb-6">
            Our free business analysis tools are designed by professional BAs with years of experience in enterprise environments. Each tool follows industry best practices and standards like IEEE, BABOK, and Agile methodologies.
          </p>
          
          <h3 className="text-xl font-semibold text-white mb-3">Features</h3>
          <ul className="text-gray-400 space-y-2 mb-6">
            <li>• No signup or registration required</li>
            <li>• Instant results with professional formatting</li>
            <li>• Export to PDF, Word, or copy to clipboard</li>
            <li>• Mobile-responsive design for on-the-go access</li>
            <li>• Built-in templates and best practices</li>
          </ul>

          <h3 className="text-xl font-semibold text-white mb-3">Perfect For</h3>
          <ul className="text-gray-400 space-y-2">
            <li>• Business Analysts and Product Managers</li>
            <li>• Project Managers and Scrum Masters</li>
            <li>• Startup founders and entrepreneurs</li>
            <li>• Students learning business analysis</li>
            <li>• Consultants and freelancers</li>
          </ul>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-gradient-to-br from-purple-600/10 to-transparent border border-purple-500/20 rounded-3xl p-8 sm:p-12 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Need More Advanced Features?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Upgrade to BAHub Pro for AI-powered requirements extraction, team collaboration, Jira integration, and comprehensive traceability.
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default FreeToolsPage;
