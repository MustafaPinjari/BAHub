from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SWOTAnalysisViewSet, 
    GapAnalysisViewSet, 
    AIChatView, 
    AIJobDetailView,
    KnowledgeNodeViewSet,
    KnowledgeEdgeViewSet,
    WorkflowExecutionViewSet,
    ProjectKnowledgeGraphView,
    ProjectGraphSyncView
)

router = DefaultRouter()
router.register(r"swot", SWOTAnalysisViewSet, basename="swotanalysis")
router.register(r"gap", GapAnalysisViewSet, basename="gapanalysis")
router.register(r"nodes", KnowledgeNodeViewSet, basename="knowledgenode")
router.register(r"edges", KnowledgeEdgeViewSet, basename="knowledgeedge")
router.register(r"workflow", WorkflowExecutionViewSet, basename="workflowexecution")

urlpatterns = [
    path("ai/chat/", AIChatView.as_view(), name="ai-chat"),
    path("ai/jobs/<uuid:job_id>/", AIJobDetailView.as_view(), name="ai-job-detail"),
    path("graph/", ProjectKnowledgeGraphView.as_view(), name="project-graph"),
    path("graph/sync/", ProjectGraphSyncView.as_view(), name="project-graph-sync"),
    path("", include(router.urls)),
]

