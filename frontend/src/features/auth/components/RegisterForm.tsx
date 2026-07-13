import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../AuthContext";
import { Input, Button, Select, Alert } from "../../../components/common/UIComponents";
import { Briefcase, Building, Key, Mail, User as UserIcon } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Must be a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one digit")
    .regex(/[!@#$%^&*(),.?\":{}|<>[\]\\_\-+=~`/;']/, "Must contain at least one special character"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role: z.enum(["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER", "DEVELOPER", "QA_TESTER", "STAKEHOLDER"] as const),
  organization_name: z.string().optional(),
});

type RegisterSchemaType = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess: () => void;
  onNavigateToLogin: () => void;
}

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "BUSINESS_ANALYST", label: "Business Analyst" },
  { value: "PRODUCT_OWNER", label: "Product Owner" },
  { value: "DEVELOPER", label: "Developer" },
  { value: "QA_TESTER", label: "QA Tester" },
  { value: "STAKEHOLDER", label: "Stakeholder" },
];

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onNavigateToLogin }) => {
  const { register: registerApi, verifyOtp, resendOtp } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("FREE");
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [registeredUsername, setRegisteredUsername] = useState<string>("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (token) {
      setInviteToken(token);
      setStep(2);
    }
    const emailParam = params.get("email");
    if (emailParam) {
      setValue("email", emailParam);
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "BUSINESS_ANALYST",
    },
  });

  const onSubmit = async (data: RegisterSchemaType) => {
    setFormError(null);
    setLoading(true);
    try {
      // Submit registration along with chosen plan_tier. 
      // AuthContext's register method handles payment redirect internally for paid plans.
      const res = await registerApi({
        ...data,
        plan_tier: selectedPlan,
        invite_token: inviteToken || undefined,
      });

      if (res?.requires_verification) {
        setRegisteredUsername(res.username || data.username);
        setStep(3);
      } else {
        localStorage.setItem("show_onboarding_wizard", "true");
        onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      if (err.errors) {
        const keys = Object.keys(err.errors);
        const firstKey = keys[0];
        if (firstKey) {
          const val = err.errors[firstKey];
          const errMsg = Array.isArray(val) ? val.join(" ") : val;
          if (errMsg.toLowerCase().includes("already exists")) {
            setFormError(`${firstKey}: ${errMsg} If you did not verify your account yet, please click "Sign In" at the bottom and log in to verify your email.`);
          } else {
            setFormError(`${firstKey}: ${errMsg}`);
          }
        }
      } else {
        setFormError(err.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setOtpError("Verification code must be 6 digits.");
      return;
    }
    setOtpError(null);
    setFormError(null);
    setLoading(true);
    try {
      await verifyOtp(registeredUsername, otpCode, selectedPlan);
      localStorage.setItem("show_onboarding_wizard", "true");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setOtpError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setFormError(null);
    setOtpError(null);
    setLoading(true);
    try {
      await resendOtp(registeredUsername);
      setResendCountdown(60);
    } catch (err: any) {
      console.error(err);
      setOtpError(err.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[380px] flex flex-col gap-5 select-none bg-background">
      {formError && (
        <Alert variant="destructive">
          {formError}
        </Alert>
      )}
      {step === 1 ? (
        <>
          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20 shrink-0 mb-1">
              <Building className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Select Subscription Plan</h1>
            <p className="text-xs text-muted-foreground">
              Choose a plan to customize your AI-powered analyst workspace.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Free Plan Card */}
            <div
              onClick={() => setSelectedPlan("FREE")}
              className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all flex justify-between items-center ${
                selectedPlan === "FREE"
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-slate-400 bg-card"
              }`}
            >
              <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground">Free Starter</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">5 Seats • 100 AI credits • Basic SWOT & Gap</span>
              </div>
              <span className="font-extrabold text-base text-foreground">$0</span>
            </div>

            {/* Pro Plan Card */}
            <div
              onClick={() => setSelectedPlan("PRO")}
              className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all flex justify-between items-center relative overflow-hidden ${
                selectedPlan === "PRO"
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-slate-400 bg-card"
              }`}
            >
              <div className="absolute top-0 right-0 bg-primary text-[8px] font-black text-white px-2 py-0.5 rounded-bl">
                POPULAR
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground">Pro Growth</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">20 Seats • 1,000 AI credits • BRD/FRD Compiler</span>
              </div>
              <span className="font-extrabold text-base text-foreground">$49</span>
            </div>

            {/* Enterprise Plan Card */}
            <div
              onClick={() => setSelectedPlan("ENTERPRISE")}
              className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all flex justify-between items-center ${
                selectedPlan === "ENTERPRISE"
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-slate-400 bg-card"
              }`}
            >
              <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground">Enterprise Core</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">1,000 Seats • 10,000 AI credits • SSO & Audit Logs</span>
              </div>
              <span className="font-extrabold text-base text-foreground">$299</span>
            </div>

            <Button
              onClick={() => setStep(2)}
              variant="primary"
              className="w-full font-bold mt-2 py-2.5 flex items-center justify-center gap-1.5"
            >
              Continue to Details
            </Button>
          </div>
        </>
      ) : step === 2 ? (
        <>
          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20 shrink-0 mb-1">
              <Building className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Create BAHub Workspace</h1>
            <p className="text-xs text-muted-foreground">
              Register your profile and workspace details for the <strong className="text-primary">{selectedPlan}</strong> plan.
            </p>
          </div>

          {/* Form fields */}
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {!inviteToken && (
              <div className="sm:col-span-2">
                <Input
                  label="Organization Name"
                  type="text"
                  placeholder="e.g. Apex Analytics"
                  error={errors.organization_name?.message}
                  icon={<Building className="w-3.5 h-3.5" />}
                  {...register("organization_name")}
                />
              </div>
            )}

            <Input
              label="First Name"
              type="text"
              placeholder="John"
              error={errors.first_name?.message}
              icon={<UserIcon className="w-3.5 h-3.5" />}
              {...register("first_name")}
            />

            <Input
              label="Last Name"
              type="text"
              placeholder="Doe"
              error={errors.last_name?.message}
              icon={<UserIcon className="w-3.5 h-3.5" />}
              {...register("last_name")}
            />

            <Input
              label="Username"
              type="text"
              placeholder="johndoe"
              error={errors.username?.message}
              icon={<UserIcon className="w-3.5 h-3.5" />}
              {...register("username")}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              icon={<Mail className="w-3.5 h-3.5" />}
              {...register("email")}
            />

            <div className="sm:col-span-2">
              <Select
                label="Professional Role"
                options={ROLE_OPTIONS}
                error={errors.role?.message}
                icon={<Briefcase className="w-3.5 h-3.5" />}
                {...register("role")}
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                helperText="At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special."
                error={errors.password?.message}
                icon={<Key className="w-3.5 h-3.5" />}
                {...register("password")}
              />
            </div>

            <div className="flex gap-2 sm:col-span-2 mt-1.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="w-1/3 font-bold"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-2/3 font-bold"
                isLoading={loading}
              >
                Create Workspace
              </Button>
            </div>
          </form>
        </>
      ) : (
        <>
          {/* Step 3: OTP Verification Code */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20 shrink-0 mb-1">
              <Mail className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Verify Your Email</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We sent a 6-digit verification code to your email. Enter it below to activate your account.
            </p>
          </div>

          {otpError && (
            <Alert variant="destructive">
              {otpError}
            </Alert>
          )}

          <div className="flex flex-col gap-4 mt-2">
            <Input
              label="Verification Code"
              type="text"
              placeholder="e.g. 123456"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/\D/g, ""));
                setOtpError(null);
              }}
              className="text-center font-mono text-lg tracking-[0.5em] focus:tracking-[0.5em]"
            />

            <Button
              onClick={handleVerifyOtp}
              variant="primary"
              className="w-full font-bold py-2.5 flex items-center justify-center"
              isLoading={loading}
              disabled={otpCode.length !== 6}
            >
              Verify & Activate Account
            </Button>

            <div className="flex justify-between items-center text-xs mt-1">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                disabled={loading}
              >
                ← Back to Details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                className="text-primary hover:underline font-semibold cursor-pointer disabled:text-muted-foreground disabled:no-underline"
                disabled={resendCountdown > 0 || loading}
              >
                {resendCountdown > 0 ? `Resend Code in ${resendCountdown}s` : "Resend Code"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Nav Back */}
      {step !== 3 && (
        <div className="text-center text-xs text-muted-foreground mt-1">
          Already have an account?{" "}
          <button
            onClick={onNavigateToLogin}
            className="text-primary hover:underline font-semibold cursor-pointer"
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  );
};
