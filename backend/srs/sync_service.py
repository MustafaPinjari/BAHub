"""
Auto-sync service for SRS documents with existing project data.
Syncs SRS content with Requirements, User Stories, Stakeholders, etc.
"""

from typing import Dict, List, Optional
from django.db import transaction
from .models import SRSDocument, SRSSection
import logging

logger = logging.getLogger(__name__)


class SRSSyncService:
    """Service for auto-syncing SRS documents with project data."""
    
    @staticmethod
    def sync_with_requirements(document: SRSDocument, requirements: List[Dict]) -> Dict:
        """
        Sync SRS functional requirements section with project requirements.
        
        Args:
            document: SRS document to sync
            requirements: List of requirement dictionaries
        
        Returns:
            Sync result with updated sections
        """
        try:
            # Find or create functional requirements section
            func_req_section, created = SRSSection.objects.get_or_create(
                document=document,
                section_type='FUNCTIONAL_REQUIREMENTS',
                defaults={
                    'title': '5 Functional Requirements',
                    'content': '',
                    'order': 21,
                }
            )
            
            # Build content from requirements
            content_parts = []
            for req in requirements:
                content_parts.append(f"### {req.get('req_id', 'REQ-XXX')}: {req.get('title', 'Untitled')}")
                content_parts.append(f"{req.get('description', '')}")
                if req.get('acceptance_criteria'):
                    content_parts.append(f"**Acceptance Criteria:** {req.get('acceptance_criteria')}")
                content_parts.append("")
            
            func_req_section.content = "\n".join(content_parts)
            func_req_section.save()
            
            return {
                'success': True,
                'updated_sections': [func_req_section.id],
                'message': f'Synced {len(requirements)} requirements',
            }
        except Exception as e:
            logger.error(f"Requirements sync failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def sync_with_user_stories(document: SRSDocument, user_stories: List[Dict]) -> Dict:
        """
        Sync SRS use cases section with project user stories.
        
        Args:
            document: SRS document to sync
            user_stories: List of user story dictionaries
        
        Returns:
            Sync result with updated sections
        """
        try:
            # Find or create use cases section
            use_cases_section, created = SRSSection.objects.get_or_create(
                document=document,
                section_type='USE_CASES',
                defaults={
                    'title': '9 Use Cases',
                    'content': '',
                    'order': 25,
                }
            )
            
            # Build content from user stories
            content_parts = []
            for story in user_stories:
                content_parts.append(f"### {story.get('title', 'Untitled')}")
                content_parts.append(f"**As a** {story.get('role', 'user')}")
                content_parts.append(f"**I want** {story.get('description', '')}")
                content_parts.append(f"**So that** {story.get('benefit', '')}")
                if story.get('acceptance_criteria'):
                    content_parts.append(f"**Acceptance Criteria:**")
                    for ac in story.get('acceptance_criteria', []):
                        content_parts.append(f"- {ac}")
                content_parts.append("")
            
            use_cases_section.content = "\n".join(content_parts)
            use_cases_section.save()
            
            return {
                'success': True,
                'updated_sections': [use_cases_section.id],
                'message': f'Synced {len(user_stories)} user stories',
            }
        except Exception as e:
            logger.error(f"User stories sync failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def sync_with_stakeholders(document: SRSDocument, stakeholders: List[Dict]) -> Dict:
        """
        Sync SRS audience section with project stakeholders.
        
        Args:
            document: SRS document to sync
            stakeholders: List of stakeholder dictionaries
        
        Returns:
            Sync result with updated sections
        """
        try:
            # Find or create intended audience section
            audience_section, created = SRSSection.objects.get_or_create(
                document=document,
                section_type='INTRODUCTION_AUDIENCE',
                defaults={
                    'title': '1.3 Intended Audience',
                    'content': '',
                    'order': 4,
                }
            )
            
            # Build content from stakeholders
            content_parts = ["This document is intended for the following stakeholders:"]
            for stakeholder in stakeholders:
                content_parts.append(f"- **{stakeholder.get('name', 'Unknown')}** ({stakeholder.get('role', 'N/A')})")
                if stakeholder.get('responsibilities'):
                    content_parts.append(f"  - {stakeholder.get('responsibilities')}")
            
            audience_section.content = "\n".join(content_parts)
            audience_section.save()
            
            return {
                'success': True,
                'updated_sections': [audience_section.id],
                'message': f'Synced {len(stakeholders)} stakeholders',
            }
        except Exception as e:
            logger.error(f"Stakeholders sync failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    @transaction.atomic
    def full_sync(document: SRSDocument, project_data: Dict) -> Dict:
        """
        Perform full sync of SRS document with all available project data.
        
        Args:
            document: SRS document to sync
            project_data: Dictionary containing all project data
        
        Returns:
            Comprehensive sync result
        """
        results = []
        
        if project_data.get('requirements'):
            result = SRSSyncService.sync_with_requirements(
                document, project_data['requirements']
            )
            results.append(result)
        
        if project_data.get('user_stories'):
            result = SRSSyncService.sync_with_user_stories(
                document, project_data['user_stories']
            )
            results.append(result)
        
        if project_data.get('stakeholders'):
            result = SRSSyncService.sync_with_stakeholders(
                document, project_data['stakeholders']
            )
            results.append(result)
        
        successful = sum(1 for r in results if r.get('success'))
        
        return {
            'success': successful == len(results),
            'results': results,
            'message': f'Synced {successful}/{len(results)} data sources',
        }


# Singleton instance
srs_sync_service = SRSSyncService()
