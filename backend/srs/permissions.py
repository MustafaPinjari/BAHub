"""
Permissions module for SRS documents.
Handles role-based access control (Owner, Editor, Reviewer, Viewer).
"""

from rest_framework import permissions
from .models import SRSDocument, SRSSection


class IsSRSOwnerOrEditor(permissions.BasePermission):
    """
    Permission class for SRS documents.
    Allows access to document owners and editors.
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Document creator is always the owner
        if isinstance(obj, SRSDocument):
            if obj.created_by == request.user:
                return True
            
            # Check if user has editor role through organization
            if hasattr(request.user, 'organization') and obj.project:
                if obj.project.organization == request.user.organization:
                    # Organization members can edit
                    return True
        
        # For sections, check parent document permissions
        if isinstance(obj, SRSSection):
            return self.has_object_permission(request, view, obj.document)
        
        return False


class IsSRSOwnerOrReviewer(permissions.BasePermission):
    """
    Permission class for SRS approval workflow.
    Allows access to document owners and assigned reviewers.
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Document creator is always the owner
        if isinstance(obj, SRSDocument):
            if obj.created_by == request.user:
                return True
            
            # Check if user is an assigned reviewer
            from .models import SRSApproval
            if SRSApproval.objects.filter(
                document=obj,
                reviewer=request.user
            ).exists():
                return True
        
        return False


class IsSRSViewer(permissions.BasePermission):
    """
    Permission class for SRS read access.
    Allows read access to organization members.
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Document creator
        if isinstance(obj, SRSDocument):
            if obj.created_by == request.user:
                return True
            
            # Organization members can view
            if hasattr(request.user, 'organization') and obj.project:
                if obj.project.organization == request.user.organization:
                    return True
        
        # For sections, check parent document permissions
        if isinstance(obj, SRSSection):
            return self.has_object_permission(request, view, obj.document)
        
        return False


class SRSPermissionService:
    """Service for managing SRS document permissions."""
    
    @staticmethod
    def get_user_role(document: SRSDocument, user) -> str:
        """
        Get user's role for a document.
        
        Args:
            document: SRS document
            user: User to check
        
        Returns:
            Role string (OWNER, EDITOR, REVIEWER, VIEWER)
        """
        if not user.is_authenticated:
            return 'VIEWER'
        
        # Document creator is owner
        if document.created_by == user:
            return 'OWNER'
        
        # Check if assigned reviewer
        from .models import SRSApproval
        if SRSApproval.objects.filter(
            document=document,
            reviewer=user
        ).exists():
            return 'REVIEWER'
        
        # Organization members are editors
        if hasattr(user, 'organization') and document.project:
            if document.project.organization == user.organization:
                return 'EDITOR'
        
        return 'VIEWER'
    
    @staticmethod
    def can_edit(document: SRSDocument, user) -> bool:
        """
        Check if user can edit document.
        
        Args:
            document: SRS document
            user: User to check
        
        Returns:
            Boolean indicating edit permission
        """
        role = SRSPermissionService.get_user_role(document, user)
        return role in ['OWNER', 'EDITOR']
    
    @staticmethod
    def can_review(document: SRSDocument, user) -> bool:
        """
        Check if user can review document.
        
        Args:
            document: SRS document
            user: User to check
        
        Returns:
            Boolean indicating review permission
        """
        role = SRSPermissionService.get_user_role(document, user)
        return role in ['OWNER', 'EDITOR', 'REVIEWER']
    
    @staticmethod
    def can_view(document: SRSDocument, user) -> bool:
        """
        Check if user can view document.
        
        Args:
            document: SRS document
            user: User to check
        
        Returns:
            Boolean indicating view permission
        """
        if not user.is_authenticated:
            return False
        
        role = SRSPermissionService.get_user_role(document, user)
        return role in ['OWNER', 'EDITOR', 'REVIEWER', 'VIEWER']
    
    @staticmethod
    def can_delete(document: SRSDocument, user) -> bool:
        """
        Check if user can delete document.
        
        Args:
            document: SRS document
            user: User to check
        
        Returns:
            Boolean indicating delete permission
        """
        role = SRSPermissionService.get_user_role(document, user)
        return role == 'OWNER'
    
    @staticmethod
    def assign_reviewer(document: SRSDocument, reviewer, assigned_by) -> Dict:
        """
        Assign a user as reviewer for a document.
        
        Args:
            document: SRS document
            reviewer: User to assign as reviewer
            assigned_by: User making the assignment
        
        Returns:
            Assignment result
        """
        try:
            from .models import SRSApproval
            
            # Only owners can assign reviewers
            if document.created_by != assigned_by:
                return {
                    'success': False,
                    'error': 'Only document owners can assign reviewers',
                }
            
            approval, created = SRSApproval.objects.get_or_create(
                document=document,
                reviewer=reviewer,
                defaults={'status': 'PENDING'}
            )
            
            return {
                'success': True,
                'message': f'Reviewer assigned successfully',
                'already_assigned': not created,
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def remove_reviewer(document: SRSDocument, reviewer, removed_by) -> Dict:
        """
        Remove a reviewer from a document.
        
        Args:
            document: SRS document
            reviewer: User to remove as reviewer
            removed_by: User removing the reviewer
        
        Returns:
            Removal result
        """
        try:
            from .models import SRSApproval
            
            # Only owners can remove reviewers
            if document.created_by != removed_by:
                return {
                    'success': False,
                    'error': 'Only document owners can remove reviewers',
                }
            
            approval = SRSApproval.objects.filter(
                document=document,
                reviewer=reviewer
            ).first()
            
            if approval:
                approval.delete()
                return {
                    'success': True,
                    'message': 'Reviewer removed successfully',
                }
            else:
                return {
                    'success': False,
                    'error': 'Reviewer not found',
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }


# Singleton instance
srs_permission_service = SRSPermissionService()
