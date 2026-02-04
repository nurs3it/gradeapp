"""
Tolgee middleware for Django.
"""
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings


class TolgeeMiddleware(MiddlewareMixin):
    """
    Middleware to integrate Tolgee translations.
    Currently a placeholder for future implementation.
    """
    
    def process_request(self, request):
        # Get user's language preference
        if request.user.is_authenticated:
            language = request.user.language_pref
            # Set language for request
            request.tolgee_language = language
        else:
            # Default to Russian
            request.tolgee_language = 'ru'
        
        return None

