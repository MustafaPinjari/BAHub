from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TestCaseViewSet, DefectViewSet

router = DefaultRouter()
router.register("test-cases", TestCaseViewSet, basename="testcase")
router.register("defects", DefectViewSet, basename="defect")

urlpatterns = [
    path("", include(router.urls)),
]
