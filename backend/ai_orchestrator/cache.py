import hashlib
import json
from django.core.cache import cache

class AICacheManager:
    @staticmethod
    def _generate_cache_key(feature_name, prompt, system_prompt=None):
        """Generates a stable cache key based on inputs."""
        hasher = hashlib.md5()
        hasher.update(feature_name.encode('utf-8'))
        if system_prompt:
            hasher.update(system_prompt.encode('utf-8'))
        hasher.update(prompt.encode('utf-8'))
        return f"ai_cache_{hasher.hexdigest()}"

    @staticmethod
    def get_cached_response(feature_name, prompt, system_prompt=None):
        """Attempts to retrieve a cached AI response."""
        key = AICacheManager._generate_cache_key(feature_name, prompt, system_prompt)
        return cache.get(key)

    @staticmethod
    def set_cached_response(feature_name, prompt, system_prompt, response_content, ttl=86400):
        """Caches the AI response for 24 hours by default."""
        key = AICacheManager._generate_cache_key(feature_name, prompt, system_prompt)
        cache.set(key, response_content, timeout=ttl)

    @staticmethod
    def compress_context(context_string, max_tokens=100000):
        """
        Compresses the context by removing repetitive boilerplate or 
        truncating to save input tokens before sending to LLM.
        """
        # Simple whitespace reduction to save tokens
        import re
        compressed = re.sub(r'\n\s*\n', '\n\n', context_string)
        compressed = re.sub(r' +', ' ', compressed)
        
        # Truncate if wildly over limits (rough estimation 1 token ~ 4 chars)
        max_chars = max_tokens * 4
        if len(compressed) > max_chars:
            compressed = compressed[:max_chars] + "\n...[Context Truncated to fit Limits]"
            
        return compressed
