from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, Avg
from .models import Template, TemplateReview
from .serializers import TemplateSerializer, TemplateReviewSerializer, PublicTemplateSerializer
from core.responses import api_success, api_error
from core.exceptions import ValidationError


class TemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing templates."""
    
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return Template.objects.none()
        
        queryset = Template.objects.filter(organization_id=user.organization_id)
        
        # Filter by category if provided
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create a new template for the user's organization."""
        serializer.save(
            created_by=self.request.user,
            organization=self.request.user.organization
        )
    
    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """Publish a template to the public gallery."""
        template = self.get_object()
        
        if template.status != Template.Status.DRAFT:
            return api_error(message="Only draft templates can be published.")
        
        from django.utils import timezone
        template.status = Template.Status.PUBLISHED
        template.published_at = timezone.now()
        template.save()
        
        return api_success(data=TemplateSerializer(template).data, message="Template published successfully.")
    
    @action(detail=True, methods=['post'], url_path='fork')
    def fork(self, request, pk=None):
        """Fork a public template to the user's organization."""
        template = self.get_object()
        
        if template.status != Template.Status.PUBLISHED:
            return api_error(message="Can only fork published templates.")
        
        # Create a copy of the template
        new_template = Template.objects.create(
            name=f"{template.name} (Copy)",
            description=template.description,
            category=template.category,
            content=template.content,
            tags=template.tags,
            difficulty=template.difficulty,
            estimated_time=template.estimated_time,
            created_by=request.user,
            organization=request.user.organization,
            status=Template.Status.DRAFT
        )
        
        # Increment fork count on original
        template.forks_count += 1
        template.save(update_fields=['forks_count'])
        
        return api_success(data=TemplateSerializer(new_template).data, message="Template forked successfully.")
    
    @action(detail=True, methods=['post'], url_path='use')
    def use_template(self, request, pk=None):
        """Record usage of a template."""
        template = self.get_object()
        template.increment_uses()
        return api_success(message="Template usage recorded.")


class PublicTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for browsing public template gallery."""
    
    serializer_class = PublicTemplateSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Template.objects.filter(status=Template.Status.PUBLISHED)
        
        # Filter by category if provided
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by difficulty if provided
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # Search by name or description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Sort by various criteria
        sort_by = self.request.query_params.get('sort', 'popular')
        if sort_by == 'popular':
            queryset = queryset.order_by('-views_count', '-uses_count')
        elif sort_by == 'newest':
            queryset = queryset.order_by('-published_at')
        elif sort_by == 'rating':
            queryset = queryset.annotate(
                avg_rating=Avg('reviews__rating')
            ).order_by('-avg_rating')
        
        return queryset
    
    @action(detail=True, methods=['get'], url_path='view')
    def view_template(self, request, pk=None):
        """Increment view counter for template."""
        template = self.get_object()
        template.increment_views()
        serializer = self.get_serializer(template)
        return api_success(data=serializer.data, message="Template viewed.")


class TemplateReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for managing template reviews."""
    
    serializer_class = TemplateReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TemplateReview.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create a new review."""
        template_id = self.request.data.get('template')
        template = Template.objects.get(id=template_id)
        
        if template.status != Template.Status.PUBLISHED:
            raise ValidationError("Can only review published templates.")
        
        serializer.save(user=self.request.user, template=template)
    
    @action(detail=False, methods=['get'], url_path='template/(?P<template_id>[^/.]+)')
    def template_reviews(self, request, template_id=None):
        """Get all reviews for a specific template."""
        try:
            template = Template.objects.get(id=template_id)
            reviews = TemplateReview.objects.filter(template=template)
            serializer = TemplateReviewSerializer(reviews, many=True)
            return api_success(data=serializer.data, message="Reviews retrieved successfully.")
        except Template.DoesNotExist:
            return api_error(message="Template not found.", status_code=404)
