import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "./AuthContext";
import { api } from "../../services/api";
import { Input, Textarea, Select, Button, Alert, Card, Badge } from "../../components/common/UIComponents";
import type { UserSession } from "../../types/auth";
import { Monitor } from "lucide-react";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  preferences: z.object({
    theme: z.enum(["light", "dark", "system"]),
    accent_color: z.string(),
    language: z.string(),
    timezone: z.string(),
    date_format: z.string(),
    time_format: z.enum(["12h", "24h"]),
  }),
});

type ProfileSchemaType = z.infer<typeof profileSchema>;

const THEME_OPTIONS = [
  { value: "light", label: "Light Mode" },
  { value: "dark", label: "Dark Mode" },
  { value: "system", label: "System Default" },
];

const ACCENT_OPTIONS = [
  { value: "indigo", label: "Indigo Accent" },
  { value: "violet", label: "Violet Accent" },
  { value: "blue", label: "Blue Accent" },
  { value: "emerald", label: "Emerald Accent" },
  { value: "amber", label: "Amber Accent" },
];

const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
];

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "sessions">("profile");
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileSchemaType>({
    resolver: zodResolver(profileSchema),
  });

  // Populate form defaults when user loads
  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || "",
        bio: user.bio || "",
        preferences: {
          theme: user.preferences?.theme || "system",
          accent_color: user.preferences?.accent_color || "indigo",
          language: user.preferences?.language || "en",
          timezone: user.preferences?.timezone || "UTC",
          date_format: user.preferences?.date_format || "YYYY-MM-DD",
          time_format: user.preferences?.time_format || "24h",
        },
      });
    }
  }, [user, reset]);

  // Fetch active sessions
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await api.get<any, { data: UserSession[] }>("/auth/sessions/");
      setSessions(response.data);
    } catch (e: any) {
      console.error("Failed to load user sessions:", e);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessions();
    }
  }, [activeTab]);

  const handleProfileSave = async (data: ProfileSchemaType) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setSaving(true);
    try {
      await updateProfile(data);
      setSuccessMsg("Your profile and preferences were updated successfully!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSessions = async () => {
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await api.post("/auth/sessions/logout-all/");
      setSuccessMsg("Logged out from all other devices successfully.");
      fetchSessions();
    } catch (err: any) {
      setErrorMsg("Failed to revoke active login sessions.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Account & Workspace Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your personal account profile, UI preferences, and browser sessions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border select-none">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-5 py-2.5 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`px-5 py-2.5 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "preferences"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Theme & Display
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-5 py-2.5 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "sessions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Security & Sessions
        </button>
      </div>

      {successMsg && (
        <Alert variant="success" title="Success">
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="destructive" title="Error">
          {errorMsg}
        </Alert>
      )}

      {/* Profile Details Tab */}
      {activeTab === "profile" && (
        <Card className="flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-border pb-4">
            <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/20 text-primary flex items-center justify-center text-xl font-bold">
              {user?.first_name?.charAt(0)}
              {user?.last_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Username: @{user?.username} | Role: {user?.role?.replace("_", " ")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleProfileSave)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="John"
                error={errors.first_name?.message}
                {...register("first_name")}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                error={errors.last_name?.message}
                {...register("last_name")}
              />
              <Input
                label="Workspace Email Address"
                value={user?.email || ""}
                disabled
                helperText="Email address cannot be changed."
              />
              <Input
                label="Phone Number"
                placeholder="+1 234 567 890"
                error={errors.phone?.message}
                {...register("phone")}
              />
            </div>

            <Textarea
              label="Biography"
              placeholder="Tell us about your professional background as a Business Analyst..."
              error={errors.bio?.message}
              {...register("bio")}
            />

            <Button type="submit" variant="primary" className="self-end" isLoading={saving}>
              Save Profile
            </Button>
          </form>
        </Card>
      )}

      {/* Theme & Display Tab */}
      {activeTab === "preferences" && (
        <Card>
          <form onSubmit={handleSubmit(handleProfileSave)} className="flex flex-col gap-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-lg font-bold text-foreground">Interface Customization</h2>
              <p className="text-xs text-muted-foreground">
                Tailor themes, accent shades, languages, and time layouts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Visual Theme"
                options={THEME_OPTIONS}
                error={errors.preferences?.theme?.message}
                {...register("preferences.theme")}
              />
              <Select
                label="Accent Color"
                options={ACCENT_OPTIONS}
                error={errors.preferences?.accent_color?.message}
                {...register("preferences.accent_color")}
              />
              <Select
                label="Preferred Language"
                options={LANG_OPTIONS}
                error={errors.preferences?.language?.message}
                {...register("preferences.language")}
              />
              <Input
                label="Display Date Format"
                placeholder="YYYY-MM-DD"
                error={errors.preferences?.date_format?.message}
                {...register("preferences.date_format")}
              />
              <Input
                label="Workspace Timezone"
                placeholder="UTC"
                error={errors.preferences?.timezone?.message}
                {...register("preferences.timezone")}
              />
              <Select
                label="Time Layout"
                options={[
                  { value: "12h", label: "12 Hour (AM/PM)" },
                  { value: "24h", label: "24 Hour" },
                ]}
                error={errors.preferences?.time_format?.message}
                {...register("preferences.time_format")}
              />
            </div>

            <Button type="submit" variant="primary" className="self-end" isLoading={saving}>
              Apply Layout Preferences
            </Button>
          </form>
        </Card>
      )}

      {/* Security & Sessions Tab */}
      {activeTab === "sessions" && (
        <Card className="flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Active Browser Sessions</h2>
              <p className="text-xs text-muted-foreground">
                You are currently logged into these browsers. Revoke sessions to sign out of other devices.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleRevokeSessions}>
              Revoke All Other Sessions
            </Button>
          </div>

          {sessionsLoading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Loading active sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No active sessions found.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {sess.browser || "Unknown Browser"} on {sess.device || "Desktop"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        IP: {sess.ip_address || "Localhost"} | Last active:{" "}
                        {new Date(sess.last_activity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sess.is_active ? (
                      <Badge variant="success">Current</Badge>
                    ) : (
                      <Badge variant="secondary">Expired</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
