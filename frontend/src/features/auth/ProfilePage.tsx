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
  { value: "indigo", label: "Indigo" },
  { value: "violet", label: "Violet" },
  { value: "blue", label: "Blue" },
  { value: "emerald", label: "Emerald" },
  { value: "amber", label: "Amber" },
];

const LANG_OPTIONS = [
  { value: "en", label: "English (US)" },
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

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await api.get<any, { data: UserSession[] }>("/auth/sessions/");
      setSessions(response.data);
    } catch (e: any) {
      console.error(e);
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
      setSuccessMsg("Settings updated successfully.");
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
      setSuccessMsg("Logged out from other browser sessions.");
      fetchSessions();
    } catch (err: any) {
      setErrorMsg("Failed to revoke active login sessions.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5 select-none">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure user identity options, visual configurations, and session management.
        </p>
      </div>

      {/* Underline Tabs */}
      <div className="flex border-b border-border text-xs font-semibold gap-1 select-none">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "profile"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "preferences"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Theme & Display
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "sessions"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Sessions
        </button>
      </div>

      {successMsg && <Alert variant="success">{successMsg}</Alert>}
      {errorMsg && <Alert variant="destructive">{errorMsg}</Alert>}

      {/* Tab content cards */}
      {activeTab === "profile" && (
        <Card className="flex flex-col gap-5 p-5">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-full bg-secondary border border-border text-muted-foreground flex items-center justify-center text-xs font-bold uppercase">
              {user?.first_name?.charAt(0)}
              {user?.last_name?.charAt(0)}
            </div>
            <div className="flex flex-col">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {user?.first_name} {user?.last_name}
              </h2>
              <span className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">
                Username: @{user?.username} | Role: {user?.role?.replace("_", " ")}
              </span>
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
                helperText="Workspace emails are managed by workspace admins."
              />
              <Input
                label="Phone Number"
                placeholder="+1 234 567 890"
                error={errors.phone?.message}
                {...register("phone")}
              />
            </div>

            <Textarea
              label="Bio / Notes"
              placeholder="Conducting business analysis tasks..."
              error={errors.bio?.message}
              {...register("bio")}
            />

            <Button type="submit" variant="primary" className="self-end font-bold" isLoading={saving}>
              Save Profile
            </Button>
          </form>
        </Card>
      )}

      {activeTab === "preferences" && (
        <Card className="p-5">
          <form onSubmit={handleSubmit(handleProfileSave)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Theme Mode"
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
                label="Language"
                options={LANG_OPTIONS}
                error={errors.preferences?.language?.message}
                {...register("preferences.language")}
              />
              <Input
                label="Date Format"
                placeholder="YYYY-MM-DD"
                error={errors.preferences?.date_format?.message}
                {...register("preferences.date_format")}
              />
              <Input
                label="Timezone"
                placeholder="UTC"
                error={errors.preferences?.timezone?.message}
                {...register("preferences.timezone")}
              />
              <Select
                label="Time Format"
                options={[
                  { value: "12h", label: "12 Hour (AM/PM)" },
                  { value: "24h", label: "24 Hour" },
                ]}
                error={errors.preferences?.time_format?.message}
                {...register("preferences.time_format")}
              />
            </div>

            <Button type="submit" variant="primary" className="self-end font-bold" isLoading={saving}>
              Apply Settings
            </Button>
          </form>
        </Card>
      )}

      {activeTab === "sessions" && (
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div>
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Logged Sessions
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Active browsers currently linked to this user credentials.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeSessions}
              className="text-xs font-bold px-3 py-1"
            >
              Sign out other devices
            </Button>
          </div>

          {sessionsLoading ? (
            <div className="text-center py-6 text-xs text-muted-foreground">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">No active sessions found.</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground shrink-0">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <p className="font-semibold text-xs text-foreground leading-tight">
                        {sess.browser || "Browser"} on {sess.device || "Desktop"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                        IP: {sess.ip_address || "Localhost"} | Active:{" "}
                        {new Date(sess.last_activity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {sess.is_active ? (
                      <Badge variant="success" className="text-[9px] font-bold">Current</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] font-bold">Inactive</Badge>
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
