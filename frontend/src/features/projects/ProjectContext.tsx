import React, { createContext, useContext, useState } from "react";

export interface Project {
  id: string;
  name: string;
  description?: string;
  organization?: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
}

interface ProjectContextType {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProject, setActiveProjectState] = useState<Project | null>(() => {
    try {
      const stored = localStorage.getItem("active_project");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project);
    if (project) {
      localStorage.setItem("active_project", JSON.stringify(project));
    } else {
      localStorage.removeItem("active_project");
    }
    // Maintain backwards compatibility with legacy window events
    window.dispatchEvent(new Event("activeProjectChanged"));
  };

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
