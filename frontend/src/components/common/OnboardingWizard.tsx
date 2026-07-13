import React, { useState, useEffect } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import { useProject } from "../../features/projects/ProjectContext";
import type { Project } from "../../features/projects/ProjectContext";
import { api } from "../../services/api";
import { Button, Input, Alert } from "./UIComponents";
import { motion } from "framer-motion";
import {
  Sparkles,
  FolderGit,
  Users,
  FileSpreadsheet,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  BarChart2
} from "lucide-react";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { setActiveProject } = useProject();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Completed items to display in progress
  const [createdProject, setCreatedProject] = useState<Project | null>(null);
  const [createdStakeholder, setCreatedStakeholder] = useState<any | null>(null);
  const [createdRequirement, setCreatedRequirement] = useState<any | null>(null);

  // Step 2 Form: Project
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");

  // Step 3 Form: Stakeholder
  const [stkName, setStkName] = useState("");
  const [stkTitle, setStkTitle] = useState("");
  const [stkPower, setStkPower] = useState("5");
  const [stkInterest, setStkInterest] = useState("5");

  // Step 4 Form: Requirement
  const [reqTitle, setReqTitle] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqPriority, setReqPriority] = useState("MEDIUM");

  // Update step completion status
  useEffect(() => {
    // Step completion logic can be added here if needed
  }, [step, createdProject, createdStakeholder, createdRequirement]);

  if (!isOpen) return null;

  const handleNext = () => {
    setError(null);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  // Step 2: Create Project
  const submitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<any, { data: Project }>("/projects/", {
        name: projectName,
        description: projectDesc,
        status: "ACTIVE",
      });
      setCreatedProject(res.data);
      setActiveProject(res.data); // Lock it in active project context immediately!
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to create project context.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Create Stakeholder
  const submitStakeholder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stkName || !createdProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<any, { data: any }>("/stakeholders/", {
        project: createdProject.id,
        name: stkName,
        title: stkTitle || "Stakeholder",
        influence_level: parseInt(stkPower),
        interest_level: parseInt(stkInterest),
        communication_channel: "Email",
      });
      setCreatedStakeholder(res.data);
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to add stakeholder.");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Create Requirement
  const submitRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle || !createdProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<any, { data: any }>("/requirements/", {
        project: createdProject.id,
        title: reqTitle,
        description: reqDesc || "Detailed requirement specification...",
        req_type: "FUNCTIONAL",
        priority: reqPriority,
        status: "DRAFT",
        version: "1.0",
        source_stakeholder: createdStakeholder?.id || null,
      });
      setCreatedRequirement(res.data);
      setStep(5);
    } catch (err: any) {
      setError(err.message || "Failed to save requirement.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (user?.id) {
      localStorage.setItem(`bahub_onboarding_completed_${user.id}`, "true");
    }
    onClose();
  };

  const handleSkip = () => {
    if (user?.id) {
      localStorage.setItem(`bahub_onboarding_completed_${user.id}`, "true");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-gray-950 border border-white/[0.08] rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col text-left">
        {/* Progress bar line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/[0.03]">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Step Indicator Header */}
        <div className="flex items-center justify-between mb-8 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <span>Onboarding Progress</span>
          <span className="text-purple-400">Step {step} of 5</span>
        </div>

        {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}

        {/* STEP 1: Welcome Screen */}
        {step === 1 && (
          <div className="flex flex-col gap-4 py-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Welcome to BAHub, {user?.first_name || user?.username}!
            </h1>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              We'll get you onboarded in under 2 minutes. Let's create your first **Project**, add a **Key Stakeholder**, and compile your first **Business Requirement** step-by-step.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <Button onClick={handleNext} className="w-full flex items-center justify-center gap-1.5 py-2.5">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Create Project */}
        {step === 2 && (
          <form onSubmit={submitProject} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
                <FolderGit className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Create a Workspace Project</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Every workspace needs at least one project context to house requirements, user stories, meetings, and diagrams.
            </p>

            <Input
              label="Project Title"
              placeholder="e.g. Next-Gen Mobile Banking"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              disabled={loading}
            />

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Project Description</label>
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Brief summary of the goals, target release date, and stakeholders..."
                disabled={loading}
                className="w-full min-h-[80px] text-xs bg-gray-900 border border-white/[0.08] text-gray-200 rounded-md p-2.5 outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-between mt-6">
              <Button type="button" variant="ghost" size="sm" onClick={handleBack} disabled={loading}>
                Back
              </Button>
              <Button type="submit" size="sm" isLoading={loading}>
                Create & Continue <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Add Stakeholders */}
        {step === 3 && (
          <form onSubmit={submitStakeholder} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Register a Project Stakeholder</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Adding stakeholders helps you map requirements back to the users and key decision-makers who requested them.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Sarah Jenkins"
                value={stkName}
                onChange={(e) => setStkName(e.target.value)}
                required
                disabled={loading}
              />
              <Input
                label="Role / Title"
                placeholder="e.g. VP of Retail Banking"
                value={stkTitle}
                onChange={(e) => setStkTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Influence (1 - 10)</label>
                <select
                  value={stkPower}
                  onChange={(e) => setStkPower(e.target.value)}
                  disabled={loading}
                  className="bg-gray-900 border border-white/[0.08] text-gray-200 text-xs rounded-md p-2 outline-none cursor-pointer focus:border-purple-500"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Interest (1 - 10)</label>
                <select
                  value={stkInterest}
                  onChange={(e) => setStkInterest(e.target.value)}
                  disabled={loading}
                  className="bg-gray-900 border border-white/[0.08] text-gray-200 text-xs rounded-md p-2 outline-none cursor-pointer focus:border-purple-500"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <Button type="button" variant="ghost" size="sm" onClick={handleBack} disabled={loading}>
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="minimal" size="sm" onClick={handleNext} disabled={loading}>
                  Skip Step
                </Button>
                <Button type="submit" size="sm" isLoading={loading}>
                  Add Stakeholder <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 4: Write Requirement */}
        {step === 4 && (
          <form onSubmit={submitRequirement} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Create your First Requirement</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Requirements outline the core functional specifications and details for your development team.
            </p>

            <Input
              label="Requirement Title"
              placeholder="e.g. Secure Biometric Login Authorization"
              value={reqTitle}
              onChange={(e) => setReqTitle(e.target.value)}
              required
              disabled={loading}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Priority</label>
                <select
                  value={reqPriority}
                  onChange={(e) => setReqPriority(e.target.value)}
                  disabled={loading}
                  className="bg-gray-900 border border-white/[0.08] text-gray-200 text-xs rounded-md p-2 outline-none cursor-pointer focus:border-purple-500"
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              {createdStakeholder && (
                <div className="flex flex-col text-left">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Requested By</label>
                  <span className="text-xs font-semibold text-gray-400 mt-2">
                    {createdStakeholder.name} ({createdStakeholder.title})
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Requirement Details</label>
              <textarea
                value={reqDesc}
                onChange={(e) => setReqDesc(e.target.value)}
                placeholder="e.g. As a banking user, I want to use fingerprint or FaceID to authenticate quickly instead of typing my password..."
                disabled={loading}
                className="w-full min-h-[60px] text-xs bg-gray-900 border border-white/[0.08] text-gray-200 rounded-md p-2.5 outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-between mt-6">
              <Button type="button" variant="ghost" size="sm" onClick={handleBack} disabled={loading}>
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="minimal" size="sm" onClick={handleNext} disabled={loading}>
                  Skip Step
                </Button>
                <Button type="submit" size="sm" isLoading={loading}>
                  Compile Requirement <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 5: Explore Features */}
        {step === 5 && (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Explore BAHub Features</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              You're all set! Here are some powerful features to help you with business analysis.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                {
                  icon: <Shield className="w-4 h-4 text-blue-400" />,
                  title: "Audit Logs",
                  description: "Track all changes for compliance"
                },
                {
                  icon: <BarChart2 className="w-4 h-4 text-green-400" />,
                  title: "Traceability",
                  description: "Link requirements to stories"
                },
                {
                  icon: <Sparkles className="w-4 h-4 text-purple-400" />,
                  title: "AI Analysis",
                  description: "Generate insights automatically"
                },
                {
                  icon: <FileSpreadsheet className="w-4 h-4 text-orange-400" />,
                  title: "BRD Generator",
                  description: "Export professional documents"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
                  onClick={() => {
                    // Navigate to relevant feature
                    if (feature.title === "Audit Logs") window.location.href = "/audit";
                    if (feature.title === "Traceability") window.location.href = "/traceability";
                    if (feature.title === "AI Analysis") window.location.href = "/ai";
                    if (feature.title === "BRD Generator") window.location.href = "/brd";
                  }}
                >
                  <div className="mb-2">{feature.icon}</div>
                  <h3 className="text-xs font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-[10px] text-gray-500">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6">
              <Button type="button" variant="ghost" size="sm" onClick={handleBack} disabled={loading}>
                Back
              </Button>
              <Button type="button" size="sm" onClick={handleComplete}>
                Complete Onboarding <CheckCircle className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Skip Button */}
        {step < 5 && (
          <button
            onClick={handleSkip}
            className="absolute bottom-4 right-4 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};
