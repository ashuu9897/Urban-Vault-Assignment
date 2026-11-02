"""
Every API error is returned in one shape:

    {"detail": "Human readable summary", "errors": {"field": ["message"], ...}}

`errors` is empty for non-validation errors (401/403/404/405...). For validation errors
`detail` repeats the first message so a client can always show `detail` as a summary.
"""

from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.serializers import as_serializer_error
from rest_framework.settings import api_settings
from rest_framework.views import exception_handler


def api_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    if isinstance(exc, DjangoValidationError):
        # Raised by the service layer; give it the same treatment as serializer errors.
        exc = ValidationError(detail=as_serializer_error(exc))

    response = exception_handler(exc, context)
    if response is None:
        return None  # Unhandled -> Django's 500 handling (and logging).

    if isinstance(exc, ValidationError):
        errors = response.data
        if not isinstance(errors, dict):
            errors = {api_settings.NON_FIELD_ERRORS_KEY: errors}
        response.data = {"detail": _first_message(errors), "errors": errors}
    else:
        response.data = {"detail": response.data.get("detail", "Request failed."), "errors": {}}
    return response


def _first_message(errors: Any) -> str:
    """Depth-first search for the first error message, looking at non-field errors first."""
    if isinstance(errors, dict):
        non_field_first = sorted(errors, key=lambda key: key != api_settings.NON_FIELD_ERRORS_KEY)
        values = [errors[key] for key in non_field_first]
    elif isinstance(errors, list):
        values = errors
    else:
        return str(errors)
    for value in values:
        if message := _first_message(value):
            return message
    return ""
