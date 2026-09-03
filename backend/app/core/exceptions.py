from fastapi import HTTPException, status

class SATQUERYException(Exception):
    """Base exception class for SATQUERY domain errors."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)

class PermissionDeniedException(HTTPException):
    def __init__(self, detail: str = "Permission denied for this operational clearance."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class ProviderUnavailableException(HTTPException):
    def __init__(self, provider: str, detail: str = "Upstream provider unreachable."):
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"[{provider}] {detail}")
