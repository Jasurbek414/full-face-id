def get_request_company(request):
    """
    Get the company for the current request.
    First tries request.user.company (FK), then falls back to request.company
    (set by TenantMiddleware from X-Company-ID header).
    """
    try:
        company = getattr(request.user, 'company', None)
        if company is not None:
            return company
    except Exception:
        pass
    return getattr(request, 'company', None)
