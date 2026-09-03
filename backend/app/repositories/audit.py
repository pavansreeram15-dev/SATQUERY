from typing import List, Optional
from ..models.audit import AuditModel
from ..services.audit_service import get_audit_logs

class AuditRepository:
    def list_logs(self, limit: int = 50, persona: Optional[str] = None):
        return get_audit_logs(limit=limit, persona=persona)

audit_repository = AuditRepository()
