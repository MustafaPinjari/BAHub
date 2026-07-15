import React, { useState, useEffect } from "react";
import { Eye, Download, History, MessageSquare, Settings, ChevronDown, ChevronRight, ChevronLeft, Edit3, Check, X } from "lucide-react";
import { api } from "../../services/api";

interface SRSSection {
  id: string;
  section_number: string;
  title: string;
  section_type: string;
  content: string;
  order: number;
  is_collapsed: boolean;
  linked_diagram?: string | null;
  linked_diagram_details?: {
    id: string;
    name: string;
    diagram_type: string;
  } | null;
}

interface DiagramOption {
  id: string;
  name: string;
  diagram_type: string;
}

interface SRSDocument {
  id: string;
  title: string;
  description: string;
  status: string;
  version: string;
  project_name?: string;
}

interface SRSEditorProps {
  documentId: string;
  onClose: () => void;
}

export const SRSEditor: React.FC<SRSEditorProps> = ({ documentId, onClose }) => {
  const [srsDocument, setSrsDocument] = useState<SRSDocument | null>(null);
  const [sections, setSections] = useState<SRSSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({});
  const [sectionDiagram, setSectionDiagram] = useState<Record<string, string | null>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [availableDiagrams, setAvailableDiagrams] = useState<DiagramOption[]>([]);

  useEffect(() => {
    fetchDocument();
    fetchSections();
  }, [documentId]);

  useEffect(() => {
    if (srsDocument?.project_name) {
      // It would be better if we had the project ID, but for now we fetch by name or just fetch all
      // We will try to extract project ID if possible, otherwise just fetch all and let backend filter
      fetchDiagrams();
    }
  }, [srsDocument]);

  const fetchDiagrams = async () => {
    try {
      // The API returns all diagrams for the user's org. We can filter by project if needed.
      const response: any = await api.get('/diagrams/');
      setAvailableDiagrams(response.data || []);
    } catch (error) {
      console.error("Failed to fetch diagrams:", error);
    }
  };

  const fetchDocument = async () => {
    try {
      const response: any = await api.get(`/srs/documents/${documentId}/`);
      setSrsDocument(response.data);
    } catch (error) {
      console.error("Failed to fetch document:", error);
    }
  };

  const fetchSections = async () => {
    try {
      const response: any = await api.get(`/srs/sections/?document=${documentId}`);
      setSections(response.data || []);
      const contentMap: Record<string, string> = {};
      const diagramMap: Record<string, string | null> = {};
      (response.data || []).forEach((section: SRSSection) => {
        contentMap[section.id] = section.content;
        diagramMap[section.id] = section.linked_diagram || null;
      });
      setSectionContent(contentMap);
      setSectionDiagram(diagramMap);
    } catch (error) {
      console.error("Failed to fetch sections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async (sectionId: string) => {
    setSaving(true);
    try {
      const payload: any = {
        content: sectionContent[sectionId]
      };
      
      if (sectionDiagram[sectionId] !== undefined) {
        payload.linked_diagram = sectionDiagram[sectionId];
      }

      await api.patch(`/srs/sections/${sectionId}/`, payload);
      setEditingSection(null);
      // Refresh to get the updated linked_diagram_details
      fetchSections();
    } catch (error) {
      console.error("Failed to save section:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, is_collapsed: !s.is_collapsed } : s
    ));
  };

  const handleExport = async (format: string) => {
    try {
      const response = await api.post(`/srs/documents/${documentId}/export/`, { format });
      // Handle download
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `srs-document.${format}`;
      anchor.click();
    } catch (error) {
      console.error("Failed to export:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg text-gray-500 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">{srsDocument?.title}</h1>
            <p className="text-xs text-gray-500">v{srsDocument?.version} • {srsDocument?.status}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {/* Show version history */}}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => {/* Show comments */}}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Comments
          </button>
          <button
            onClick={() => {/* Show settings */}}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Table of Contents */}
        <div className="w-64 border-r border-white/[0.06] overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Table of Contents</h3>
            <div className="space-y-1">
              {sections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      setActiveSection(section.id);
                      // Scroll the editor area to the section
                      const element = document.getElementById(`section-${section.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                      activeSection === section.id 
                        ? 'bg-purple-500/10 text-purple-400' 
                        : 'text-gray-400 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-gray-500">•</span>
                    <span className="text-xs truncate">{section.section_number} {section.title}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {sections.map((section) => (
              <div 
                key={section.id} 
                id={`section-${section.id}`}
                className="mb-8"
              >
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xl font-semibold text-white">
                    {section.section_number} {section.title}
                  </h2>
                  {editingSection === section.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSaveSection(section.id)}
                        disabled={saving}
                        className="p-1 hover:bg-green-500/10 rounded text-green-400 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingSection(null)}
                        className="p-1 hover:bg-red-500/10 rounded text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingSection(section.id)}
                      className="p-1 hover:bg-white/[0.05] rounded text-gray-500 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {editingSection === section.id ? (
                  <div className="space-y-4">
                    {section.section_type && (section.section_type.includes('DIAGRAM') || section.section_type.includes('USE_CASES')) && (
                      <div className="p-4 bg-gray-900/40 border border-purple-500/30 rounded-lg">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Link BAHub Diagram
                        </label>
                        <select
                          value={sectionDiagram[section.id] || ''}
                          onChange={(e) => setSectionDiagram(prev => ({
                            ...prev,
                            [section.id]: e.target.value || null
                          }))}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                        >
                          <option value="">-- No Diagram Linked --</option>
                          {availableDiagrams.map(diag => (
                            <option key={diag.id} value={diag.id}>
                              {diag.name} ({diag.diagram_type})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-2">Linking a diagram embeds it directly into this document section.</p>
                      </div>
                    )}
                    <textarea
                      value={sectionContent[section.id] || ''}
                      onChange={(e) => setSectionContent(prev => ({
                        ...prev,
                        [section.id]: e.target.value
                      }))}
                      className="w-full h-64 px-4 py-3 bg-gray-900/60 border border-white/[0.06] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
                      placeholder="Enter section text description..."
                    />
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    {section.linked_diagram_details && (
                      <div className="mb-6 p-6 border border-purple-500/20 bg-purple-500/5 rounded-xl flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                          <Eye className="w-8 h-8 text-purple-400" />
                        </div>
                        <h4 className="text-lg font-medium text-white mb-1">
                          {section.linked_diagram_details.name}
                        </h4>
                        <span className="px-2.5 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                          {section.linked_diagram_details.diagram_type}
                        </span>
                      </div>
                    )}
                    
                    {section.content ? (
                      <div 
                        className="text-gray-300 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    ) : (
                      !section.linked_diagram_details && (
                        <p className="text-gray-500 italic">No content yet. Click the edit icon to add content.</p>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
