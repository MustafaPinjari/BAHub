from rest_framework import serializers
from .models import Template, TemplateReview


class TemplateSerializer(serializers.ModelSerializer):
    """Serializer for templates."""
    
    author_username = serializers.CharField(source='created_by.username', read_only=True)
    author_organization = serializers.CharField(source='organization.name', read_only=True)
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Template
        fields = [
            'id', 'name', 'description', 'category', 'status',
            'content', 'views_count', 'uses_count', 'forks_count',
            'author_username', 'author_organization',
            'tags', 'difficulty', 'estimated_time',
            'average_rating', 'reviews_count',
            'created_at', 'updated_at', 'published_at'
        ]
        read_only_fields = [
            'id', 'views_count', 'uses_count', 'forks_count',
            'created_at', 'updated_at', 'published_at'
        ]
    
    def get_average_rating(self, obj):
        """Calculate average rating from reviews."""
        reviews = obj.reviews.all()
        if not reviews.exists():
            return None
        return sum(review.rating for review in reviews) / reviews.count()
    
    def get_reviews_count(self, obj):
        """Get total number of reviews."""
        return obj.reviews.count()


class TemplateReviewSerializer(serializers.ModelSerializer):
    """Serializer for template reviews."""
    
    reviewer_username = serializers.CharField(source='user.username', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = TemplateReview
        fields = [
            'id', 'rating', 'comment', 'reviewer_username',
            'template_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PublicTemplateSerializer(serializers.ModelSerializer):
    """Simplified serializer for public template gallery."""
    
    author_username = serializers.CharField(source='created_by.username', read_only=True)
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Template
        fields = [
            'id', 'name', 'description', 'category',
            'views_count', 'uses_count', 'forks_count',
            'author_username', 'tags', 'difficulty',
            'estimated_time', 'average_rating',
            'published_at'
        ]
    
    def get_average_rating(self, obj):
        """Calculate average rating from reviews."""
        reviews = obj.reviews.all()
        if not reviews.exists():
            return None
        return round(sum(review.rating for review in reviews) / reviews.count(), 1)
