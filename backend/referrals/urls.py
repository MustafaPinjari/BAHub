from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReferralCodeViewSet, ReferralViewSet

router = DefaultRouter()
router.register(r'codes', ReferralCodeViewSet, basename='referral-codes')
router.register(r'referrals', ReferralViewSet, basename='referrals')

urlpatterns = [
    path('', include(router.urls)),
]
