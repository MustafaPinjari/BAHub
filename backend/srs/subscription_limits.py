"""
Subscription limits module for SRS documents.
Enforces plan-based limits (FREE vs PRO) for SRS features.
"""

from typing import Dict
from django.core.exceptions import ValidationError
from .models import SRSDocument
import logging

logger = logging.getLogger(__name__)


class SRSSubscriptionLimits:
    """Service for enforcing SRS subscription limits."""
    
    # Plan limits configuration
    PLAN_LIMITS = {
        'FREE': {
            'max_documents': 2,
            'max_ai_generations': 5,
            'max_sections_per_document': 50,
            'max_collaborators': 3,
            'export_formats': ['MARKDOWN', 'JSON'],
            'import_formats': ['MARKDOWN'],
            'ai_generation': True,
            'version_control': True,
            'collaboration': True,
        },
        'PRO': {
            'max_documents': 50,
            'max_ai_generations': 100,
            'max_sections_per_document': 200,
            'max_collaborators': 20,
            'export_formats': ['PDF', 'DOCX', 'MARKDOWN', 'HTML', 'JSON'],
            'import_formats': ['DOCX', 'MARKDOWN', 'PDF'],
            'ai_generation': True,
            'version_control': True,
            'collaboration': True,
        },
        'ENTERPRISE': {
            'max_documents': -1,  # Unlimited
            'max_ai_generations': -1,  # Unlimited
            'max_sections_per_document': -1,  # Unlimited
            'max_collaborators': -1,  # Unlimited
            'export_formats': ['PDF', 'DOCX', 'MARKDOWN', 'HTML', 'JSON'],
            'import_formats': ['DOCX', 'MARKDOWN', 'PDF'],
            'ai_generation': True,
            'version_control': True,
            'collaboration': True,
        },
    }
    
    @staticmethod
    def get_user_plan(user) -> str:
        """
        Get user's subscription plan.
        
        Args:
            user: User to check
        
        Returns:
            Plan tier string (FREE, PRO, ENTERPRISE)
        """
        try:
            from billing.models import TenantSubscription
            
            if not hasattr(user, 'organization') or not user.organization:
                return 'FREE'
            
            subscription = TenantSubscription.objects.filter(
                organization=user.organization
            ).first()
            
            if subscription:
                return subscription.plan_tier
            
            return 'FREE'
        except Exception as e:
            logger.error(f"Error getting user plan: {e}")
            return 'FREE'
    
    @staticmethod
    def can_create_document(user) -> Dict:
        """
        Check if user can create a new SRS document.
        
        Args:
            user: User to check
        
        Returns:
            Dictionary with permission status and details
        """
        try:
            plan = SRSSubscriptionLimits.get_user_plan(user)
            limits = SRSSubscriptionLimits.PLAN_LIMITS.get(plan, SRSSubscriptionLimits.PLAN_LIMITS['FREE'])
            
            max_docs = limits['max_documents']
            
            # Unlimited for enterprise
            if max_docs == -1:
                return {
                    'can_create': True,
                    'plan': plan,
                    'current_count': 0,
                    'max_count': 'unlimited',
                }
            
            if not hasattr(user, 'organization') or not user.organization:
                return {
                    'can_create': False,
                    'plan': plan,
                    'reason': 'No organization membership',
                }
            
            current_count = SRSDocument.objects.filter(
                project__organization_id=user.organization_id
            ).count()
            
            can_create = current_count < max_docs
            
            return {
                'can_create': can_create,
                'plan': plan,
                'current_count': current_count,
                'max_count': max_docs,
                'reason': 'Document limit reached' if not can_create else None,
            }
        except Exception as e:
            logger.error(f"Error checking document creation limit: {e}")
            return {
                'can_create': False,
                'plan': 'FREE',
                'reason': 'Error checking limits',
            }
    
    @staticmethod
    def can_use_ai_generation(user) -> Dict:
        """
        Check if user can use AI generation.
        
        Args:
            user: User to check
        
        Returns:
            Dictionary with permission status and details
        """
        try:
            plan = SRSSubscriptionLimits.get_user_plan(user)
            limits = SRSSubscriptionLimits.PLAN_LIMITS.get(plan, SRSSubscriptionLimits.PLAN_LIMITS['FREE'])
            
            if not limits['ai_generation']:
                return {
                    'can_generate': False,
                    'plan': plan,
                    'reason': 'AI generation not available in your plan',
                }
            
            max_generations = limits['max_ai_generations']
            
            # Unlimited for enterprise
            if max_generations == -1:
                return {
                    'can_generate': True,
                    'plan': plan,
                    'current_count': 0,
                    'max_count': 'unlimited',
                }
            
            from .models import AIGenerationHistory
            
            current_count = AIGenerationHistory.objects.filter(
                document__project__organization_id=user.organization_id,
                generated_by=user
            ).count()
            
            can_generate = current_count < max_generations
            
            return {
                'can_generate': can_generate,
                'plan': plan,
                'current_count': current_count,
                'max_count': max_generations,
                'reason': 'AI generation limit reached' if not can_generate else None,
            }
        except Exception as e:
            logger.error(f"Error checking AI generation limit: {e}")
            return {
                'can_generate': False,
                'plan': 'FREE',
                'reason': 'Error checking limits',
            }
    
    @staticmethod
    def can_export_format(user, format: str) -> Dict:
        """
        Check if user can export to a specific format.
        
        Args:
            user: User to check
            format: Export format to check
        
        Returns:
            Dictionary with permission status
        """
        try:
            plan = SRSSubscriptionLimits.get_user_plan(user)
            limits = SRSSubscriptionLimits.PLAN_LIMITS.get(plan, SRSSubscriptionLimits.PLAN_LIMITS['FREE'])
            
            allowed_formats = limits['export_formats']
            
            can_export = format in allowed_formats
            
            return {
                'can_export': can_export,
                'plan': plan,
                'format': format,
                'allowed_formats': allowed_formats,
                'reason': f'{format} export not available in your plan' if not can_export else None,
            }
        except Exception as e:
            logger.error(f"Error checking export format limit: {e}")
            return {
                'can_export': False,
                'plan': 'FREE',
                'format': format,
                'reason': 'Error checking limits',
            }
    
    @staticmethod
    def can_import_format(user, format: str) -> Dict:
        """
        Check if user can import from a specific format.
        
        Args:
            user: User to check
            format: Import format to check
        
        Returns:
            Dictionary with permission status
        """
        try:
            plan = SRSSubscriptionLimits.get_user_plan(user)
            limits = SRSSubscriptionLimits.PLAN_LIMITS.get(plan, SRSSubscriptionLimits.PLAN_LIMITS['FREE'])
            
            allowed_formats = limits['import_formats']
            
            can_import = format in allowed_formats
            
            return {
                'can_import': can_import,
                'plan': plan,
                'format': format,
                'allowed_formats': allowed_formats,
                'reason': f'{format} import not available in your plan' if not can_import else None,
            }
        except Exception as e:
            logger.error(f"Error checking import format limit: {e}")
            return {
                'can_import': False,
                'plan': 'FREE',
                'format': format,
                'reason': 'Error checking limits',
            }
    
    @staticmethod
    def get_plan_features(user) -> Dict:
        """
        Get all available features for user's plan.
        
        Args:
            user: User to check
        
        Returns:
            Dictionary of available features
        """
        try:
            plan = SRSSubscriptionLimits.get_user_plan(user)
            limits = SRSSubscriptionLimits.PLAN_LIMITS.get(plan, SRSSubscriptionLimits.PLAN_LIMITS['FREE'])
            
            return {
                'plan': plan,
                'features': {
                    'max_documents': limits['max_documents'],
                    'max_ai_generations': limits['max_ai_generations'],
                    'max_sections_per_document': limits['max_sections_per_document'],
                    'max_collaborators': limits['max_collaborators'],
                    'export_formats': limits['export_formats'],
                    'import_formats': limits['import_formats'],
                    'ai_generation': limits['ai_generation'],
                    'version_control': limits['version_control'],
                    'collaboration': limits['collaboration'],
                },
            }
        except Exception as e:
            logger.error(f"Error getting plan features: {e}")
            return {
                'plan': 'FREE',
                'features': SRSSubscriptionLimits.PLAN_LIMITS['FREE'],
            }


# Singleton instance
srs_subscription_limits = SRSSubscriptionLimits()
