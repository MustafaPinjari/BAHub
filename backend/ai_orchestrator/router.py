import os
import time
import requests
import logging
from .models import AIProviderConfig
from .cache import AICacheManager

logger = logging.getLogger(__name__)

class AIRouter:
    def __init__(self):
        self.pricing = {
            "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
            "gemini-1.5-flash": {"input": 0.000075, "output": 0.0003},
        }

    def _get_api_key(self, provider_name, env_fallback):
        try:
            config = AIProviderConfig.objects.get(provider_name=provider_name)
            if config.is_active and config.api_key:
                return config.api_key
        except AIProviderConfig.DoesNotExist:
            pass
        return os.environ.get(env_fallback)

    def generate(self, feature_config, prompt, system_prompt=None):
        """
        Routes the request to the appropriate provider based on the feature configuration.
        Returns: (content, input_tokens, output_tokens, estimated_cost, latency, provider, model, status)
        """
        start_time = time.time()
        
        # 1. Check Cache
        cached_response = AICacheManager.get_cached_response(feature_config.feature_name, prompt, system_prompt)
        if cached_response:
            latency = time.time() - start_time
            # Return cached payload. Input tokens are estimated, output tokens are 0 cost.
            return cached_response, len(prompt)//4, 0, 0.0, latency, "CACHE", "cached-model", "CACHED"

        provider = feature_config.preferred_provider
        model = feature_config.preferred_model

        if provider == 'AUTO':
            # Auto-routing logic based on model name
            if 'gemini' in model.lower():
                provider = 'GEMINI'
            else:
                provider = 'OPENAI'
                
        try:
            if provider == 'GEMINI':
                content, in_tokens, out_tokens = self._call_gemini(model, prompt, system_prompt)
            else:
                # Default to OpenAI
                content, in_tokens, out_tokens = self._call_openai(model, prompt, system_prompt)
                provider = 'OPENAI'
        except Exception as e:
            logger.error(f"Error calling {provider} for {feature_config.feature_name}: {str(e)}")
            raise e

        latency = time.time() - start_time
        
        # Estimate cost (per 1k tokens logic based on internal pricing dict)
        cost_info = self.pricing.get(model, {"input": 0.0, "output": 0.0})
        estimated_cost = (in_tokens / 1000.0 * cost_info["input"]) + (out_tokens / 1000.0 * cost_info["output"])

        # Set cache
        AICacheManager.set_cached_response(feature_config.feature_name, prompt, system_prompt, content)

        return content, in_tokens, out_tokens, estimated_cost, latency, provider, model, "SUCCESS"

    def _call_openai(self, model, prompt, system_prompt):
        api_key = self._get_api_key('OPENAI', 'OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OpenAI API key not configured.")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        data = {
            "model": model,
            "messages": messages,
        }

        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data, timeout=60)
        response.raise_for_status()
        
        resp_json = response.json()
        content = resp_json['choices'][0]['message']['content']
        usage = resp_json.get('usage', {})
        in_tokens = usage.get('prompt_tokens', len(prompt) // 4)
        out_tokens = usage.get('completion_tokens', len(content) // 4)
        
        return content, in_tokens, out_tokens

    def _call_gemini(self, model, prompt, system_prompt):
        api_key = self._get_api_key('GEMINI', 'GEMINI_API_KEY')
        if not api_key:
            raise ValueError("Gemini API key not configured.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        
        # Gemini structure
        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": f"System Instruction: {system_prompt}"}]})
            contents.append({"role": "model", "parts": [{"text": "Acknowledged."}]})
        
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        data = {"contents": contents}

        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        
        resp_json = response.json()
        
        try:
            content = resp_json['candidates'][0]['content']['parts'][0]['text']
        except (KeyError, IndexError):
            content = ""

        # Google Gemini doesn't always return token usage in the REST response by default 
        # unless asked or metadata is included. We will estimate if missing.
        metadata = resp_json.get('usageMetadata', {})
        in_tokens = metadata.get('promptTokenCount', len(prompt) // 4)
        out_tokens = metadata.get('candidatesTokenCount', len(content) // 4)

        return content, in_tokens, out_tokens
