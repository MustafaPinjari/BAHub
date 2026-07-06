import React, { useState, useEffect } from "react";
import { DiagramDashboard } from "./DiagramDashboard.tsx";
import { DiagramCanvas } from "./DiagramCanvas.tsx";
import { useProject } from "../projects/ProjectContext";

// Route view switcher for dashboard and canvas workspace

export const DiagramsPage: React.FC = () => {
  const { activeProject } = useProject();

  const [view, setView] = useState<"dashboard" | "editor">("dashboard");
  const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null);

  // Reset editor when active project changes.
  useEffect(() => {
    setView("dashboard");
    setSelectedDiagramId(null);
  }, [activeProject?.id]);


  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-card border border-border rounded-2xl backdrop-blur-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20 animate-pulse">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">No Active Project Selected</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          Please select or activate a project from the top navbar workspace dropdown to view and create diagram models.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[calc(100vh-8rem)] flex flex-col">
      {view === "dashboard" ? (
        <DiagramDashboard
          projectId={activeProject.id}
          projectName={activeProject.name}
          onSelectDiagram={(id) => {
            setSelectedDiagramId(id);
            setView("editor");
          }}
          onCreateDiagram={() => {
            setSelectedDiagramId(null); // Indicates a new diagram
            setView("editor");
          }}
        />
      ) : (
        <DiagramCanvas
          projectId={activeProject.id}
          diagramId={selectedDiagramId}
          onBackToDashboard={() => setView("dashboard")}
        />
      )}
    </div>
  );
};
