import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Select, Alert } from "../../components/common/UIComponents";
import { DataTable } from "../../components/common/DataTable";
import type { Column } from "../../components/common/DataTable";
import { useAuth } from "../auth/AuthContext";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  X, 
  Loader2
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface Team {
  id: string;
  organization: string;
  name: string;
  description: string;
  lead: string | null;
  lead_detail: UserProfile | null;
  members: string[];
  members_detail: UserProfile[];
  created_at: string;
}

const teamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  description: z.string().default(""),
  lead: z.string().nullable().or(z.literal("")),
  members: z.array(z.string()).default([]),
});

export const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  
  // States
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManageTeams = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      description: "",
      lead: "",
      members: [] as string[],
    },
  });

  const selectedMembers = watch("members") || [];

  // API Call: List Teams
  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get<any, { data: Team[] }>("/teams/");
      setTeams(res.data);
    } catch (err) {
      console.error("Failed to load teams:", err);
    } finally {
      setLoading(false);
    }
  };

  // API Call: List Org Members
  const fetchMembers = async () => {
    setMembersLoading(true);
    try {
      const res = await api.get<any, { data: UserProfile[] }>("/auth/members/");
      setMembers(res.data);
    } catch (err) {
      console.error("Failed to load organization members:", err);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchMembers();
  }, []);

  const openCreateModal = () => {
    setEditingTeam(null);
    setFormError(null);
    reset({
      name: "",
      description: "",
      lead: "",
      members: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setFormError(null);
    reset({
      name: team.name,
      description: team.description,
      lead: team.lead || "",
      members: team.members || [],
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    setFormError(null);
    setSuccessMessage(null);
    
    // Parse empty lead string as null
    const payload = {
      ...data,
      lead: data.lead === "" ? null : data.lead,
    };

    try {
      if (editingTeam) {
        // Edit API Call
        await api.put(`/teams/${editingTeam.id}/`, payload);
        setSuccessMessage("Team updated successfully.");
      } else {
        // Create API Call
        await api.post("/teams/", payload);
        setSuccessMessage("Team created successfully.");
      }
      setModalOpen(false);
      fetchTeams();
    } catch (err: any) {
      console.error(err);
      if (err.errors) {
        const key = Object.keys(err.errors)[0];
        const val = err.errors[key];
        setFormError(`${key}: ${Array.isArray(val) ? val.join(" ") : val}`);
      } else {
        setFormError(err.message || "Failed to save team details.");
      }
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    setSuccessMessage(null);
    try {
      await api.delete(`/teams/${teamId}/`);
      setSuccessMessage("Team deleted successfully.");
      fetchTeams();
    } catch (err) {
      console.error("Failed to delete team:", err);
    }
  };

  const handleMemberToggle = (memberId: string) => {
    const current = [...selectedMembers];
    const idx = current.indexOf(memberId);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(memberId);
    }
    setValue("members", current);
  };

  // DataTable column mapping
  const columns: Column<Team>[] = [
    {
      key: "name",
      label: "Team Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <span className="font-bold text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      sortable: true,
      render: (row) => (
        <span className="text-muted-foreground line-clamp-1 truncate max-w-xs block">
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "lead",
      label: "Team Lead",
      sortable: true,
      render: (row) => {
        if (!row.lead_detail) return <span className="text-muted-foreground/60">—</span>;
        return (
          <span className="font-semibold text-foreground">
            {row.lead_detail.first_name} {row.lead_detail.last_name} (@{row.lead_detail.username})
          </span>
        );
      },
    },
    {
      key: "members",
      label: "Members",
      sortable: true,
      render: (row) => (
        <Badge variant="secondary">
          {row.members ? row.members.length : 0} members
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        if (!canManageTeams) return <span className="text-muted-foreground/40">—</span>;
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditModal(row)}
              title="Edit Team"
              className="text-muted-foreground hover:text-foreground w-7 h-7 rounded"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteTeam(row.id)}
              title="Delete Team"
              className="text-muted-foreground hover:text-destructive w-7 h-7 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5 select-none text-foreground">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Teams Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize organization workspaces, assign team leads, and manage member directories.
          </p>
        </div>
        {canManageTeams && (
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="text-xs font-bold py-1.5 px-3 self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1" />
            Create Team
          </Button>
        )}
      </div>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin mb-2" />
          <span className="text-xs text-muted-foreground font-semibold">Loading organization teams...</span>
        </div>
      ) : teams.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 py-16 max-w-lg mx-auto gap-4 mt-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <Users className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">No Teams Configured</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Teams group members collaborating on requirement backlogs, sprints, and specifications. Create your first team to begin.
            </p>
          </div>
          {canManageTeams && (
            <Button variant="primary" size="sm" onClick={openCreateModal} className="text-xs font-bold mt-2">
              Create Team Profile
            </Button>
          )}
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={teams}
          searchPlaceholder="Search teams..."
          searchKeys={["name", "description"]}
        />
      )}

      {/* CREATE/EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-8 flex flex-col gap-6 bg-gray-950 border border-white/[0.08] rounded-3xl relative select-none shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-3 text-left">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {editingTeam ? "Edit Team Profile" : "Create Team Profile"}
              </h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Provide details to group workspace members for this organization.
              </p>
            </div>

            {formError && <Alert variant="destructive">{formError}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
              <Input
                label="Team Name"
                placeholder="e.g. Frontend Core Team"
                error={errors.name?.message}
                className="border-white/[0.06] focus:border-purple-500/40 bg-black/40"
                {...register("name")}
              />

              <Input
                label="Description"
                placeholder="Collaborates on UI design systems and layouts..."
                error={errors.description?.message}
                className="border-white/[0.06] focus:border-purple-500/40 bg-black/40"
                {...register("description")}
              />

              {/* Lead Selector */}
              <Select
                label="Team Lead"
                options={[
                  { value: "", label: "No Team Lead" },
                  ...members.map((m) => ({
                    value: m.id,
                    label: `${m.first_name} ${m.last_name} (${m.role.replace("_", " ")})`,
                  })),
                ]}
                error={errors.lead?.message}
                className="border-white/[0.06] focus:border-purple-500/40 bg-black/40"
                {...register("lead")}
              />

              {/* Members Multiselect Checklist */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select Team Members
                </label>
                <div className="max-h-40 overflow-y-auto border border-white/[0.08] bg-black/40 rounded-xl p-3 flex flex-col gap-2">
                  {membersLoading ? (
                    <span className="text-xs text-muted-foreground p-2">Loading workspace members...</span>
                  ) : members.length === 0 ? (
                    <span className="text-xs text-muted-foreground p-2">No other workspace members found.</span>
                  ) : (
                    members.map((m) => {
                      const isChecked = selectedMembers.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/40 text-xs font-semibold cursor-pointer text-foreground border border-transparent hover:border-white/[0.06] transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleMemberToggle(m.id)}
                              className="rounded border-white/[0.2] bg-black/60 text-primary focus:ring-primary/20 cursor-pointer"
                            />
                            <span>{m.first_name} {m.last_name}</span>
                          </div>
                          <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-wider">
                            {m.role.replace("_", " ")}
                          </Badge>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-4 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="text-xs font-bold"
                >
                  Save Team
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
