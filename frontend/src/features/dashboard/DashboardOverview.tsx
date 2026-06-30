import React from "react";
import { Card, Badge, Button } from "../../components/common/UIComponents";
import { useAuth } from "../auth/AuthContext";
import {
  FileSpreadsheet,
  AlertTriangle,
  Calendar,
  FolderGit,
  Clock,
  ArrowRight
} from "lucide-react";

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();

  // Mock workspace statistics
  const kpis = [
    {
      title: "Active Projects",
      value: "4",
      change: "+1 this month",
      icon: FolderGit,
      color: "text-indigo-500 bg-indigo-500/10",
    },
    {
      title: "Total Requirements",
      value: "84",
      change: "12 pending review",
      icon: FileSpreadsheet,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      title: "Open Risks",
      value: "3",
      change: "1 high probability",
      icon: AlertTriangle,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      title: "Meetings Scheduled",
      value: "2",
      change: "Next at 3:00 PM",
      icon: Calendar,
      color: "text-blue-500 bg-blue-500/10",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl glass border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Hello, {user?.first_name || "Analyst"}!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome to your **{user?.organization_name || "BAHub"}** business workspace. Here is a snapshot of your projects.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-primary/20 self-start md:self-auto">
          <Clock className="w-4 h-4 animate-pulse" />
          Active Sprint: SP-03
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {kpi.title}
                </span>
                <span className="text-2xl font-extrabold text-foreground">{kpi.value}</span>
                <span className="text-xs text-muted-foreground">{kpi.change}</span>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-border ${kpi.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Aggregations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <Card className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <h2 className="text-base font-bold text-foreground">Pending Approvals</h2>
            <Button variant="ghost" size="sm" className="text-xs">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {[
              {
                id: "REQ-203",
                title: "Business Requirements Document (BRD) - Version 1.2",
                proj: "Payment Gateway Integration",
                status: "Pending PO Sign-off",
                date: "Today",
              },
              {
                id: "REQ-209",
                title: "User Authentication Flow Specification",
                proj: "SaaS Identity Redesign",
                status: "Pending Admin Approval",
                date: "Yesterday",
              },
            ].map((item) => (
              <div
                key={item.id}
                className="p-3 border border-border rounded-xl hover:bg-muted/30 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1 overflow-hidden">
                  <span className="font-semibold text-sm text-foreground truncate">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-bold text-primary">{item.id}</span>
                    <span>•</span>
                    <span className="truncate">{item.proj}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="warning">{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Items / Tasks */}
        <Card className="flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <h2 className="text-base font-bold text-foreground">Action Items</h2>
            <Button variant="ghost" size="sm" className="text-xs">
              Add Task
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {[
              {
                task: "Conduct stakeholder workshop",
                due: "Jul 02",
                done: false,
              },
              {
                task: "Map non-functional requirements",
                due: "Jul 05",
                done: false,
              },
              {
                task: "Review SWOT reports",
                due: "Jul 08",
                done: true,
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 justify-between p-2 rounded-lg hover:bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={item.done}
                    readOnly
                    className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <span
                    className={`text-sm text-foreground ${
                      item.done ? "line-through text-muted-foreground opacity-60" : "font-medium"
                    }`}
                  >
                    {item.task}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-semibold">{item.due}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom section: Recent Activity log */}
      <Card className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Recent Activity log</h2>
        </div>
        <div className="flex flex-col gap-4">
          {[
            {
              user: "You",
              action: "updated visual preferences",
              target: "Account Dashboard",
              time: "Just now",
            },
            {
              user: "System",
              action: "provisioned workspace",
              target: user?.organization_name || "Organization",
              time: "10 minutes ago",
            },
          ].map((act, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5 border border-primary/20 text-xs font-bold">
                {act.user === "You" ? "U" : "S"}
              </div>
              <div className="flex flex-col">
                <p className="text-foreground">
                  <span className="font-semibold">{act.user}</span> {act.action}{" "}
                  <span className="font-semibold text-primary">{act.target}</span>
                </p>
                <span className="text-xs text-muted-foreground mt-0.5">{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
