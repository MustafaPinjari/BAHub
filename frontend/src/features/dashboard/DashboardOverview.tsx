import React from "react";
import { Card, Badge } from "../../components/common/UIComponents";
import { DataTable } from "../../components/common/DataTable";
import type { Column } from "../../components/common/DataTable";
import { DocumentEditor } from "./components/DocumentEditor";
import {
  Clock,
  FolderGit,
  ChevronsUpDown,
  Paperclip
} from "lucide-react";

interface RequirementBacklog {
  id: string;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  status: "Draft" | "Review" | "Approved";
}

export const DashboardOverview: React.FC = () => {

  // Mock data for the spreadsheet requirement backlog table
  const backlogData: RequirementBacklog[] = [
    {
      id: "REQ-101",
      title: "PCI-DSS compliance token storage rules",
      category: "Security",
      priority: "High",
      status: "Approved",
    },
    {
      id: "REQ-102",
      title: "Support checkout fallback routing",
      category: "Functional",
      priority: "Medium",
      status: "Review",
    },
    {
      id: "REQ-103",
      title: "Real-time webhook notification dispatcher",
      category: "Integration",
      priority: "High",
      status: "Draft",
    },
    {
      id: "REQ-104",
      title: "Store user transaction metadata index",
      category: "Database",
      priority: "Low",
      status: "Approved",
    },
  ];

  const columns: Column<RequirementBacklog>[] = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      render: (row) => <span className="font-bold text-primary">{row.id}</span>,
    },
    {
      key: "title",
      label: "Requirement Title",
      sortable: true,
      render: (row) => <span className="font-semibold text-foreground">{row.title}</span>,
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (row) => {
        const variant = row.priority === "High" ? "destructive" : row.priority === "Medium" ? "warning" : "secondary";
        return <Badge variant={variant}>{row.priority}</Badge>;
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => {
        const variant = row.status === "Approved" ? "success" : row.status === "Review" ? "warning" : "default";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 select-none text-foreground">
      {/* ==========================================
          TOP LAYER: CURRENT CONTEXT BAR
          ========================================== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 px-4 bg-card rounded-xl border border-border gap-4 select-none">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <FolderGit className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-foreground">Apex Payment Gateway Integration</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/60 cursor-pointer" />
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold">
              Current Context • Requirements Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto text-xs font-semibold">
          <div className="flex items-center gap-1 bg-secondary border border-border px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Sprint 3</span>
          </div>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-muted-foreground">
            Author: <span className="text-foreground font-bold">David Miller</span>
          </span>
        </div>
      </div>

      {/* ==========================================
          THREE-COLUMN/LAYER GRID SYSTEM
          ========================================== */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side: Primary Work Area (75% width) */}
        <div className="w-full lg:w-[75%] flex flex-col gap-6">
          
          {/* Notion-Style Split View Workspace */}
          <div className="flex flex-col gap-2">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Document Workspace
            </h2>
            <DocumentEditor />
          </div>

          {/* Spreadsheet-Style Backlog Table */}
          <div className="flex flex-col gap-2.5">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Requirements Backlog Spreadsheet
            </h2>
            <DataTable
              columns={columns}
              data={backlogData}
              searchPlaceholder="Filter requirements..."
              searchKeys={["id", "title", "category"]}
            />
          </div>
        </div>

        {/* Right Side: Context Panel (25% width) */}
        <div className="w-full lg:w-[25%] lg:sticky lg:top-5 flex flex-col gap-5 select-none">
          
          {/* Context Layer 1: Approval Actions */}
          <Card className="flex flex-col gap-4 p-4.5">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
              Approvals Pipeline
            </h3>
            <div className="flex flex-col gap-3">
              {[
                {
                  id: "BRD-102",
                  title: "Gateway Specifications",
                  status: "Pending Sign-off",
                },
                {
                  id: "FRD-201",
                  title: "Checkout Flow Schema",
                  status: "Pending Review",
                },
              ].map((item) => (
                <div key={item.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground truncate">{item.title}</span>
                    <Badge variant="warning" className="text-[9px] font-bold shrink-0">{item.status}</Badge>
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase">{item.id}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Context Layer 2: Attachments / References */}
          <Card className="flex flex-col gap-4 p-4.5">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
              Related Documents
            </h3>
            <div className="flex flex-col gap-2.5 text-xs font-semibold">
              {[
                { name: "Checkout_Mockups_v2.pdf", size: "4.2 MB" },
                { name: "Payment_API_Specs.docx", size: "1.8 MB" },
              ].map((file) => (
                <div key={file.name} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-secondary/60 cursor-pointer">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground truncate">{file.name}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0">{file.size}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Context Layer 3: Activity Log & History */}
          <Card className="flex flex-col gap-4 p-4.5">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
              Workspace Activity
            </h3>
            <div className="flex flex-col gap-3.5">
              {[
                {
                  user: "David Miller",
                  action: "modified requirement REQ-102",
                  time: "3m ago",
                },
                {
                  user: "Admin",
                  action: "uploaded Payment_API_Specs.docx",
                  time: "15m ago",
                },
              ].map((act, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-[11px] leading-normal">
                  <div className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 text-[9px] font-bold text-muted-foreground">
                    {act.user.charAt(0)}
                  </div>
                  <div className="flex flex-col text-left">
                    <p className="text-foreground">
                      <span className="font-bold">{act.user}</span> {act.action}
                    </p>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
