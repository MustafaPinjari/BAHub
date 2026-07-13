import logging
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import ValidationError, APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("bahub.core")

def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework.
    Wraps all error responses in the standard enterprise format:
    {
        "success": false,
        "message": "<Error Summary>",
        "errors": { ... }
    }
    """
    # Call DRF's default exception handler to get the initial response
    response = exception_handler(exc, context)

    # Convert standard Django exceptions to DRF exceptions where appropriate
    if isinstance(exc, Http404):
        response = Response(
            {"detail": "Not found."}, 
            status=status.HTTP_404_NOT_FOUND
        )
    elif isinstance(exc, DjangoPermissionDenied):
        response = Response(
            {"detail": "Permission denied."}, 
            status=status.HTTP_403_FORBIDDEN
        )

    if response is not None:
        # Case 1: Validation Errors
        if isinstance(exc, ValidationError):
            errors = response.data
            if isinstance(errors, list):
                errors = {"non_field_errors": errors}
            elif not isinstance(errors, dict):
                errors = {"detail": errors}
                
            response.data = {
                "success": False,
                "message": "Validation failed.",
                "errors": errors
            }
        # Case 2: Other DRF API Errors (Authentication, Permission, Not Found, etc.)
        else:
            detail = response.data.get("detail", "An error occurred.")
            # Keep original error keys if available, removing 'detail' to avoid repetition
            errors = dict(response.data)
            if "detail" in errors:
                del errors["detail"]
            if not errors:
                errors = {"error": detail}
                
            response.data = {
                "success": False,
                "message": detail,
                "errors": errors
            }
            
        # Log API errors that are not 404/403/401 at warning level
        if response.status_code >= 400 and response.status_code not in [401, 403, 404]:
            logger.warning(f"API Error ({response.status_code}): {exc}")
            
    else:
        # Case 3: Server Exception (500)
        logger.exception("Unhandled Server Error: %s", str(exc))
        from django.conf import settings
        # Never expose raw exception detail to clients in production —
        # it can leak DB schema, file paths, or internal logic.
        error_detail = str(exc) if settings.DEBUG else "Internal server error."
        response = Response(
            {
                "success": False,
                "message": "An unexpected server error occurred.",
                "errors": {"server_error": error_detail},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
