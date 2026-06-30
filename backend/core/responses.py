from rest_framework.response import Response
from rest_framework import status

def api_success(data=None, message="Operation completed successfully.", meta=None, status_code=status.HTTP_200_OK):
    """
    Return a standardized success API response.
    """
    response_payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }
    if meta is not None:
        response_payload["meta"] = meta
    else:
        response_payload["meta"] = {}
        
    return Response(response_payload, status=status_code)

def api_error(message="An error occurred.", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    """
    Return a standardized error API response.
    """
    response_payload = {
        "success": False,
        "message": message,
        "errors": errors if errors is not None else {},
    }
    return Response(response_payload, status=status_code)
