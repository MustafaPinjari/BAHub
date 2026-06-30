import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../AuthContext";
import { Input, Button, Alert } from "../../../components/common/UIComponents";
import { Shield, Lock, User as UserIcon } from "lucide-react";

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
    <div className="w-full max-w-md p-8 glass rounded-2xl shadow-xl border border-white/10 flex flex-col gap-6">
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">
          Enter credentials to access the BAHub workspace.
        </p>
      </div>

      {formError && (
        <Alert variant="destructive" title="Login Failed">
          {formError}
        </Alert>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="relative">
          <Input
            label="Username"
            type="text"
            placeholder="username"
            error={errors.username?.message}
            className="pl-9"
            {...register("username")}
          />
          <UserIcon className="w-4 h-4 text-muted-foreground/60 absolute left-3 top-[34px]" />
        </div>

        <div className="relative">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            className="pl-9"
            {...register("password")}
          />
          <Lock className="w-4 h-4 text-muted-foreground/60 absolute left-3 top-[34px]" />
        </div>

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
          Sign In
        </Button>
      </form>

      {/* Footer Nav */}
      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          onClick={onNavigateToRegister}
          className="text-primary hover:underline font-semibold cursor-pointer"
        >
          Create organization workspace
        </button>
      </div>
    </div>
  );
};
