from dataclasses import dataclass


@dataclass(slots=True)
class ApiException(Exception):
    status_code: int
    message: str
    details: object | None = None
