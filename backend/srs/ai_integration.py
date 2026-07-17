"""
AI Integration module for SRS document generation.
Handles AI-powered generation of SRS content from various sources.
"""

from typing import Dict, List, Optional
from django.conf import settings
from asgiref.sync import sync_to_async
import logging

from ai_orchestrator.router import AIRouter
from ai_orchestrator.credit_manager import CreditManager

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered SRS content generation."""
    
    def __init__(self):
        self.api_key = getattr(settings, 'OPENAI_API_KEY', None)
        self.api_url = getattr(settings, 'AI_API_URL', 'https://api.openai.com/v1/chat/completions')
    
    async def generate_srs_from_requirements(
        self,
        requirements: List[Dict],
        project_description: str,
        user_stories: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Generate full IEEE SRS from requirements and project description.
        
        Args:
            requirements: List of requirement dictionaries
            project_description: Project description text
            user_stories: Optional list of user stories
        
        Returns:
            Dictionary with generated SRS sections
        """
        try:
            prompt = self._build_srs_prompt(requirements, project_description, user_stories)
            response = await self._call_ai_api(prompt)
            return self._parse_srs_response(response)
        except Exception as e:
            logger.error(f"AI SRS generation failed: {e}")
            raise
    
    async def generate_section(
        self,
        section_type: str,
        context: Dict,
        existing_content: Optional[str] = None
    ) -> str:
        """
        Generate a specific SRS section.
        
        Args:
            section_type: IEEE section type (e.g., 'INTRODUCTION_PURPOSE')
            context: Context data for generation
            existing_content: Optional existing content to enhance
        
        Returns:
            Generated section content
        """
        try:
            prompt = self._build_section_prompt(section_type, context, existing_content)
            response = await self._call_ai_api(prompt)
            return response.get('content', '')
        except Exception as e:
            logger.error(f"AI section generation failed: {e}")
            raise
    
    async def enhance_section(
        self,
        section_content: str,
        enhancement_type: str,
        context: Optional[Dict] = None
    ) -> str:
        """
        Enhance existing section content.
        
        Args:
            section_content: Current section content
            enhancement_type: Type of enhancement (e.g., 'expand', 'refine', 'format')
            context: Optional context for enhancement
        
        Returns:
            Enhanced section content
        """
        try:
            prompt = self._build_enhancement_prompt(section_content, enhancement_type, context)
            response = await self._call_ai_api(prompt)
            return response.get('content', section_content)
        except Exception as e:
            logger.error(f"AI section enhancement failed: {e}")
            raise
    
    def _build_srs_prompt(
        self,
        requirements: List[Dict],
        project_description: str,
        user_stories: Optional[List[Dict]] = None
    ) -> str:
        """Build prompt for full SRS generation."""
        prompt = f"""
Generate a complete IEEE 830 Software Requirements Specification document based on the following:

Project Description:
{project_description}

Requirements:
{self._format_requirements(requirements)}

"""
        if user_stories:
            prompt += f"""
User Stories:
{self._format_user_stories(user_stories)}
"""
        
        prompt += """
Generate content for all IEEE 830 sections including:
1. Introduction (Purpose, Scope, Audience, Definitions, References, Overview)
2. Overall Description (Perspective, Functions, User Classes, Environment, Constraints, Assumptions)
3. External Interface Requirements (User, Hardware, Software, Communication)
4. System Features
5. Functional Requirements
6. Non-Functional Requirements
7. Database Requirements
8. Data Dictionary
9. Use Cases
10. System Architecture
11. Performance Requirements
12. Security Requirements
13. Risk Analysis
14. Future Enhancements

Format the output as structured JSON with section IDs, types, titles, and content.
"""
        return prompt
    
    def _build_section_prompt(
        self,
        section_type: str,
        context: Dict,
        existing_content: Optional[str] = None
    ) -> str:
        """Build prompt for section generation."""
        section_titles = {
            'INTRODUCTION_PURPOSE': '1.1 Purpose',
            'INTRODUCTION_SCOPE': '1.2 Scope',
            'FUNCTIONAL_REQUIREMENTS': '5 Functional Requirements',
            'NON_FUNCTIONAL_REQUIREMENTS': '6 Non-Functional Requirements',
        }
        
        prompt = f"""
Generate content for IEEE 830 section: {section_titles.get(section_type, section_type)}

Context:
{self._format_context(context)}
"""
        
        if existing_content:
            prompt += f"""
Existing content to enhance:
{existing_content}
"""
        
        return prompt
    
    def _build_enhancement_prompt(
        self,
        section_content: str,
        enhancement_type: str,
        context: Optional[Dict] = None
    ) -> str:
        """Build prompt for content enhancement."""
        instructions = {
            'expand': 'Expand this content with more detail and examples',
            'refine': 'Refine this content for clarity and precision',
            'format': 'Format this content according to IEEE 830 standards',
        }
        
        prompt = f"""
{instructions.get(enhancement_type, 'Enhance this content')}

Content:
{section_content}
"""
        
        if context:
            prompt += f"\nContext:\n{self._format_context(context)}"
        
        return prompt
    
    async def _call_ai_api(self, prompt: str, feature_name: str = "IEEE_SRS", organization=None, user=None) -> Dict:
        """Call AI API via AIRouter."""
        # 1. Fetch config synchronously via sync_to_async
        feature_config = await sync_to_async(CreditManager.validate_request)(
            organization=organization, 
            feature_name=feature_name
        ) if organization else None
        
        router = AIRouter()
        # 2. Generate response via AIRouter
        # We need to wrap it in sync_to_async because router accesses DB models (API configs)
        result = await sync_to_async(router.generate)(
            feature_config=feature_config,
            prompt=prompt
        )
        content, in_tokens, out_tokens, est_cost, latency, provider, model, status = result
        
        # 3. Deduct credits
        if organization:
            await sync_to_async(CreditManager.deduct_credits)(
                organization=organization,
                user=user,
                feature_name=feature_name,
                provider=provider,
                model=model,
                input_tokens=in_tokens,
                output_tokens=out_tokens,
                estimated_cost=est_cost,
                latency=latency,
                status=status
            )
            
        return {
            'content': content,
            'tokens_used': in_tokens + out_tokens,
        }
    
    def _parse_srs_response(self, response: Dict) -> Dict:
        """Parse AI response into SRS structure."""
        # Placeholder for parsing logic
        return {
            'sections': [],
            'metadata': {
                'ai_credits_used': response.get('tokens_used', 0),
            }
        }
    
    def _format_requirements(self, requirements: List[Dict]) -> str:
        """Format requirements for prompt."""
        formatted = []
        for req in requirements:
            formatted.append(f"- {req.get('title', 'Untitled')}: {req.get('description', '')}")
        return '\n'.join(formatted)
    
    def _format_user_stories(self, user_stories: List[Dict]) -> str:
        """Format user stories for prompt."""
        formatted = []
        for story in user_stories:
            formatted.append(f"- {story.get('title', 'Untitled')}: {story.get('description', '')}")
        return '\n'.join(formatted)
    
    def _format_context(self, context: Dict) -> str:
        """Format context for prompt."""
        formatted = []
        for key, value in context.items():
            formatted.append(f"{key}: {value}")
        return '\n'.join(formatted)


# Singleton instance
ai_service = AIService()
