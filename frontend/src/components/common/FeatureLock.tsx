import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, Button } from "./UIComponents";

interface FeatureLockProps {
  requiredTier: "PRO" | "ENTERPRISE";
  featureName: string;
  featureDescription: string;
}

export const FeatureLock: React.FC<FeatureLockProps> = ({
  requiredTier,
  featureName,
  featureDescription,
}) => {
  const navigate = useNavigate();

  const isPro = requiredTier === "PRO";

  const benefits = isPro
    ? [
        "Up to 20 Workspace seats for your core team",
        "1,000 monthly AI credits for requirement compiles",
        "Full BRD and FRD auto-specification document builders",
        "Advanced SWOT/Gap strategic analysis models",
      ]
    : [
        "Up to 1,000 Workspace seats for massive teams",
        "10,000 monthly AI credits for scale workload",
        "SSO authentication and custom security groups",
        "Official compliance-ready database Audit Trails & Integrations",
      ];

  return (
    <div className="w-full flex items-center justify-center p-4 md:p-8 select-none">
      <Card className="w-full max-w-lg border border-border/80 bg-card/60 backdrop-blur-md shadow-xl text-center p-6 md:p-8 relative overflow-hidden flex flex-col items-center gap-6">
        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-20%] w-[200px] h-[200px] rounded-full bg-primary/5 blur-[50px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[200px] h-[200px] rounded-full bg-primary/5 blur-[50px] pointer-events-none" />

        {/* Lock Icon */}
        <div className="w-16 h-16 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center text-primary shrink-0 relative animate-pulse shadow-inner shadow-primary/5">
          <Shield className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[9px] text-white font-extrabold shadow">
            !
          </div>
        </div>

        {/* Text Details */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-1.5">
            Unlock {featureName} <Sparkles className="w-4 h-4 text-primary fill-primary" />
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-medium">
            {featureDescription} Access to this feature requires a <strong>{requiredTier} Tier</strong> subscription plan.
          </p>
        </div>

        {/* Benefits Checklist */}
        <div className="w-full bg-secondary/50 rounded-xl p-4 border border-border/40 text-left flex flex-col gap-2.5">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Included in {requiredTier} Tier:
          </span>
          <div className="flex flex-col gap-2">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => navigate("/billing")}
          variant="primary"
          className="w-full py-2.5 font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
        >
          Upgrade Subscription <ArrowRight className="w-4 h-4" />
        </Button>
      </Card>
    </div>
  );
};
