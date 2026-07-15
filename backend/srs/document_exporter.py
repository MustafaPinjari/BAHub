"""
Document Exporter module for SRS documents.
Handles export to various formats (PDF, DOCX, Markdown, HTML, JSON).
"""

from typing import Dict, Optional
from django.conf import settings
import logging
import json
from pathlib import Path

logger = logging.getLogger(__name__)


class DocumentExporter:
    """Service for exporting SRS documents to various formats."""
    
    def __init__(self):
        self.export_dir = Path(settings.MEDIA_ROOT) / 'srs_exports'
        self.export_dir.mkdir(parents=True, exist_ok=True)
    
    def export_to_pdf(
        self,
        document_data: Dict,
        filename: Optional[str] = None
    ) -> Dict:
        """
        Export SRS document to PDF format.
        
        Args:
            document_data: Document data including sections
            filename: Optional custom filename
        
        Returns:
            Dictionary with export result and file path
        """
        try:
            if not filename:
                filename = f"{document_data.get('title', 'srs')}.pdf"
            
            filepath = self.export_dir / filename
            
            # Placeholder for PDF generation
            # In production, use libraries like reportlab or weasyprint
            with open(filepath, 'w') as f:
                f.write(f"# {document_data.get('title', 'SRS Document')}\n\n")
                for section in document_data.get('sections', []):
                    f.write(f"## {section.get('title')}\n\n")
                    f.write(f"{section.get('content', '')}\n\n")
            
            return {
                'success': True,
                'filepath': str(filepath),
                'format': 'PDF',
                'file_size': filepath.stat().st_size if filepath.exists() else 0,
            }
        except Exception as e:
            logger.error(f"PDF export failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'format': 'PDF',
            }
    
    def export_to_docx(
        self,
        document_data: Dict,
        filename: Optional[str] = None
    ) -> Dict:
        """
        Export SRS document to DOCX format.
        
        Args:
            document_data: Document data including sections
            filename: Optional custom filename
        
        Returns:
            Dictionary with export result and file path
        """
        try:
            if not filename:
                filename = f"{document_data.get('title', 'srs')}.docx"
            
            filepath = self.export_dir / filename
            
            # Placeholder for DOCX generation
            # In production, use python-docx library
            with open(filepath, 'w') as f:
                f.write(f"# {document_data.get('title', 'SRS Document')}\n\n")
                for section in document_data.get('sections', []):
                    f.write(f"## {section.get('title')}\n\n")
                    f.write(f"{section.get('content', '')}\n\n")
            
            return {
                'success': True,
                'filepath': str(filepath),
                'format': 'DOCX',
                'file_size': filepath.stat().st_size if filepath.exists() else 0,
            }
        except Exception as e:
            logger.error(f"DOCX export failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'format': 'DOCX',
            }
    
    def export_to_markdown(
        self,
        document_data: Dict,
        filename: Optional[str] = None
    ) -> Dict:
        """
        Export SRS document to Markdown format.
        
        Args:
            document_data: Document data including sections
            filename: Optional custom filename
        
        Returns:
            Dictionary with export result and file path
        """
        try:
            if not filename:
                filename = f"{document_data.get('title', 'srs')}.md"
            
            filepath = self.export_dir / filename
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(f"# {document_data.get('title', 'SRS Document')}\n\n")
                if document_data.get('description'):
                    f.write(f"{document_data.get('description')}\n\n")
                
                for section in document_data.get('sections', []):
                    f.write(f"## {section.get('title')}\n\n")
                    f.write(f"{section.get('content', '')}\n\n")
            
            return {
                'success': True,
                'filepath': str(filepath),
                'format': 'MARKDOWN',
                'file_size': filepath.stat().st_size if filepath.exists() else 0,
            }
        except Exception as e:
            logger.error(f"Markdown export failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'format': 'MARKDOWN',
            }
    
    def export_to_html(
        self,
        document_data: Dict,
        filename: Optional[str] = None
    ) -> Dict:
        """
        Export SRS document to HTML format.
        
        Args:
            document_data: Document data including sections
            filename: Optional custom filename
        
        Returns:
            Dictionary with export result and file path
        """
        try:
            if not filename:
                filename = f"{document_data.get('title', 'srs')}.html"
            
            filepath = self.export_dir / filename
            
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>{document_data.get('title', 'SRS Document')}</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
        h1 {{ color: #333; }}
        h2 {{ color: #666; border-bottom: 1px solid #eee; padding-bottom: 10px; }}
        .section {{ margin-bottom: 30px; }}
    </style>
</head>
<body>
    <h1>{document_data.get('title', 'SRS Document')}</h1>
    {f'<p>{document_data.get("description", "")}</p>' if document_data.get('description') else ''}
"""
            
            for section in document_data.get('sections', []):
                html_content += f"""
    <div class="section">
        <h2>{section.get('title')}</h2>
        <div>{section.get('content', '')}</div>
    </div>
"""
            
            html_content += """
</body>
</html>
"""
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            return {
                'success': True,
                'filepath': str(filepath),
                'format': 'HTML',
                'file_size': filepath.stat().st_size if filepath.exists() else 0,
            }
        except Exception as e:
            logger.error(f"HTML export failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'format': 'HTML',
            }
    
    def export_to_json(
        self,
        document_data: Dict,
        filename: Optional[str] = None
    ) -> Dict:
        """
        Export SRS document to JSON format.
        
        Args:
            document_data: Document data including sections
            filename: Optional custom filename
        
        Returns:
            Dictionary with export result and file path
        """
        try:
            if not filename:
                filename = f"{document_data.get('title', 'srs')}.json"
            
            filepath = self.export_dir / filename
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(document_data, f, indent=2, ensure_ascii=False)
            
            return {
                'success': True,
                'filepath': str(filepath),
                'format': 'JSON',
                'file_size': filepath.stat().st_size if filepath.exists() else 0,
            }
        except Exception as e:
            logger.error(f"JSON export failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'format': 'JSON',
            }


# Singleton instance
document_exporter = DocumentExporter()
