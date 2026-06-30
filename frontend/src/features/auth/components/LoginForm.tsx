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
        <div className="relative">
          <Input
            label="Username"
            type="text"
            placeholder="e.g. analyst"
            error={errors.username?.message}
            className="pl-8.5"
            {...register("username")}
          />
          <UserIcon className="w-3.5 h-3.5 text-muted-foreground/60 absolute left-3 top-[32.5px]" />
        </div>

        <div className="relative">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            className="pl-8.5"
            {...register("password")}
          />
          <Lock className="w-3.5 h-3.5 text-muted-foreground/60 absolute left-3 top-[32.5px]" />
        </div>

        <Button type="submit" variant="primary" className="w-full mt-1.5 font-bold" isLoading={loading}>
          Sign In
        </Button>
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
