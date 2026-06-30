from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PermissionViewSet,
    RoleViewSet,
    UserRoleViewSet,
    UserPermissionOverrideViewSet,
)

router = DefaultRouter()
router.register(r"registry", PermissionViewSet, basename="permission")
router.register(r"roles", RoleViewSet, basename="role")
router.register(r"user-roles", UserRoleViewSet, basename="user-role")
router.register(r"overrides", UserPermissionOverrideViewSet, basename="override")

urlpatterns = [
    path("", include(router.urls)),
]
