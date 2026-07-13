from rest_framework import serializers
from .models import ReferralCode, Referral


class ReferralCodeSerializer(serializers.ModelSerializer):
    """Serializer for referral codes."""
    
    referral_link = serializers.SerializerMethodField()
    remaining_uses = serializers.SerializerMethodField()
    
    class Meta:
        model = ReferralCode
        fields = [
            'id', 'code', 'status', 'credits_earned', 
            'max_uses', 'uses_count', 'expires_at', 
            'referral_link', 'remaining_uses'
        ]
        read_only_fields = ['id', 'code', 'credits_earned', 'uses_count']
    
    def get_referral_link(self, obj):
        """Generate the full referral link."""
        from django.conf import settings
        base_url = getattr(settings, 'FRONTEND_URL', 'https://bahub.app')
        return f"{base_url}/register?ref={obj.code}"
    
    def get_remaining_uses(self, obj):
        """Calculate remaining uses."""
        return max(0, obj.max_uses - obj.uses_count)


class ReferralSerializer(serializers.ModelSerializer):
    """Serializer for referral records."""
    
    referrer_username = serializers.CharField(source='referral_code.user.username', read_only=True)
    referred_user_email = serializers.CharField(source='referred_user.email', read_only=True)
    
    class Meta:
        model = Referral
        fields = [
            'id', 'status', 'credits_awarded', 'completed_at', 
            'created_at', 'referrer_username', 'referred_user_email'
        ]
        read_only_fields = ['id', 'credits_awarded', 'completed_at']


class ValidateReferralCodeSerializer(serializers.Serializer):
    """Serializer for validating referral codes during registration."""
    code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    
    def validate_code(self, value):
        """Validate the referral code if provided."""
        if not value:
            return None
        
        try:
            referral_code = ReferralCode.objects.get(code=value.upper())
            if not referral_code.is_valid():
                raise serializers.ValidationError("This referral code is invalid or expired.")
            return value.upper()
        except ReferralCode.DoesNotExist:
            raise serializers.ValidationError("Invalid referral code.")
