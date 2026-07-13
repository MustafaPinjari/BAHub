from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from .models import ReferralCode, Referral
from .serializers import ReferralCodeSerializer, ReferralSerializer, ValidateReferralCodeSerializer
from core.responses import api_success, api_error


class ReferralCodeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user referral codes."""
    
    serializer_class = ReferralCodeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ReferralCode.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Generate a new referral code for the user."""
        code = ReferralCode.generate_code(self.request.user)
        serializer.instance = code
    
    @action(detail=False, methods=['get'], url_path='my-code')
    def get_my_code(self, request):
        """Get or create the user's referral code."""
        code = ReferralCode.objects.filter(user=request.user).first()
        if not code:
            code = ReferralCode.generate_code(request.user)
        serializer = self.get_serializer(code)
        return api_success(data=serializer.data, message="Referral code retrieved successfully.")
    
    @action(detail=False, methods=['get'], url_path='my-referrals')
    def get_my_referrals(self, request):
        """Get all referrals made by the user."""
        referrals = Referral.objects.filter(referral_code__user=request.user)
        serializer = ReferralSerializer(referrals, many=True)
        return api_success(data=serializer.data, message="Referrals retrieved successfully.")
    
    @action(detail=False, methods=['post'], url_path='validate')
    def validate_code(self, request):
        """Validate a referral code (public endpoint for registration)."""
        serializer = ValidateReferralCodeSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(message="Invalid referral code.", errors=serializer.errors)
        
        code = serializer.validated_data.get('code')
        if code:
            referral_code = ReferralCode.objects.get(code=code)
            return api_success(
                data={
                    'valid': True,
                    'referrer': referral_code.user.username,
                    'credits': 50
                },
                message="Referral code is valid."
            )
        
        return api_success(data={'valid': False}, message="No referral code provided.")


class ReferralViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing referral records."""
    
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Referral.objects.filter(referred_user=self.request.user)
    
    @action(detail=False, methods=['post'], url_path='complete')
    def complete_referral(self, request):
        """Complete a pending referral (called after user completes onboarding)."""
        pending_referral = Referral.objects.filter(
            referred_user=request.user,
            status=Referral.Status.PENDING
        ).first()
        
        if not pending_referral:
            return api_error(message="No pending referral found.")
        
        pending_referral.complete_referral(credits=50)
        return api_success(
            data={'credits_awarded': 50},
            message="Referral completed successfully. You've earned 50 AI credits!"
        )
