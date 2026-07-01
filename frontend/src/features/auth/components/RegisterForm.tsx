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
    <div className="w-full max-w-[380px] flex flex-col gap-5 select-none bg-background">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20 shrink-0 mb-1">
          <Building className="w-4 h-4" />
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Create BAHub Workspace</h1>
        <p className="text-xs text-muted-foreground">
          Register your profile and workspace organization workspace.
        </p>
      </div>

      {formError && (
        <Alert variant="destructive">
          {formError}
        </Alert>
      )}

      {/* Form fields */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

        <Button type="submit" variant="primary" className="sm:col-span-2 w-full mt-1.5 font-bold" isLoading={loading}>
          Create Workspace
        </Button>
      </form>

      {/* Nav Back */}
      <div className="text-center text-xs text-muted-foreground">
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
