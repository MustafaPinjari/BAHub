import React, { useState } from "react";
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
    .regex(/[!@#$%^&*(),.?":{}|<>[\]\\_\-+=~`/;']/, "Must contain at least one special character"),
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
  const { register: registerApi } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
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
      await registerApi(data);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.errors) {
        // Concatenate validation errors
        const key = Object.keys(err.errors)[0];
        const val = err.errors[key];
        setFormError(`${key}: ${Array.isArray(val) ? val.join(" ") : val}`);
      } else {
        setFormError(err.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg p-8 glass rounded-2xl shadow-xl border border-white/10 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
          <Building className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Create Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Register your user profile and workspace organization.
        </p>
      </div>

      {formError && (
        <Alert variant="destructive" title="Registration Failed">
          {formError}
        </Alert>
      )}

      {/* Form fields */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative md:col-span-2">
          <Input
            label="Organization Workspace Name"
            type="text"
            placeholder="e.g. Acme Corp"
            helperText="We will group your projects under this organization."
            error={errors.organization_name?.message}
            className="pl-9"
            {...register("organization_name")}
          />
          <Building className="w-4 h-4 text-muted-foreground/60 absolute left-3 top-[34px]" />
        </div>

        <div className="relative">
          <Input
            label="First Name"
            type="text"
            placeholder="John"
            error={errors.first_name?.message}
            className="pl-9"
            {...register("first_name")}
          />
          <UserIcon className="w-4 h-4 text-muted-foreground/60 absolute left-3 top-[34px]" />
        </div>

        <div className="relative">
          <Input
            label="Last Name"
            type="text"
            placeholder="Doe"
            error={errors.last_name?.message}
            className="pl-9"
            {...register("last_name")}
          />
          <UserIcon className="w-4 h-4 text-muted-foreground/60 absolute left-3 top-[34px]" />
        </div>

        <div className="relative">
          <Input
            label="Username"
            type="text"
            placeholder="johndoe"
            error={errors.username?.message}
            className="pl-9"
            {...register("username")}
          />
          <UserIcon className="w-4 h-4 text-muted-foreground/60 absolute left-3 top-[34px]" />
        </div>

        <div className="relative">
          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            error={errors.email?.message}
            className="pl-9"
            {...register("email")}
          />
          <Mail className="w-4 h-4 text-muted-foreground/60 absolute left-3 top-[34px]" />
        </div>

        <div className="relative md:col-span-2">
          <Select
            label="Your Professional Role"
            options={ROLE_OPTIONS}
            error={errors.role?.message}
            className="pl-9"
            {...register("role")}
          />
          <Briefcase className="w-4 h-4 text-muted-foreground/60 absolute left-3 top-[34px]" />
        </div>

        <div className="relative md:col-span-2">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            helperText="Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character."
            error={errors.password?.message}
            className="pl-9"
            {...register("password")}
          />
          <Key className="w-4 h-4 text-muted-foreground/60 absolute left-3 top-[34px]" />
        </div>

        <Button type="submit" variant="primary" className="md:col-span-2 w-full mt-2" isLoading={loading}>
          Create Organization Workspace
        </Button>
      </form>

      {/* Nav Back */}
      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          onClick={onNavigateToLogin}
          className="text-primary hover:underline font-semibold cursor-pointer"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
