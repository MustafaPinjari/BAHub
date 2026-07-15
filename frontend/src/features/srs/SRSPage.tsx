import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, FileText, Clock, Users, Star, Download, Trash2, Copy, X } from "lucide-react";
import { api } from "../../services/api";
import { SRSEditor } from "./SRSEditor";

interface SRSDocument {
  id: string;
  title: string;
  description: string;
  project_name?: string;
  status: string;
  template_type: string;
  version: string;
  is_ai_generated: boolean;
  created_by_username: string;
  section_count: number;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
}

export const SRSPage: React.FC = () => {
  const [documents, setDocuments] = useState<SRSDocument[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response: any = await api.get("/srs/documents/");
      setDocuments(response.data || []);
    } catch (error) {
      console.error("Failed to fetch SRS documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      console.log("Fetching projects...");
      const response = await api.get("/projects/");
      console.log("Projects response:", response.data);
      
      // Handle both response structures: direct array or wrapped in data property
      const projectsData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      console.log("Projects data:", projectsData);
      
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0].id);
        console.log("Selected project:", projectsData[0].id);
      } else {
        console.log("No projects found");
      }
    } catch (error: any) {
      console.error("Failed to fetch projects:", error);
      console.error("Error details:", error.response?.data);
    }
  };

  const handleCreateIEEETemplate = async () => {
    if (!selectedProject) {
      alert("Please select a project");
      return;
    }

    setCreating(true);
    try {
      const response = await api.post("/srs/documents/create_ieee_template/", {
        project_id: selectedProject,
        title: documentTitle || "IEEE 830 Software Requirements Specification",
        description: "Standard IEEE 830 SRS template"
      });

      if (response.data) {
        setShowNewModal(false);
        setDocumentTitle("");
        fetchDocuments();
        // Automatically open the newly created document in the editor
        if (response.data && response.data.id) {
          setEditingDocument(response.data.id);
        }
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to create IEEE template");
    } finally {
      setCreating(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      case "REVIEW": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "APPROVED": return "text-green-400 bg-green-500/10 border-green-500/20";
      case "ARCHIVED": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {editingDocument ? (
        <SRSEditor 
          documentId={editingDocument} 
          onClose={() => {
            setEditingDocument(null);
            fetchDocuments();
          }} 
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">SRS Documents</h1>
              <p className="text-sm text-gray-500 mt-1">IEEE 830 Software Requirements Specifications</p>
            </div>
            <button
              onClick={() => {
                console.log("New SRS button clicked");
                setShowNewModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New SRS
            </button>
          </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900/60 border border-white/[0.06] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-900/60 border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{documents.length}</p>
              <p className="text-xs text-gray-500">Total Documents</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{documents.filter(d => d.status === "DRAFT").length}</p>
              <p className="text-xs text-gray-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{documents.filter(d => d.status === "APPROVED").length}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{documents.filter(d => d.is_ai_generated).length}</p>
              <p className="text-xs text-gray-500">AI Generated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/[0.06] rounded-xl">
          <FileText className="w-12 h-12 text-gray-600 mb-4" />
          <p className="text-white font-medium mb-2">No SRS documents yet</p>
          <p className="text-sm text-gray-500 mb-4">Create your first IEEE 830 specification</p>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create SRS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setEditingDocument(doc.id)}
              className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-purple-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle copy
                    }}
                    className="p-1.5 hover:bg-white/[0.05] rounded-lg text-gray-500 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle download
                    }}
                    className="p-1.5 hover:bg-white/[0.05] rounded-lg text-gray-500 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle delete
                    }}
                    className="p-1.5 hover:bg-white/[0.05] rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-white mb-1 truncate">{doc.title}</h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{doc.description || "No description"}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusColor(doc.status)}`}>
                  {doc.status}
                </span>
                <span className="text-xs text-gray-600">v{doc.version}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                <span className="text-xs text-gray-500">{doc.section_count} sections</span>
                <span className="text-xs text-gray-600">{doc.created_by_username}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New SRS Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-gray-950 border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New SRS</h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 hover:bg-white/[0.05] rounded-lg text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Project</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900/60 border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <p className="text-xs text-red-400 mt-2">
                    No projects found. You may need to create a project or ensure you're a project member.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Document Title</label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="IEEE 830 Software Requirements Specification"
                  className="w-full px-4 py-2 bg-gray-900/60 border border-white/[0.06] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleCreateIEEETemplate}
                  disabled={creating || !selectedProject}
                  className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-purple-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">Blank IEEE Template</h3>
                  <p className="text-xs text-gray-500">Start with empty IEEE 830 structure</p>
                </button>
                <button 
                  onClick={() => alert("AI Generated - Coming soon!")}
                  className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-purple-500/30 transition-all text-left"
                >
                  <Star className="w-8 h-8 text-yellow-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">AI Generated</h3>
                  <p className="text-xs text-gray-500">Generate from requirements or BRD</p>
                </button>
                <button 
                  onClick={() => alert("Import DOCX - Coming soon!")}
                  className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-purple-500/30 transition-all text-left"
                >
                  <Download className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">Import DOCX</h3>
                  <p className="text-xs text-gray-500">Import from existing document</p>
                </button>
                <button 
                  onClick={() => alert("Duplicate Existing - Coming soon!")}
                  className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-purple-500/30 transition-all text-left"
                >
                  <Copy className="w-8 h-8 text-green-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">Duplicate Existing</h3>
                  <p className="text-xs text-gray-500">Copy from another SRS</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
