"""
Search module for SRS documents.
Handles search across documents, sections, and requirement IDs.
"""

from typing import Dict, List, Optional
from django.db.models import Q
from .models import SRSDocument, SRSSection
import logging

logger = logging.getLogger(__name__)


class SRSSearchService:
    """Service for searching SRS documents and content."""
    
    @staticmethod
    def search_documents(
        user,
        query: str,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict]:
        """
        Search SRS documents by title, description, and content.
        
        Args:
            user: User performing the search
            query: Search query string
            project_id: Optional project ID to filter by
            status: Optional status to filter by
            limit: Maximum number of results
        
        Returns:
            List of matching document dictionaries
        """
        try:
            if not user.is_authenticated or not user.organization_id:
                return []
            
            queryset = SRSDocument.objects.filter(
                project__organization_id=user.organization_id
            ).select_related('project', 'created_by')
            
            # Build search query
            search_filter = (
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(sections__content__icontains=query)
            )
            
            queryset = queryset.filter(search_filter).distinct()
            
            # Apply filters
            if project_id:
                queryset = queryset.filter(project_id=project_id)
            
            if status:
                queryset = queryset.filter(status=status)
            
            results = queryset[:limit]
            
            documents = []
            for doc in results:
                documents.append({
                    'id': str(doc.id),
                    'title': doc.title,
                    'description': doc.description,
                    'project_name': doc.project.name if doc.project else None,
                    'project_id': str(doc.project.id) if doc.project else None,
                    'status': doc.status,
                    'version': doc.version,
                    'created_by': doc.created_by.username if doc.created_by else 'Unknown',
                    'created_at': doc.created_at.isoformat(),
                    'updated_at': doc.updated_at.isoformat(),
                })
            
            return documents
        except Exception as e:
            logger.error(f"Document search failed: {e}")
            return []
    
    @staticmethod
    def search_sections(
        user,
        query: str,
        document_id: Optional[str] = None,
        section_type: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """
        Search SRS sections by title and content.
        
        Args:
            user: User performing the search
            query: Search query string
            document_id: Optional document ID to filter by
            section_type: Optional section type to filter by
            limit: Maximum number of results
        
        Returns:
            List of matching section dictionaries
        """
        try:
            if not user.is_authenticated or not user.organization_id:
                return []
            
            queryset = SRSSection.objects.filter(
                document__project__organization_id=user.organization_id
            ).select_related('document')
            
            # Build search query
            search_filter = (
                Q(title__icontains=query) |
                Q(content__icontains=query)
            )
            
            queryset = queryset.filter(search_filter)
            
            # Apply filters
            if document_id:
                queryset = queryset.filter(document_id=document_id)
            
            if section_type:
                queryset = queryset.filter(section_type=section_type)
            
            results = queryset[:limit]
            
            sections = []
            for section in results:
                sections.append({
                    'id': str(section.id),
                    'document_id': str(section.document.id),
                    'document_title': section.document.title,
                    'section_type': section.section_type,
                    'title': section.title,
                    'content': section.content[:200] + '...' if len(section.content) > 200 else section.content,
                    'order': section.order,
                })
            
            return sections
        except Exception as e:
            logger.error(f"Section search failed: {e}")
            return []
    
    @staticmethod
    def search_by_requirement_id(user, requirement_id: str) -> List[Dict]:
        """
        Search for sections that reference a specific requirement ID.
        
        Args:
            user: User performing the search
            requirement_id: Requirement ID to search for (e.g., "REQ-001")
        
        Returns:
            List of matching section dictionaries
        """
        try:
            if not user.is_authenticated or not user.organization_id:
                return []
            
            queryset = SRSSection.objects.filter(
                document__project__organization_id=user.organization_id,
                content__icontains=requirement_id
            ).select_related('document')
            
            results = queryset
            
            sections = []
            for section in results:
                sections.append({
                    'id': str(section.id),
                    'document_id': str(section.document.id),
                    'document_title': section.document.title,
                    'section_type': section.section_type,
                    'title': section.title,
                    'content': section.content[:200] + '...' if len(section.content) > 200 else section.content,
                })
            
            return sections
        except Exception as e:
            logger.error(f"Requirement ID search failed: {e}")
            return []
    
    @staticmethod
    def advanced_search(
        user,
        filters: Dict,
        limit: int = 50
    ) -> List[Dict]:
        """
        Advanced search with multiple filters.
        
        Args:
            user: User performing the search
            filters: Dictionary of search filters
            limit: Maximum number of results
        
        Returns:
            List of matching document dictionaries
        """
        try:
            if not user.is_authenticated or not user.organization_id:
                return []
            
            queryset = SRSDocument.objects.filter(
                project__organization_id=user.organization_id
            ).select_related('project', 'created_by')
            
            # Apply filters
            if filters.get('query'):
                query = filters['query']
                queryset = queryset.filter(
                    Q(title__icontains=query) |
                    Q(description__icontains=query) |
                    Q(sections__content__icontains=query)
                ).distinct()
            
            if filters.get('project_id'):
                queryset = queryset.filter(project_id=filters['project_id'])
            
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            
            if filters.get('template_type'):
                queryset = queryset.filter(template_type=filters['template_type'])
            
            if filters.get('is_ai_generated') is not None:
                queryset = queryset.filter(is_ai_generated=filters['is_ai_generated'])
            
            if filters.get('created_by'):
                queryset = queryset.filter(created_by_id=filters['created_by'])
            
            if filters.get('date_from'):
                queryset = queryset.filter(created_at__gte=filters['date_from'])
            
            if filters.get('date_to'):
                queryset = queryset.filter(created_at__lte=filters['date_to'])
            
            results = queryset[:limit]
            
            documents = []
            for doc in results:
                documents.append({
                    'id': str(doc.id),
                    'title': doc.title,
                    'description': doc.description,
                    'project_name': doc.project.name if doc.project else None,
                    'status': doc.status,
                    'template_type': doc.template_type,
                    'version': doc.version,
                    'is_ai_generated': doc.is_ai_generated,
                    'created_by': doc.created_by.username if doc.created_by else 'Unknown',
                    'created_at': doc.created_at.isoformat(),
                })
            
            return documents
        except Exception as e:
            logger.error(f"Advanced search failed: {e}")
            return []


# Singleton instance
srs_search_service = SRSSearchService()
