"""
Linking module for SRS documents.
Handles linking SRS documents and sections to other BAHub entities.
"""

from typing import Dict, List, Optional
from django.db import transaction
from .models import SRSDocument, SRSSection
import logging

logger = logging.getLogger(__name__)


class SRSLinkingService:
    """Service for linking SRS documents to other entities."""
    
    @staticmethod
    def link_to_requirement(section: SRSSection, requirement_id: str, requirement_title: str) -> Dict:
        """
        Link an SRS section to a requirement.
        
        Args:
            section: SRS section to link
            requirement_id: ID of the requirement
            requirement_title: Title of the requirement
        
        Returns:
            Link result
        """
        try:
            # Add link reference to section content
            link_markdown = f"[REQ-{requirement_id}: {requirement_title}](/requirements/{requirement_id})"
            
            if link_markdown not in section.content:
                section.content += f"\n\n**Related Requirement:** {link_markdown}"
                section.save()
            
            return {
                'success': True,
                'message': f'Section linked to requirement {requirement_id}',
            }
        except Exception as e:
            logger.error(f"Requirement linking failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def link_to_user_story(section: SRSSection, story_id: str, story_title: str) -> Dict:
        """
        Link an SRS section to a user story.
        
        Args:
            section: SRS section to link
            story_id: ID of the user story
            story_title: Title of the user story
        
        Returns:
            Link result
        """
        try:
            link_markdown = f"[Story: {story_title}](/stories/{story_id})"
            
            if link_markdown not in section.content:
                section.content += f"\n\n**Related User Story:** {link_markdown}"
                section.save()
            
            return {
                'success': True,
                'message': f'Section linked to user story {story_id}',
            }
        except Exception as e:
            logger.error(f"User story linking failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def link_to_project(document: SRSDocument, project_id: str) -> Dict:
        """
        Link an SRS document to a project.
        
        Args:
            document: SRS document to link
            project_id: ID of the project
        
        Returns:
            Link result
        """
        try:
            from projects.models import Project
            
            project = Project.objects.get(id=project_id)
            document.project = project
            document.save()
            
            return {
                'success': True,
                'message': f'Document linked to project {project.name}',
            }
        except Project.DoesNotExist:
            return {
                'success': False,
                'error': 'Project not found',
            }
        except Exception as e:
            logger.error(f"Project linking failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def link_to_stakeholder(section: SRSSection, stakeholder_id: str, stakeholder_name: str) -> Dict:
        """
        Link an SRS section to a stakeholder.
        
        Args:
            section: SRS section to link
            stakeholder_id: ID of the stakeholder
            stakeholder_name: Name of the stakeholder
        
        Returns:
            Link result
        """
        try:
            link_markdown = f"[Stakeholder: {stakeholder_name}](/stakeholders/{stakeholder_id})"
            
            if link_markdown not in section.content:
                section.content += f"\n\n**Stakeholder:** {link_markdown}"
                section.save()
            
            return {
                'success': True,
                'message': f'Section linked to stakeholder {stakeholder_id}',
            }
        except Exception as e:
            logger.error(f"Stakeholder linking failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def link_to_risk(section: SRSSection, risk_id: str, risk_title: str) -> Dict:
        """
        Link an SRS section to a risk.
        
        Args:
            section: SRS section to link
            risk_id: ID of the risk
            risk_title: Title of the risk
        
        Returns:
            Link result
        """
        try:
            link_markdown = f"[Risk: {risk_title}](/risks/{risk_id})"
            
            if link_markdown not in section.content:
                section.content += f"\n\n**Related Risk:** {link_markdown}"
                section.save()
            
            return {
                'success': True,
                'message': f'Section linked to risk {risk_id}',
            }
        except Exception as e:
            logger.error(f"Risk linking failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def link_to_meeting(section: SRSSection, meeting_id: str, meeting_title: str) -> Dict:
        """
        Link an SRS section to a meeting.
        
        Args:
            section: SRS section to link
            meeting_id: ID of the meeting
            meeting_title: Title of the meeting
        
        Returns:
            Link result
        """
        try:
            link_markdown = f"[Meeting: {meeting_title}](/meetings/{meeting_id})"
            
            if link_markdown not in section.content:
                section.content += f"\n\n**Related Meeting:** {link_markdown}"
                section.save()
            
            return {
                'success': True,
                'message': f'Section linked to meeting {meeting_id}',
            }
        except Exception as e:
            logger.error(f"Meeting linking failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def get_linked_entities(document: SRSDocument) -> Dict:
        """
        Get all entities linked to an SRS document.
        
        Args:
            document: SRS document
        
        Returns:
            Dictionary of linked entities by type
        """
        try:
            linked_entities = {
                'requirements': [],
                'user_stories': [],
                'stakeholders': [],
                'risks': [],
                'meetings': [],
            }
            
            # Parse section content for links
            for section in document.sections.all():
                content = section.content
                
                # Extract requirement links
                import re
                req_matches = re.findall(r'\[REQ-([^\]]+)\]', content)
                for match in req_matches:
                    linked_entities['requirements'].append(match)
                
                # Extract story links
                story_matches = re.findall(r'\[Story: ([^\]]+)\]', content)
                for match in story_matches:
                    linked_entities['user_stories'].append(match)
                
                # Extract stakeholder links
                stakeholder_matches = re.findall(r'\[Stakeholder: ([^\]]+)\]', content)
                for match in stakeholder_matches:
                    linked_entities['stakeholders'].append(match)
            
            return linked_entities
        except Exception as e:
            logger.error(f"Linked entities retrieval failed: {e}")
            return {
                'requirements': [],
                'user_stories': [],
                'stakeholders': [],
                'risks': [],
                'meetings': [],
            }


# Singleton instance
srs_linking_service = SRSLinkingService()
