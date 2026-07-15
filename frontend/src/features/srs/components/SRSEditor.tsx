import React, { useState, useEffect, useRef } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Link, Image, Table, CheckSquare, AlignLeft,
  AlignCenter, AlignRight, Undo, Redo, Save, Eye, MoreHorizontal, Download,
  Share2, MessageSquare, History
} from "lucide-react";

interface SRSEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onAutoSave: (content: string) => void;
  readOnly?: boolean;
}

interface EditorState {
  content: string;
  wordCount: number;
  readingTime: number;
  lastSaved: Date | null;
  isSaving: boolean;
}

export const SRSEditor: React.FC<SRSEditorProps> = ({
  initialContent,
  onSave,
  onAutoSave,
  readOnly = false,
}) => {
  const [state, setState] = useState<EditorState>({
    content: initialContent,
    wordCount: 0,
    readingTime: 0,
    lastSaved: null,
    isSaving: false,
  });
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    calculateStats();
  }, [state.content]);

  const calculateStats = () => {
    const words = state.content.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    setState(prev => ({ ...prev, wordCount, readingTime }));
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setState(prev => ({ ...prev, content: newContent }));
    
    // Auto-save after 2 seconds of inactivity
    const timeoutId = setTimeout(() => {
      handleAutoSave(newContent);
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  };

  const handleAutoSave = async (content: string) => {
    setState(prev => ({ ...prev, isSaving: true }));
    try {
      await onAutoSave(content);
      setState(prev => ({ ...prev, lastSaved: new Date(), isSaving: false }));
    } catch (error) {
      console.error("Auto-save failed:", error);
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  const handleSave = async () => {
    setState(prev => ({ ...prev, isSaving: true }));
    try {
      await onSave(state.content);
      setState(prev => ({ ...prev, lastSaved: new Date(), isSaving: false }));
    } catch (error) {
      console.error("Save failed:", error);
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertTable = () => {
    const tableHTML = `
      <table class="srs-table">
        <thead>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
            <th>Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
            <td>Cell 3</td>
          </tr>
          <tr>
            <td>Cell 4</td>
            <td>Cell 5</td>
            <td>Cell 6</td>
          </tr>
        </tbody>
      </table>
    `;
    execCommand("insertHTML", tableHTML);
  };

  const insertCodeBlock = () => {
    const codeHTML = `
      <pre class="srs-code-block"><code>// Your code here</code></pre>
    `;
    execCommand("insertHTML", codeHTML || "");
  };

  const insertCallout = () => {
    const calloutHTML = `
      <div class="srs-callout">
        <strong>Note:</strong> This is a callout block for important information.
      </div>
    `;
    execCommand("insertHTML", calloutHTML);
  };

  const insertCheckbox = () => {
    const checkboxHTML = `
      <div class="srs-checkbox">
        <input type="checkbox" /> <span>Task item</span>
      </div>
    `;
    execCommand("insertHTML", checkboxHTML);
  };

  const toolbarButtons = [
    { icon: Undo, command: "undo", title: "Undo" },
    { icon: Redo, command: "redo", title: "Redo" },
    { divider: true },
    { icon: Heading1, command: "formatBlock", value: "H1", title: "Heading 1" },
    { icon: Heading2, command: "formatBlock", value: "H2", title: "Heading 2" },
    { icon: Heading3, command: "formatBlock", value: "H3", title: "Heading 3" },
    { divider: true },
    { icon: Bold, command: "bold", title: "Bold" },
    { icon: Italic, command: "italic", title: "Italic" },
    { icon: Underline, command: "underline", title: "Underline" },
    { icon: Strikethrough, command: "strikeThrough", title: "Strikethrough" },
    { divider: true },
    { icon: Code, command: "insertHTML", value: null, custom: insertCodeBlock, title: "Code Block" },
    { icon: List, command: "insertUnorderedList", title: "Bullet List" },
    { icon: ListOrdered, command: "insertOrderedList", title: "Numbered List" },
    { icon: CheckSquare, command: "insertHTML", value: null, custom: insertCheckbox, title: "Checkbox" },
    { divider: true },
    { icon: Quote, command: "formatBlock", value: "BLOCKQUOTE", title: "Quote" },
    { icon: Link, command: "createLink", value: "https://", title: "Link" },
    { icon: Image, command: "insertImage", value: "https://", title: "Image" },
    { icon: Table, command: "insertHTML", value: null, custom: insertTable, title: "Table" },
    { divider: true },
    { icon: AlignLeft, command: "justifyLeft", title: "Align Left" },
    { icon: AlignCenter, command: "justifyCenter", title: "Align Center" },
    { icon: AlignRight, command: "justifyRight", title: "Align Right" },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 border-b border-white/[0.06] bg-white/[0.01] flex-wrap">
          {toolbarButtons.map((button, index) => {
            if (button.divider) {
              return (
                <div key={`divider-${index}`} className="w-px h-6 bg-white/[0.1] mx-1" />
              );
            }
            const Icon = button.icon;
            if (!Icon) return null;
            return (
              <button
                key={button.command}
                onClick={() => button.custom ? button.custom() : execCommand(button.command, button.value)}
                className="p-2 hover:bg-white/[0.05] rounded text-gray-400 hover:text-white transition-colors"
                title={button.title}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            onClick={insertCallout}
            className="px-3 py-1.5 text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded hover:bg-purple-500/20 transition-colors"
          >
            Add Callout
          </button>
        </div>
      )}

      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{state.wordCount} words</span>
            <span>•</span>
            <span>{state.readingTime} min read</span>
          </div>
          {state.lastSaved && (
            <span className="text-xs text-gray-600">
              Saved {state.lastSaved.toLocaleTimeString()}
            </span>
          )}
          {state.isSaving && (
            <span className="text-xs text-purple-400">Saving...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
              <button className="p-1.5 hover:bg-white/[0.05] rounded text-gray-500 hover:text-white transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </>
          )}
          <button className="p-1.5 hover:bg-white/[0.05] rounded text-gray-500 hover:text-white transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-white/[0.05] rounded text-gray-500 hover:text-white transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-white/[0.05] rounded text-gray-500 hover:text-white transition-colors">
            <History className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-white/[0.05] rounded text-gray-500 hover:text-white transition-colors">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-white/[0.05] rounded text-gray-500 hover:text-white transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          onInput={handleContentChange}
          className="min-h-full p-8 prose prose-invert prose-purple max-w-none focus:outline-none"
          dangerouslySetInnerHTML={{ __html: state.content }}
          style={{
            caretColor: readOnly ? 'transparent' : 'white',
          }}
        />
      </div>

      {/* Floating Toolbar for Selection */}
      {/* This would be implemented with a more sophisticated selection detection */}
    </div>
  );
};
