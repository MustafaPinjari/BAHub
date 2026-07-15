"""
Collaboration module for SRS documents.
Handles comments, mentions, and approval workflow.
"""

from typing import Dict, List, Optional
from django.db import transaction
from django.contrib.auth import get_user_model
from .models import SRSDocument, SRSComment, SRSApproval
import logging
import re

logger = logging.getLogger(__name__)
User = get_user_model()


class CollaborationService:
    """Service for managing SRS document collaboration."""
    
    @staticmethod
    def add_comment(
        document: SRSDocument,
        content: str,
        author,
        section_id: Optional[str] = None,
        parent_comment_id: Optional[str] = None
    ) -> SRSComment:
        """
        Add a comment to a document or section.
        
        Args:
            document: SRS document
            content: Comment content
            author: User creating the comment
            section_id: Optional section ID for section-specific comments
            parent_comment_id: Optional parent comment ID for replies
        
        Returns:
            Created SRSComment instance
        """
        try:
            comment = SRSComment.objects.create(
                document=document,
                section_id=section_id,
                parent_comment_id=parent_comment_id,
                author=author,
                content=content
            )
            
            # Process mentions
            mentions = CollaborationService._extract_mentions(content)
            CollaborationService._notify_mentioned_users(mentions, document, author)
            
            logger.info(f"Comment added to document {document.id} by {author.username}")
            return comment
        except Exception as e:
            logger.error(f"Comment creation failed: {e}")
            raise
    
    @staticmethod
    def resolve_comment(comment: SRSComment, resolved_by) -> Dict:
        """
        Resolve a comment.
        
        Args:
            comment: Comment to resolve
            resolved_by: User resolving the comment
        
        Returns:
            Resolution result
        """
        try:
            comment.is_resolved = True
            comment.resolved_by = resolved_by
            comment.resolved_at = None
            comment.save()
            
            return {
                'success': True,
                'message': 'Comment resolved',
            }
        except Exception as e:
            logger.error(f"Comment resolution failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def get_comments(
        document: SRSDocument,
        section_id: Optional[str] = None,
        include_resolved: bool = True
    ) -> List[Dict]:
        """
        Get comments for a document or section.
        
        Args:
            document: SRS document
            section_id: Optional section ID to filter by
            include_resolved: Whether to include resolved comments
        
        Returns:
            List of comment dictionaries
        """
        try:
            queryset = SRSComment.objects.filter(document=document)
            
            if section_id:
                queryset = queryset.filter(section_id=section_id)
            
            if not include_resolved:
                queryset = queryset.filter(is_resolved=False)
            
            queryset = queryset.select_related('author', 'resolved_by').order_by('-created_at')
            
            comments = []
            for comment in queryset:
                comments.append({
                    'id': str(comment.id),
                    'content': comment.content,
                    'author': comment.author.username if comment.author else 'Unknown',
                    'author_id': str(comment.author.id) if comment.author else None,
                    'section_id': str(comment.section_id) if comment.section_id else None,
                    'parent_comment_id': str(comment.parent_comment_id) if comment.parent_comment_id else None,
                    'is_resolved': comment.is_resolved,
                    'resolved_by': comment.resolved_by.username if comment.resolved_by else None,
                    'resolved_at': comment.resolved_at.isoformat() if comment.resolved_at else None,
                    'created_at': comment.created_at.isoformat(),
                })
            
            return comments
        except Exception as e:
            logger.error(f"Comments retrieval failed: {e}")
            return []
    
    @staticmethod
    def request_approval(
        document: SRSDocument,
        reviewer_ids: List[str],
        requested_by
    ) -> Dict:
        """
        Request approval from reviewers.
        
        Args:
            document: SRS document
            reviewer_ids: List of user IDs to request approval from
            requested_by: User requesting approval
        
        Returns:
            Approval request result
        """
        try:
            created_approvals = []
            
            for reviewer_id in reviewer_ids:
                approval, created = SRSApproval.objects.get_or_create(
                    document=document,
                    reviewer_id=reviewer_id,
                    defaults={'status': 'PENDING'}
                )
                if created:
                    created_approvals.append(str(approval.id))
            
            # Notify reviewers
            CollaborationService._notify_reviewers(document, reviewer_ids, requested_by)
            
            return {
                'success': True,
                'created_approvals': created_approvals,
                'message': f'Approval requested from {len(created_approvals)} reviewers',
            }
        except Exception as e:
            logger.error(f"Approval request failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def approve_document(
        document: SRSDocument,
        reviewer,
        status: str,
        comments: str = ''
    ) -> Dict:
        """
        Approve or reject a document.
        
        Args:
            document: SRS document
            reviewer: User providing approval/rejection
            status: Approval status (APPROVED, REJECTED, CHANGES_REQUESTED)
            comments: Optional comments
        
        Returns:
            Approval result
        """
        try:
            approval, created = SRSApproval.objects.get_or_create(
                document=document,
                reviewer=reviewer,
                defaults={'status': status, 'comments': comments}
            )
            
            if not created:
                approval.status = status
                approval.comments = comments
                approval.reviewed_at = None
                approval.save()
            
            # Check if all reviewers have approved
            all_approvals = SRSApproval.objects.filter(document=document)
            approved_count = all_approvals.filter(status='APPROVED').count()
            
            if approved_count == all_approvals.count() and approved_count > 0:
                document.status = 'APPROVED'
                document.save()
            
            logger.info(f"Document {document.id} {status.lower()} by {reviewer.username}")
            return {
                'success': True,
                'status': status,
                'message': f'Document {status.lower()}',
            }
        except Exception as e:
            logger.error(f"Document approval failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @staticmethod
    def get_approval_status(document: SRSDocument) -> Dict:
        """
        Get approval status for a document.
        
        Args:
            document: SRS document
        
        Returns:
            Approval status information
        """
        try:
            approvals = SRSApproval.objects.filter(document=document).select_related('reviewer')
            
            approval_details = []
            for approval in approvals:
                approval_details.append({
                    'reviewer': approval.reviewer.username if approval.reviewer else 'Unknown',
                    'reviewer_id': str(approval.reviewer.id) if approval.reviewer else None,
                    'status': approval.status,
                    'comments': approval.comments,
                    'reviewed_at': approval.reviewed_at.isoformat() if approval.reviewed_at else None,
                })
            
            all_approvals = SRSApproval.objects.filter(document=document)
            approved_count = all_approvals.filter(status='APPROVED').count()
            total_count = all_approvals.count()
            
            return {
                'approvals': approval_details,
                'approved_count': approved_count,
                'total_count': total_count,
                'is_fully_approved': approved_count == total_count and total_count > 0,
            }
        except Exception as e:
            logger.error(f"Approval status retrieval failed: {e}")
            return {
                'approvals': [],
                'approved_count': 0,
                'total_count': 0,
                'is_fully_approved': False,
            }
    
    @staticmethod
    def _extract_mentions(content: str) -> List[str]:
        """Extract @mentions from comment content."""
        mention_pattern = r'@(\w+)'
        mentions = re.findall(mention_pattern, content)
        return list(set(mentions))
    
    @staticmethod
    def _notify_mentioned_users(mentions: List[str], document: SRSDocument, author):
        """Notify users mentioned in comments."""
        # Placeholder for notification logic
        # In production, integrate with notification system
        pass
    
    @staticmethod
    def _notify_reviewers(document: SRSDocument, reviewer_ids: List[str], requested_by):
        """Notify reviewers of approval request."""
        # Placeholder for notification logic
        # In production, integrate with notification system
        pass


# Singleton instance
collaboration_service = CollaborationService()
