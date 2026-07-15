"""
Document Importer module for SRS documents.
Handles import from various formats (DOCX, Markdown, PDF).
"""

from typing import Dict, Optional
from django.conf import settings
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class DocumentImporter:
    """Service for importing documents into SRS format."""
    
    def __init__(self):
        self.import_dir = Path(settings.MEDIA_ROOT) / 'srs_imports'
        self.import_dir.mkdir(parents=True, exist_ok=True)
    
    def import_from_docx(
        self,
        filepath: str,
        document_id: Optional[str] = None
    ) -> Dict:
        """
        Import SRS document from DOCX format.
        
        Args:
            filepath: Path to DOCX file
            document_id: Optional existing document ID to update
        
        Returns:
            Dictionary with import result and parsed sections
        """
        try:
            # Placeholder for DOCX parsing
            # In production, use python-docx library
            sections = [
                {
                    'title': 'Imported Section 1',
                    'content': 'Content from DOCX file',
                    'section_type': 'CUSTOM',
                }
            ]
            
            return {
                'success': True,
                'sections': sections,
                'format': 'DOCX',
                'original_filename': Path(filepath).name,
            }
        except Exception as e:
            logger.error(f"DOCX import failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'format': 'DOCX',
            }
    
    def import_from_markdown(
        self,
        filepath: str,
        document_id: Optional[str] = None
    ) -> Dict:
        """
        Import SRS document from Markdown format.
        
        Args:
            filepath: Path to Markdown file
            document_id: Optional existing document ID to update
        
        Returns:
            Dictionary with import result and parsed sections
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            sections = self._parse_markdown(content)
            
            return {
                'success': True,
                'sections': sections,
                'format': 'MARKDOWN',
                'original_filename': Path(filepath).name,
            }
        except Exception as e:
            logger.error(f"Markdown import failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'format': 'MARKDOWN',
            }
    
    def import_from_pdf(
        self,
        filepath: str,
        document_id: Optional[str] = None
    ) -> Dict:
        """
        Import SRS document from PDF format.
        
        Args:
            filepath: Path to PDF file
            document_id: Optional existing document ID to update
        
        Returns:
            Dictionary with import result and parsed sections
        """
        try:
            # Placeholder for PDF parsing
            # In production, use PyPDF2 or pdfplumber
            sections = [
                {
                    'title': 'Imported Section 1',
                    'content': 'Content from PDF file',
                    'section_type': 'CUSTOM',
                }
            ]
            
            return {
                'success': True,
                'sections': sections,
                'format': 'PDF',
                'original_filename': Path(filepath).name,
            }
        except Exception as e:
            logger.error(f"PDF import failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'format': 'PDF',
            }
    
    def _parse_markdown(self, content: str) -> list:
        """Parse markdown content into sections."""
        sections = []
        lines = content.split('\n')
        current_section = None
        
        for line in lines:
            if line.startswith('# '):
                if current_section:
                    sections.append(current_section)
                current_section = {
                    'title': line[2:].strip(),
                    'content': '',
                    'section_type': 'CUSTOM',
                }
            elif line.startswith('## '):
                if current_section:
                    sections.append(current_section)
                current_section = {
                    'title': line[3:].strip(),
                    'content': '',
                    'section_type': 'CUSTOM',
                }
            elif current_section:
                current_section['content'] += line + '\n'
        
        if current_section:
            sections.append(current_section)
        
        return sections


# Singleton instance
document_importer = DocumentImporter()
