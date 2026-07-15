import React, { useState } from "react";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";

interface IEEESection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
  is_collapsed: boolean;
  is_locked: boolean;
  children?: IEEESection[];
}

const IEEE_TEMPLATE: Omit<IEEESection, 'content' | 'is_collapsed' | 'is_locked'>[] = [
  { id: "1", type: "INTRODUCTION", title: "1 Introduction", order: 1 },
  { id: "1.1", type: "INTRODUCTION_PURPOSE", title: "1.1 Purpose", order: 2 },
  { id: "1.2", type: "INTRODUCTION_SCOPE", title: "1.2 Scope", order: 3 },
  { id: "1.3", type: "INTRODUCTION_AUDIENCE", title: "1.3 Intended Audience", order: 4 },
  { id: "1.4", type: "INTRODUCTION_DEFINITIONS", title: "1.4 Definitions", order: 5 },
  { id: "1.5", type: "INTRODUCTION_REFERENCES", title: "1.5 References", order: 6 },
  { id: "1.6", type: "INTRODUCTION_OVERVIEW", title: "1.6 Document Overview", order: 7 },
  { id: "2", type: "OVERALL_DESCRIPTION", title: "2 Overall Description", order: 8 },
  { id: "2.1", type: "OVERALL_PERSPECTIVE", title: "2.1 Product Perspective", order: 9 },
  { id: "2.2", type: "OVERALL_FUNCTIONS", title: "2.2 Product Functions", order: 10 },
  { id: "2.3", type: "OVERALL_USERS", title: "2.3 User Classes", order: 11 },
  { id: "2.4", type: "OVERALL_ENVIRONMENT", title: "2.4 Operating Environment", order: 12 },
  { id: "2.5", type: "OVERALL_CONSTRAINTS", title: "2.5 Constraints", order: 13 },
  { id: "2.6", type: "OVERALL_ASSUMPTIONS", title: "2.6 Assumptions", order: 14 },
  { id: "3", type: "EXTERNAL_INTERFACE", title: "3 External Interface Requirements", order: 15 },
  { id: "3.1", type: "EXTERNAL_UI", title: "3.1 User Interface", order: 16 },
  { id: "3.2", type: "EXTERNAL_HARDWARE", title: "3.2 Hardware Interface", order: 17 },
  { id: "3.3", type: "EXTERNAL_SOFTWARE", title: "3.3 Software Interface", order: 18 },
  { id: "3.4", type: "EXTERNAL_COMMUNICATION", title: "3.4 Communication Interface", order: 19 },
  { id: "4", type: "SYSTEM_FEATURES", title: "4 System Features", order: 20 },
  { id: "5", type: "FUNCTIONAL_REQUIREMENTS", title: "5 Functional Requirements", order: 21 },
  { id: "6", type: "NON_FUNCTIONAL_REQUIREMENTS", title: "6 Non Functional Requirements", order: 22 },
  { id: "7", type: "DATABASE_REQUIREMENTS", title: "7 Database Requirements", order: 23 },
  { id: "8", type: "DATA_DICTIONARY", title: "8 Data Dictionary", order: 24 },
  { id: "9", type: "USE_CASES", title: "9 Use Cases", order: 25 },
  { id: "10", type: "ACTIVITY_DIAGRAMS", title: "10 Activity Diagrams", order: 26 },
  { id: "11", type: "SEQUENCE_DIAGRAMS", title: "11 Sequence Diagrams", order: 27 },
  { id: "12", type: "CLASS_DIAGRAM", title: "12 Class Diagram", order: 28 },
  { id: "13", type: "ER_DIAGRAM", title: "13 ER Diagram", order: 29 },
  { id: "14", type: "STATE_DIAGRAM", title: "14 State Diagram", order: 30 },
  { id: "15", type: "SYSTEM_ARCHITECTURE", title: "15 System Architecture", order: 31 },
  { id: "16", type: "PERFORMANCE_REQUIREMENTS", title: "16 Performance Requirements", order: 32 },
  { id: "17", type: "SECURITY_REQUIREMENTS", title: "17 Security Requirements", order: 33 },
  { id: "18", type: "RISK_ANALYSIS", title: "18 Risk Analysis", order: 34 },
  { id: "19", type: "FUTURE_ENHANCEMENTS", title: "19 Future Enhancements", order: 35 },
  { id: "20", type: "APPENDIX", title: "20 Appendix", order: 36 },
  { id: "21", type: "BIBLIOGRAPHY", title: "21 Bibliography", order: 37 },
];

interface IEEETemplateProps {
  onSectionToggle: (sectionId: string) => void;
  onSectionEdit: (sectionId: string, content: string) => void;
}

export const IEEETemplate: React.FC<IEEETemplateProps> = ({
  onSectionToggle,
  onSectionEdit,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
    onSectionToggle(sectionId);
  };

  const renderSection = (section: IEEESection, level: number = 0) => {
    const isExpanded = expandedSections.has(section.id);
    const paddingLeft = level * 16;

    return (
      <div key={section.id} className="border-l border-white/[0.06]">
        <div
          className="flex items-center gap-2 py-2 px-4 hover:bg-white/[0.02] cursor-pointer transition-colors"
          style={{ paddingLeft: `${paddingLeft + 16}px` }}
          onClick={() => toggleSection(section.id)}
        >
          {section.is_locked && <Lock className="w-3 h-3 text-gray-600" />}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-300">{section.title}</span>
        </div>
        {isExpanded && (
          <div
            className="py-3 px-4 bg-white/[0.01]"
            style={{ paddingLeft: `${paddingLeft + 32}px` }}
          >
            <textarea
              value={section.content}
              onChange={(e) => onSectionEdit(section.id, e.target.value)}
              placeholder={`Enter content for ${section.title}...`}
              className="w-full min-h-[100px] p-3 bg-gray-900/60 border border-white/[0.06] rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 resize-y"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-gray-950 border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/[0.06] bg-white/[0.01]">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">IEEE 830 Template</h2>
        <p className="text-xs text-gray-500 mt-1">Software Requirements Specification Structure</p>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {IEEE_TEMPLATE.map(section => renderSection(section as IEEESection))}
      </div>
    </div>
  );
};

export const generateIEEETemplateSections = (): Omit<IEEESection, 'content' | 'is_collapsed' | 'is_locked'>[] => {
  return IEEE_TEMPLATE;
};
