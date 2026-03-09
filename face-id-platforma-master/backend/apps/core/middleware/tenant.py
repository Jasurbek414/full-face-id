from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponseForbidden
from django.core.exceptions import ValidationError
from apps.companies.models import Company

class TenantMiddleware(MiddlewareMixin):
    """Middleware to set request.company based on subdomain or custom header.
    For simplicity, we read a custom header ``X-Company-ID`` containing the UUID of the company.
    In production you might resolve subdomains to companies.
    """
    def process_request(self, request):
        company_id = request.headers.get('X-Company-ID')
        if not company_id:
            # No tenant info – allow unauthenticated access to public endpoints
            request.company = None
            return None
        try:
            request.company = Company.objects.get(id=company_id, is_deleted=False)
        except (Company.DoesNotExist, ValueError, ValidationError):
            return HttpResponseForbidden('Invalid company identifier')
        return None
