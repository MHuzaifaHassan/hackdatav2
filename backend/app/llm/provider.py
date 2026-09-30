import abc
import json
import os
import re
from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel
import httpx

from backend.app.config import settings

T = TypeVar("T", bound=BaseModel)


class BaseLLMProvider(abc.ABC):
    """Abstract Base Class for LLM providers."""

    @abc.abstractmethod
    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generates raw text completion."""
        pass

    @abc.abstractmethod
    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """Generates validated JSON dictionary."""
        pass


class MockLLMProvider(BaseLLMProvider):
    """Mock LLM Provider for offline development, deterministic tests, and fallback."""

    def __init__(self, default_response: Optional[Dict[str, Any]] = None):
        self.default_response = default_response

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        data = await self.generate_json(prompt, system_prompt)
        return json.dumps(data, indent=2)

    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        if self.default_response:
            return self.default_response

        prompt_lower = prompt.lower()

        # Keyword-based mock domain generation
        if "hospital" in prompt_lower or "patient" in prompt_lower or "health" in prompt_lower or "clinic" in prompt_lower:
            from backend.app.domains.packs import get_domain_pack
            pack = get_domain_pack("healthcare")
            return pack.model_dump()

        elif "ecommerce" in prompt_lower or "order" in prompt_lower or "product" in prompt_lower or "shop" in prompt_lower:
            from backend.app.domains.packs import get_domain_pack
            pack = get_domain_pack("ecommerce")
            return pack.model_dump()

        elif "employee" in prompt_lower or "hr" in prompt_lower or "payroll" in prompt_lower or "department" in prompt_lower:
            from backend.app.domains.packs import get_domain_pack
            pack = get_domain_pack("hr")
            return pack.model_dump()

        elif "shipment" in prompt_lower or "logistics" in prompt_lower or "warehouse" in prompt_lower or "delivery" in prompt_lower:
            from backend.app.domains.packs import get_domain_pack
            pack = get_domain_pack("logistics")
            return pack.model_dump()

        else:
            # Default to fintech
            from backend.app.domains.packs import get_domain_pack
            pack = get_domain_pack("fintech")
            return pack.model_dump()


class GeminiLLMProvider(BaseLLMProvider):
    """Google Gemini API Provider."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-1.5-flash"):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not set.")

        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        if system_prompt:
            payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(self.url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        text = await self.generate_text(prompt, system_prompt)
        return _extract_json_from_text(text)


class OpenAILLMProvider(BaseLLMProvider):
    """OpenAI API Provider."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not set.")

        headers = {"Authorization": f"Bearer {self.api_key}"}
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json={"model": self.model, "messages": messages, "response_format": {"type": "json_object"}},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        text = await self.generate_text(prompt, system_prompt)
        return json.loads(text)


def _extract_json_from_text(text: str) -> Dict[str, Any]:
    """Helper to cleanly extract JSON payload from model text completions."""
    text_clean = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text_clean)
    if match:
        raw_json = match.group(1).strip()
    else:
        raw_json = text_clean

    try:
        return json.loads(raw_json)
    except json.JSONDecodeError:
        # Fallback regex search for first outer brace
        start = raw_json.find("{")
        end = raw_json.rfind("}")
        if start != -1 and end != -1:
            return json.loads(raw_json[start : end + 1])
        raise


def get_llm_provider(provider_type: Optional[str] = None) -> BaseLLMProvider:
    """Factory to retrieve configured LLM provider."""
    p_type = (provider_type or settings.LLM_PROVIDER).lower()
    if p_type == "gemini" and settings.GEMINI_API_KEY:
        return GeminiLLMProvider()
    elif p_type == "openai" and settings.OPENAI_API_KEY:
        return OpenAILLMProvider()
    return MockLLMProvider()
