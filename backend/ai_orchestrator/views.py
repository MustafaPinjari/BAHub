from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
import datetime
import json
from .models import AITransactionLog, AIFeatureConfig, AIProviderConfig
from .router import AIRouter
from .credit_manager import CreditManager

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser

class AIAdminViewSet(viewsets.ViewSet):
    permission_classes = [IsSuperAdmin]

    @action(detail=False, methods=['GET'])
    def stats(self, request):
        today = timezone.now().date()
        first_day_of_month = today.replace(day=1)
        
        # Monthly Stats
        monthly_logs = AITransactionLog.objects.filter(timestamp__gte=first_day_of_month)
        monthly_cost = monthly_logs.aggregate(Sum('estimated_cost'))['estimated_cost__sum'] or 0.0
        monthly_credits = monthly_logs.aggregate(Sum('credits_deducted'))['credits_deducted__sum'] or 0
        
        # Daily Stats
        daily_logs = AITransactionLog.objects.filter(timestamp__date=today)
        daily_cost = daily_logs.aggregate(Sum('estimated_cost'))['estimated_cost__sum'] or 0.0
        daily_credits = daily_logs.aggregate(Sum('credits_deducted'))['credits_deducted__sum'] or 0
        
        # Breakdown by Feature
        feature_breakdown = monthly_logs.values('feature').annotate(
            total_cost=Sum('estimated_cost'),
            total_credits=Sum('credits_deducted'),
            count=Count('id')
        ).order_by('-total_cost')
        
        # Breakdown by Provider
        provider_breakdown = monthly_logs.values('provider').annotate(
            total_cost=Sum('estimated_cost'),
            count=Count('id')
        )
        
        return Response({
            'monthly': {
                'cost': monthly_cost,
                'credits_used': monthly_credits
            },
            'daily': {
                'cost': daily_cost,
                'credits_used': daily_credits
            },
            'feature_breakdown': list(feature_breakdown),
            'provider_breakdown': list(provider_breakdown)
        })

    @action(detail=False, methods=['GET'])
    def logs(self, request):
        limit = int(request.query_params.get('limit', 50))
        logs = AITransactionLog.objects.select_related('workspace', 'user').order_by('-timestamp')[:limit]
        
        data = []
        for log in logs:
            data.append({
                'id': log.id,
                'workspace': log.workspace.name,
                'user': log.user.email if log.user else 'Unknown',
                'feature': log.feature,
                'provider': log.provider,
                'model': log.model,
                'credits': log.credits_deducted,
                'cost': log.estimated_cost,
                'latency': log.latency,
                'status': log.status,
                'timestamp': log.timestamp
            })
            
        return Response(data)

class AIIngestionViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['POST'])
    def extract_requirements(self, request):
        text_content = request.data.get('text', '')
        if not text_content:
            return Response({'error': 'No text provided'}, status=400)
            
        # Optional organization context if passed in headers/payload
        # For now, we will assume the user has an organization context set by middleware, 
        # or we just grab the first one for the demo.
        org = request.user.organizations.first()
        if not org:
            return Response({'error': 'User must belong to an organization'}, status=403)

        feature_name = 'REQUIREMENT_EXTRACTION'
        
        try:
            # 1. Validate Credits
            feature_config = CreditManager.validate_request(org, feature_name)
        except Exception as e:
            return Response({'error': str(e)}, status=403)

        # 2. Build Prompt
        system_prompt = (
            "You are an expert Business Analyst. "
            "Extract a list of formal business requirements from the provided unstructured text (like a meeting transcript or raw notes). "
            "Return the output as a valid JSON array of objects. "
            "Each object must have the following keys: "
            "'title' (string, max 100 chars), "
            "'description' (string, detailed), "
            "'priority' (string, one of 'High', 'Medium', 'Low'), "
            "'type' (string, one of 'Functional', 'Non-Functional', 'Business'). "
            "Ensure the output is ONLY valid JSON, with no markdown formatting like ```json."
        )

        # 3. Call Router
        router = AIRouter()
        try:
            content, in_tokens, out_tokens, est_cost, latency, provider, model, status = router.generate(
                feature_config,
                text_content,
                system_prompt
            )
            
            # Clean up potential markdown formatting from LLM
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            # Parse JSON
            requirements_data = json.loads(content)
            
            # 4. Deduct Credits
            CreditManager.deduct_credits(
                org, request.user, feature_name, provider, model, 
                in_tokens, out_tokens, est_cost, latency, status
            )
            
            return Response({'requirements': requirements_data})

        except json.JSONDecodeError:
            # If the LLM failed to return valid JSON
            return Response({'error': 'Failed to parse AI response into valid JSON.', 'raw_content': content}, status=500)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class AIDiagramViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['POST'])
    def generate(self, request):
        prompt = request.data.get('prompt', '')
        if not prompt:
            return Response({'error': 'No prompt provided'}, status=400)
            
        org = request.user.organizations.first()
        if not org:
            return Response({'error': 'User must belong to an organization'}, status=403)

        feature_name = 'PROCESS_FLOW'
        
        try:
            feature_config = CreditManager.validate_request(org, feature_name)
        except Exception as e:
            return Response({'error': str(e)}, status=403)

        system_prompt = (
            "You are an expert system architect and business analyst. "
            "Generate a valid Mermaid.js diagram based on the user's prompt. "
            "Return ONLY the Mermaid code. Do NOT wrap it in markdown code blocks like ```mermaid. "
            "Just return the raw Mermaid syntax (e.g. starting with graph TD, sequenceDiagram, etc)."
        )

        router = AIRouter()
        try:
            content, in_tokens, out_tokens, est_cost, latency, provider, model, status = router.generate(
                feature_config,
                prompt,
                system_prompt
            )
            
            content = content.strip()
            if content.startswith('```mermaid'):
                content = content[10:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            CreditManager.deduct_credits(
                org, request.user, feature_name, provider, model, 
                in_tokens, out_tokens, est_cost, latency, status
            )
            
            return Response({'mermaid_code': content})

        except Exception as e:
            return Response({'error': str(e)}, status=500)
