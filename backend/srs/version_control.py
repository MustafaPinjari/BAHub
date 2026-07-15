"""
Version control module for SRS documents.
Handles version history, restoration, and comparison.
"""

from typing import Dict, List, Optional
from django.db import transaction
from .models import SRSDocument, SRSVersion, SRSSection
from .serializers import SRSDocumentSerializer
import logging
import json

logger = logging.getLogger(__name__)


class VersionControlService:
    """Service for managing SRS document version control."""
    
    @staticmethod
    def create_version(
        document: SRSDocument,
        version_number: str,
        change_summary: str,
        created_by
    ) -> SRSVersion:
        """
        Create a new version snapshot of the document.
        
        Args:
            document: SRS document to version
            version_number: Version identifier (e.g., "1.0", "1.1")
            change_summary: Description of changes
            created_by: User creating the version
        
        Returns:
            Created SRSVersion instance
        """
        try:
            # Serialize document state
            serializer = SRSDocumentSerializer(document)
            snapshot_data = serializer.data
            
            # Create version record
            version = SRSVersion.objects.create(
                document=document,
                version_number=version_number,
                change_summary=change_summary,
                created_by=created_by,
                snapshot_data=snapshot_data
            )
            
            # Update document version
            document.version = version_number
            document.save()
            
            logger.info(f"Created version {version_number} for document {document.id}")
            return version
        except Exception as e:
            logger.error(f"Version creation failed: {e}")
            raise
    
    @staticmethod
    @transaction.atomic
    def restore_version(document: SRSDocument, version_id: str) -> Dict:
        """
        Restore document from a specific version.
        
        Args:
            document: SRS document to restore
            version_id: ID of version to restore from
        
        Returns:
            Restore result
        """
        try:
            version = SRSVersion.objects.get(id=version_id, document=document)
            snapshot_data = version.snapshot_data
            
            # Restore document fields
            document.title = snapshot_data.get('title', document.title)
            document.description = snapshot_data.get('description', document.description)
            document.status = snapshot_data.get('status', document.status)
            document.save()
            
            # Restore sections
            document.sections.all().delete()
            
            for section_data in snapshot_data.get('sections', []):
                SRSSection.objects.create(
                    document=document,
                    parent_section_id=section_data.get('parent_section'),
                    section_type=section_data.get('section_type'),
                    title=section_data.get('title'),
                    content=section_data.get('content', ''),
                    order=section_data.get('order', 0),
                    is_collapsed=section_data.get('is_collapsed', False),
                    is_locked=section_data.get('is_locked', False)
                )
            
            logger.info(f"Restored document {document.id} to version {version.version_number}")
            return {
                'success': True,
                'version_restored': version.version_number,
                'message': f'Document restored to version {version.version_number}',
            }
        except SRSVersion.DoesNotExist:
            logger.error(f"Version {version_id} not found for document {document.id}")
            return {
                'success': False,
                'error': 'Version not found',
            }
        except Exception as e:
            logger.error(f"Version restoration failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def compare_versions(document: SRSDocument, version_id_1: str, version_id_2: str) -> Dict:
        """
        Compare two versions of a document.
        
        Args:
            document: SRS document
            version_id_1: First version ID
            version_id_2: Second version ID
        
        Returns:
            Comparison result with differences
        """
        try:
            version_1 = SRSVersion.objects.get(id=version_id_1, document=document)
            version_2 = SRSVersion.objects.get(id=version_id_2, document=document)
            
            snapshot_1 = version_1.snapshot_data
            snapshot_2 = version_2.snapshot_data
            
            differences = {
                'metadata': {},
                'sections': [],
            }
            
            # Compare metadata
            for field in ['title', 'description', 'status']:
                if snapshot_1.get(field) != snapshot_2.get(field):
                    differences['metadata'][field] = {
                        'old': snapshot_1.get(field),
                        'new': snapshot_2.get(field),
                    }
            
            # Compare sections
            sections_1 = {s['id']: s for s in snapshot_1.get('sections', [])}
            sections_2 = {s['id']: s for s in snapshot_2.get('sections', [])}
            
            all_section_ids = set(sections_1.keys()) | set(sections_2.keys())
            
            for section_id in all_section_ids:
                section_1 = sections_1.get(section_id)
                section_2 = sections_2.get(section_id)
                
                if not section_1:
                    differences['sections'].append({
                        'id': section_id,
                        'action': 'added',
                        'title': section_2.get('title'),
                    })
                elif not section_2:
                    differences['sections'].append({
                        'id': section_id,
                        'action': 'removed',
                        'title': section_1.get('title'),
                    })
                elif section_1.get('content') != section_2.get('content'):
                    differences['sections'].append({
                        'id': section_id,
                        'action': 'modified',
                        'title': section_1.get('title'),
                        'old_content': section_1.get('content'),
                        'new_content': section_2.get('content'),
                    })
            
            return {
                'success': True,
                'comparison': differences,
                'version_1': version_1.version_number,
                'version_2': version_2.version_number,
            }
        except Exception as e:
            logger.error(f"Version comparison failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def get_version_history(document: SRSDocument) -> List[Dict]:
        """
        Get version history for a document.
        
        Args:
            document: SRS document
        
        Returns:
            List of version history entries
        """
        try:
            versions = SRSVersion.objects.filter(document=document).order_by('-created_at')
            
            history = []
            for version in versions:
                history.append({
                    'id': str(version.id),
                    'version_number': version.version_number,
                    'change_summary': version.change_summary,
                    'created_by': version.created_by.username if version.created_by else 'Unknown',
                    'created_at': version.created_at.isoformat(),
                })
            
            return history
        except Exception as e:
            logger.error(f"Version history retrieval failed: {e}")
            return []


# Singleton instance
version_control_service = VersionControlService()
