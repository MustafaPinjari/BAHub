import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useProject } from "../../features/projects/ProjectContext";
import {
  Search,
  X,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  Calendar,
  FolderGit,
  LayoutDashboard,
  ClipboardList,
  Bot,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  path: string;
  icon: React.ReactNode;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Module shortcuts always available
const MODULE_SHORTCUTS: SearchResult[] = [
  { id: "mod-dashboard", title: "Dashboard", subtitle: "Overview & metrics", category: "Modules", path: "/dashboard", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { id: "mod-requirements", title: "Requirements", subtitle: "Manage requirement backlog", category: "Modules", path: "/requirements", icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
  { id: "mod-stories", title: "User Stories", subtitle: "Agile backlog board", category: "Modules", path: "/stories", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { id: "mod-brd", title: "BRD Generator", subtitle: "Business Requirements Documents", category: "Modules", path: "/brd", icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "mod-frd", title: "FRD Generator", subtitle: "Functional Requirements Documents", category: "Modules", path: "/frd", icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "mod-risks", title: "Risks", subtitle: "Risk register & matrix", category: "Modules", path: "/risks", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { id: "mod-meetings", title: "Meetings", subtitle: "Meeting logs & action items", category: "Modules", path: "/meetings", icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: "mod-projects", title: "Projects", subtitle: "All projects & workspaces", category: "Modules", path: "/projects", icon: <FolderGit className="w-3.5 h-3.5" /> },
  { id: "mod-ai", title: "AI Assistant", subtitle: "Context-aware BA chat", category: "Modules", path: "/ai", icon: <Bot className="w-3.5 h-3.5" /> },
  { id: "mod-traceability", title: "Traceability Matrix", subtitle: "Requirements to stories to docs", category: "Modules", path: "/traceability", icon: <ArrowRight className="w-3.5 h-3.5" /> },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Modules": "text-gray-500",
  "Requirements": "text-blue-400",
  "Documents": "text-violet-400",
  "Risks": "text-red-400",
  "Meetings": "text-amber-400",
};

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const buildResults = useCallback(
    async (q: string) => {
      const lower = q.toLowerCase().trim();

      // Filter module shortcuts
      const moduleMatches = MODULE_SHORTCUTS.filter(
        (m) =>
          !lower ||
          m.title.toLowerCase().includes(lower) ||
          m.subtitle?.toLowerCase().includes(lower)
      );

      if (!lower || !activeProject) {
        setResults(moduleMatches);
        setSelectedIndex(0);
        return;
      }

      // Fetch live data from backend
      setLoading(true);
      try {
        const projectParam = `project=${activeProject.id}&search=${encodeURIComponent(q)}`;
        const [reqRes, docRes, riskRes, meetRes] = await Promise.allSettled([
          api.get<any, { data: any[] }>(`/requirements/?${projectParam}`),
          api.get<any, { data: any[] }>(`/documents/?${projectParam}`),
          api.get<any, { data: any[] }>(`/risks/?${projectParam}`),
          api.get<any, { data: any[] }>(`/meetings/?${projectParam}`),
        ]);

        const liveResults: SearchResult[] = [];

        if (reqRes.status === "fulfilled") {
          (Array.isArray(reqRes.value?.data) ? reqRes.value.data : []).slice(0, 5).forEach((r: any) => {
            liveResults.push({
              id: `req-${r.id}`,
              title: r.title || r.name || r.req_id || "Requirement",
              subtitle: r.req_id ? `${r.req_id} · ${activeProject.name}` : activeProject.name,
              category: "Requirements",
              path: "/requirements",
              icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
            });
          });
        }

        if (docRes.status === "fulfilled") {
          (Array.isArray(docRes.value?.data) ? docRes.value.data : []).slice(0, 5).forEach((d: any) => {
            liveResults.push({
              id: `doc-${d.id}`,
              title: d.title || "Document",
              subtitle: `${d.doc_type} · ${d.status} · ${activeProject.name}`,
              category: "Documents",
              path: d.doc_type === "FRD" ? "/frd" : "/brd",
              icon: <FileText className="w-3.5 h-3.5" />,
            });
          });
        }

        if (riskRes.status === "fulfilled") {
          (Array.isArray(riskRes.value?.data) ? riskRes.value.data : []).slice(0, 5).forEach((r: any) => {
            liveResults.push({
              id: `risk-${r.id}`,
              title: r.title || r.description?.slice(0, 50) || "Risk",
              subtitle: `${r.severity || r.impact || "Risk"} · ${activeProject.name}`,
              category: "Risks",
              path: "/risks",
              icon: <ShieldAlert className="w-3.5 h-3.5" />,
            });
          });
        }

        if (meetRes.status === "fulfilled") {
          (Array.isArray(meetRes.value?.data) ? meetRes.value.data : []).slice(0, 4).forEach((m: any) => {
            liveResults.push({
              id: `meet-${m.id}`,
              title: m.title || "Meeting",
              subtitle: `${m.date || ""} · ${activeProject.name}`,
              category: "Meetings",
              path: "/meetings",
              icon: <Calendar className="w-3.5 h-3.5" />,
            });
          });
        }

        setResults([...moduleMatches, ...liveResults]);
      } catch {
        setResults(moduleMatches);
      } finally {
        setLoading(false);
        setSelectedIndex(0);
      }
    },
    [activeProject]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => buildResults(query), 250);
    return () => clearTimeout(timer);
  }, [query, buildResults]);

  // Initial load (show modules)
  useEffect(() => {
    if (isOpen) buildResults("");
  }, [isOpen, buildResults]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    (acc[r.category] as SearchResult[]).push(r);
    return acc;
  }, {});

  let flatIndex = 0;
  const groupedEntries = Object.entries(grouped);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Search"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl mx-4 bg-gray-950 border border-white/[0.10] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-600 shrink-0 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-gray-600 shrink-0" />
          )}
          <input
            ref={inputRef}
            id="global-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeProject ? `Search in ${activeProject.name}…` : "Search modules…"}
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder:text-gray-700 outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-gray-700 hover:text-gray-400 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline text-[9px] font-mono text-gray-700 bg-gray-900 border border-white/[0.06] rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {results.length === 0 && !loading && (
            <div className="py-8 text-center text-gray-700 text-xs font-medium">
              No results found for "{query}"
            </div>
          )}

          {groupedEntries.map(([category, items]) => (
            <div key={category}>
              <div className="px-4 pt-3 pb-1.5">
                <span className={`text-[9px] font-black uppercase tracking-widest ${CATEGORY_COLORS[category] || "text-gray-600"}`}>
                  {category}
                </span>
              </div>
              {items.map((result) => {
                const isSelected = flatIndex++ === selectedIndex;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-white/[0.06] text-white"
                        : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isSelected ? "bg-white/[0.08]" : "bg-white/[0.03]"}`}>
                      {result.icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-semibold truncate">{result.title}</span>
                      {result.subtitle && (
                        <span className="text-[10px] text-gray-600 font-medium truncate">{result.subtitle}</span>
                      )}
                    </div>
                    {isSelected && (
                      <ArrowRight className="w-3 h-3 ml-auto shrink-0 text-gray-600" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/[0.05] flex items-center gap-4 text-[9px] text-gray-700 font-semibold">
          <span><kbd className="font-mono">↑↓</kbd> Navigate</span>
          <span><kbd className="font-mono">↵</kbd> Select</span>
          <span><kbd className="font-mono">ESC</kbd> Close</span>
          {!activeProject && (
            <span className="ml-auto text-amber-700">Select a project to search content</span>
          )}
        </div>
      </div>
    </div>
  );
};
