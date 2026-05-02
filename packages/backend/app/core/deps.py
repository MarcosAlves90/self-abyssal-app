from __future__ import annotations

from fastapi import Request


def get_authorization(request: Request) -> str | None:
    """Reads the Authorization header without exposing it as a Swagger parameter."""
    return request.headers.get("authorization")
