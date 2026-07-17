import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Button, Input } from "../../components/common/UIComponents";
import { Palette, Save, Loader2, X, Plus } from "lucide-react";

interface FigmaEmbedProps {
  requirementId: string;
  onClose?: () => void;
}

interface FigmaDesign {
  id: string;
  figma_file_id: string;
  figma_node_id: string;
  name: string;
  image_url: string;
}

export const FigmaEmbed: React.FC<FigmaEmbedProps> = ({ requirementId, onClose }) => {
  const [designs, setDesigns] = useState<FigmaDesign[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [fileId, setFileId] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [designName, setDesignName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, [requirementId]);

  const fetchDesigns = async () => {
    try {
      const res = await api.get<any, { data: FigmaDesign[] }>(`/integrations/figma/?requirement=${requirementId}`);
      setDesigns(res.data);
    } catch (err) {
      console.error("Failed to load Figma designs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttach = async () => {
    if (!fileId || !nodeId) return;
    setSaving(true);
    try {
      await api.post("/integrations/figma/attach/", {
        requirement_id: requirementId,
        figma_file_id: fileId,
        figma_node_id: nodeId,
        name: designName || "Attached Design"
      });
      setIsAdding(false);
      setFileId("");
      setNodeId("");
      setDesignName("");
      fetchDesigns();
    } catch (err) {
      console.error("Failed to attach design", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full bg-card border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-pink-500" />
          <h3 className="text-xs font-bold text-foreground">Figma Designs</h3>
        </div>
        <div className="flex items-center gap-2">
          {!isAdding && (
            <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} className="h-7 text-[10px] px-2 py-0">
              <Plus className="w-3 h-3 mr-1" />
              Attach Design
            </Button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {isAdding && (
          <div className="p-3 border border-indigo-500/30 bg-indigo-500/5 rounded-md flex flex-col gap-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Link new design</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">File ID</label>
                <Input 
                  value={fileId}
                  onChange={(e) => setFileId(e.target.value)}
                  placeholder="e.g. 1a2b3c4d5e"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Node ID</label>
                <Input 
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  placeholder="e.g. 1:2"
                  className="text-xs h-8"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Label (Optional)</label>
              <Input 
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                placeholder="e.g. Checkout Screen"
                className="text-xs h-8"
              />
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7 text-xs">Cancel</Button>
              <Button size="sm" onClick={handleAttach} disabled={saving || !fileId || !nodeId} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                Save Link
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : designs.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground font-semibold italic">
            No designs attached yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {designs.map(design => (
              <div key={design.id} className="border border-border rounded-lg overflow-hidden group relative">
                <div className="p-2 border-b border-border bg-muted/20 flex justify-between items-center">
                  <span className="text-[11px] font-bold text-foreground">{design.name}</span>
                  <a 
                    href={`https://www.figma.com/file/${design.figma_file_id}?node-id=${design.figma_node_id}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-blue-500 hover:underline font-semibold"
                  >
                    Open in Figma
                  </a>
                </div>
                <div className="w-full h-48 bg-black/10 flex items-center justify-center">
                  {/* Iframe implementation for Figma embed */}
                  <iframe 
                    className="w-full h-full border-none"
                    src={`https://www.figma.com/embed?embed_host=share&url=https://www.figma.com/file/${design.figma_file_id}?node-id=${design.figma_node_id}`} 
                    allowFullScreen
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
