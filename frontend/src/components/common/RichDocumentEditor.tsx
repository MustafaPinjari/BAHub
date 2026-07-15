import React, { useState, useRef } from "react";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Code,
  Link as LinkIcon,
  Table,
  Eye,
  Edit3,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Button } from "./UIComponents";

interface RichDocumentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
}

export const RichDocumentEditor: React.FC<RichDocumentEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing your document...",
  readOnly = false,
  minHeight = "400px"
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = "", placeholder: string = "") => {
    if (readOnly || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const text = selectedText || placeholder;
    
    const newValue = 
      value.substring(0, start) + 
      before + text + after + 
      value.substring(end);
    
    onChange(newValue);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarActions = [
    {
      icon: Heading1,
      label: "Heading 1",
      action: () => insertMarkdown("# ", "", "Heading 1")
    },
    {
      icon: Heading2,
      label: "Heading 2", 
      action: () => insertMarkdown("## ", "", "Heading 2")
    },
    {
      icon: Heading3,
      label: "Heading 3",
      action: () => insertMarkdown("### ", "", "Heading 3")
    },
    {
      icon: Bold,
      label: "Bold",
      action: () => insertMarkdown("**", "**", "bold text")
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => insertMarkdown("*", "*", "italic text")
    },
    {
      icon: List,
      label: "Bullet List",
      action: () => insertMarkdown("- ", "", "List item")
    },
    {
      icon: ListOrdered,
      label: "Numbered List",
      action: () => insertMarkdown("1. ", "", "List item")
    },
    {
      icon: Code,
      label: "Code Block",
      action: () => insertMarkdown("```\n", "\n```", "code")
    },
    {
      icon: LinkIcon,
      label: "Link",
      action: () => insertMarkdown("[", "](url)", "link text")
    },
    {
      icon: Table,
      label: "Table",
      action: () => insertMarkdown(
        "| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n",
        "",
        ""
      )
    }
  ];

  const renderPreview = () => {
    if (!value) return <p className="text-muted-foreground text-sm italic">{placeholder}</p>;

    const lines = value.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(<ul key={`list-${elements.length}`} className="list-disc pl-6 my-2 space-y-1">{currentList}</ul>);
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Code blocks
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${index}`} className="bg-secondary/30 border border-border rounded-lg p-4 my-3 overflow-x-auto">
              <code className="text-sm font-mono text-muted-foreground">{codeContent}</code>
            </pre>
          );
          codeContent = '';
          inCodeBlock = false;
        } else {
          flushList();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      // Headings
      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(<h1 key={index} className="text-2xl font-bold text-foreground mt-6 mb-3">{trimmed.substring(2)}</h1>);
        return;
      }
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(<h2 key={index} className="text-xl font-bold text-foreground mt-5 mb-2">{trimmed.substring(3)}</h2>);
        return;
      }
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(<h3 key={index} className="text-lg font-bold text-foreground mt-4 mb-2">{trimmed.substring(4)}</h3>);
        return;
      }

      // Lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        currentList.push(<li key={index} className="text-sm text-muted-foreground">{trimmed.substring(2)}</li>);
        return;
      }

      // Numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        flushList();
        elements.push(<ol key={`ol-${index}`} className="list-decimal pl-6 my-2 space-y-1"><li key={index} className="text-sm text-muted-foreground">{trimmed.replace(/^\d+\.\s/, '')}</li></ol>);
        return;
      }

      // Tables
      if (trimmed.startsWith('|')) {
        flushList();
        const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length > 0 && !cells.every(c => c.startsWith('---'))) {
          elements.push(
            <div key={index} className="overflow-x-auto my-3 border border-border rounded-lg">
              <table className="min-w-full divide-y divide-border">
                <tbody>
                  <tr>
                    {cells.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 text-sm text-muted-foreground border-r border-border last:border-0">{cell}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        }
        return;
      }

      // Paragraphs
      if (trimmed) {
        flushList();
        elements.push(<p key={index} className="text-sm text-muted-foreground my-2 leading-relaxed">{line}</p>);
      }
    });

    flushList();

    return <div className="prose prose-sm max-w-none">{elements}</div>;
  };

  return (
    <div className={`flex flex-col border border-border rounded-xl overflow-hidden bg-card ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-1 flex-wrap">
            {toolbarActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  size="icon"
                  onClick={action.action}
                  className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  title={action.label}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPreview(!isPreview)}
              className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              title={isPreview ? "Edit Mode" : "Preview Mode"}
            >
              {isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Editor/Preview Area */}
      <div className="flex-1 overflow-auto" style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight }}>
        {isPreview || readOnly ? (
          <div className="p-6">
            {renderPreview()}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full p-6 bg-background text-foreground text-sm font-mono leading-relaxed resize-none outline-none focus:ring-0"
            style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight }}
            disabled={readOnly}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-secondary/20 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{value.split(/\s+/).filter(Boolean).length} words</span>
          <span>{value.length} characters</span>
          <span>{value.split('\n').length} lines</span>
        </div>
        <div className="flex items-center gap-2">
          {isPreview && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Preview Mode
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
