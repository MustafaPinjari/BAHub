from django.core.cache import cache
from django.http import JsonResponse
from rest_framework import status

class AIRateLimiterMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only rate limit AI related paths
        if '/api/v1/srs/generate/' in request.path or '/api/v1/strategic/run/' in request.path:
            # Check user rate limit
            user_id = request.user.id if request.user.is_authenticated else 'anon'
            
            # Simple concurrent lock mechanism using Redis
            # In a real heavy-load environment this should use a proper distributed lock
            lock_key = f"ai_lock_user_{user_id}"
            active_requests = cache.get(lock_key, 0)
            
            if active_requests >= 2: # Max 2 concurrent AI requests
                return JsonResponse(
                    {'error': 'Too many concurrent AI requests. Please wait for previous tasks to finish.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
                
            # Increment
            cache.set(lock_key, active_requests + 1, timeout=300) # 5 min max TTL
            
            try:
                response = self.get_response(request)
            finally:
                # Decrement
                curr = cache.get(lock_key)
                if curr and curr > 0:
                    cache.set(lock_key, curr - 1, timeout=300)
                    
            return response
            
        return self.get_response(request)
