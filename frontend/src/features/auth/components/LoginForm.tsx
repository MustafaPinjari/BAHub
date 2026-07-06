import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../AuthContext";
import { Input, Button, Alert } from "../../../components/common/UIComponents";
import { Building, Lock, User as UserIcon } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: () => void;
  onNavigateToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onNavigateToRegister }) => {
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ssoEnabled = import.meta.env.VITE_ENABLE_SAML_SSO === "true";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setFormError(null);
    setLoading(true);
    try {
      await login(data.username, data.password);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[320px] flex flex-col gap-5 select-none bg-background">
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20 shrink-0 mb-1">
          <Building className="w-4 h-4" />
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Sign in to BAHub</h1>
        <p className="text-xs text-muted-foreground">
          Enter credentials to access your organization workspace.
        </p>
      </div>

      {formError && (
        <Alert variant="destructive">
          {formError}
        </Alert>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <Input
          label="Username"
          type="text"
          placeholder="e.g. analyst"
          error={errors.username?.message}
          icon={<UserIcon className="w-3.5 h-3.5" />}
          {...register("username")}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          icon={<Lock className="w-3.5 h-3.5" />}
          {...register("password")}
        />

        <Button type="submit" variant="primary" className="w-full mt-1.5 font-bold" isLoading={loading}>
          Sign In
        </Button>

        <div className="flex items-center my-1.5">
          <div className="flex-grow border-t border-border"></div>
          <span className="px-2 text-[9px] text-muted-foreground uppercase font-bold tracking-wider">or</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        {ssoEnabled ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const apiBase = (import.meta.env.VITE_API_URL as string) || (import.meta.env.PROD || window.location.hostname.endsWith("netlify.app") ? "https://bahub-backend.onrender.com/api/v1" : "http://127.0.0.1:8000/api/v1");
              window.location.href = apiBase.replace("/api/v1", "/saml2_auth/login/");
            }}
            className="w-full font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50/20"
          >
            Sign in with SAML SSO
          </Button>
        ) : (
          <p className="text-[10px] text-muted-foreground text-center font-semibold leading-relaxed">
            Enterprise SSO is available for configured workspaces.
          </p>
        )}
      </form>

      {/* Footer Nav */}
      <div className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          onClick={onNavigateToRegister}
          className="text-primary hover:underline font-semibold cursor-pointer"
        >
          Register workspace
        </button>
      </div>
    </div>
  );
};
