"""
Tolgee integration service for i18n.
"""
import os
import requests
from django.conf import settings
from django.core.cache import cache


def get_translation(key: str, language: str = 'ru', default: str = None) -> str:
    """
    Get translation from Tolgee.
    
    Args:
        key: Translation key
        language: Language code (ru, kz, en)
        default: Default value if translation not found
    
    Returns:
        Translated string
    """
    # Check cache first
    cache_key = f'tolgee_{key}_{language}'
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    # Get from Tolgee API
    tolgee_url = os.getenv('TOLGEE_API_URL', settings.TOLGEE_API_URL)
    api_key = os.getenv('TOLGEE_API_KEY', settings.TOLGEE_API_KEY)
    
    if not tolgee_url:
        return default or key
    
    try:
        # Tolgee API endpoint for translations
        url = f"{tolgee_url}/api/v2/projects/translations"
        headers = {'X-API-Key': api_key} if api_key else {}
        params = {'key': key, 'locale': language}
        
        response = requests.get(url, headers=headers, params=params, timeout=2)
        
        if response.status_code == 200:
            data = response.json()
            translation = data.get('_embedded', {}).get('translations', [{}])[0].get('text', default or key)
            # Cache for 1 hour
            cache.set(cache_key, translation, 3600)
            return translation
    except Exception:
        pass
    
    return default or key


def translate_template(template: str, language: str = 'ru', context: dict = None) -> str:
    """
    Translate a template with placeholders.
    
    Args:
        template: Template string with placeholders
        language: Language code
        context: Context dict for placeholders
    
    Returns:
        Translated template with replaced placeholders
    """
    # For now, simple placeholder replacement
    # In production, this would use Tolgee for template translation
    if context:
        for key, value in context.items():
            template = template.replace(f'{{{{{key}}}}}', str(value))
    
    return template

