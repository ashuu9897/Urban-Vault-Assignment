"""
DEMO-ONLY identity mechanism. This is NOT authentication.

The frontend's "Viewing as" selector sends the chosen user's id in an `X-User-Id` header
and the API simply trusts it. That keeps the take-home focused on the ticket workflow; a
real deployment would replace this class with session/JWT/SSO authentication without
touching any view, service or permission code.
"""

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request

from .models import User
from .selectors import helpdesk_users


class DemoUserAuthentication(BaseAuthentication):
    header_name = "X-User-Id"

    def authenticate(self, request: Request) -> tuple[User, None] | None:
        raw_user_id = request.headers.get(self.header_name)
        if raw_user_id is None:
            return None  # Anonymous; IsAuthenticated turns this into a 401.
        try:
            user_id = int(raw_user_id)
        except ValueError:
            raise AuthenticationFailed(f"{self.header_name} must be a numeric user id.") from None
        user = helpdesk_users().filter(pk=user_id).first()
        if user is None:
            raise AuthenticationFailed(f"No helpdesk user with id {raw_user_id}.")
        return user, None

    def authenticate_header(self, request: Request) -> str:
        # Returning a value makes DRF answer 401 (not 403) when the header is missing.
        return self.header_name
