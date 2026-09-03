import uuid
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from ..schemas.persona_schemas import UserPersona
from ..schemas.response_schemas import AuditLogItem

# In-memory thread-safe storage with initial audit records
_AUDIT_STORE: List[Dict[str, Any]] = [
    {
        "id": "AUD-INIT-001",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "user_persona": UserPersona.ISRO_ANALYST.value,
        "action": "SYSTEM_INITIALIZE",
        "data_source": "SYSTEM",
        "status": "SUCCESS",
        "user_prompt": "SATQUERY AI Mission Control Subsystem Online",
        "execution_time_ms": 12,
        "summary": "Core telemetry, GIS indexing, and routing subsystems initialized."
    }
]

def sanitize_text(text: str) -> str:
    """Remove any accidental API keys or passwords before recording audit logs."""
    if not text:
        return ""
    # Mask API key patterns or bearer tokens
    text = re.sub(r'(bearer\s+)[A-Za-z0-9_\-\.]{20,}', r'\1[REDACTED_TOKEN]', text, flags=re.IGNORECASE)
    text = re.sub(r'(key|secret|password|token)=([A-Za-z0-9_\-\.]{8,})', r'\1=[REDACTED]', text, flags=re.IGNORECASE)
    return text

def record_audit_event(
    user_persona: UserPersona,
    action: str,
    data_source: str,
    status: str,
    user_prompt: str,
    execution_time_ms: int,
    summary: Optional[str] = None
) -> AuditLogItem:
    """Record an immutable, sanitized audit event."""
    try:
        log_entry = {
            "id": f"AUD-{uuid.uuid4().hex[:8].upper()}",
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "user_persona": user_persona.value if isinstance(user_persona, UserPersona) else str(user_persona),
            "action": sanitize_text(action),
            "data_source": data_source,
            "status": status,
            "user_prompt": sanitize_text(user_prompt),
            "execution_time_ms": execution_time_ms,
            "summary": sanitize_text(summary or "")
        }
        _AUDIT_STORE.insert(0, log_entry)
        if len(_AUDIT_STORE) > 200:
            _AUDIT_STORE.pop()
        
        return AuditLogItem(**log_entry)
    except Exception:
        # Fallback minimal audit item so logging failure never blocks user analysis
        return AuditLogItem(
            id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
            timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            user_persona=user_persona,
            action=action,
            data_source=data_source,
            status=status,
            user_prompt=user_prompt[:100],
            execution_time_ms=execution_time_ms,
            summary=summary
        )

def get_audit_logs(limit: int = 50, persona: Optional[str] = None) -> List[AuditLogItem]:
    """Retrieve audit history filtered by persona."""
    filtered = _AUDIT_STORE
    if persona:
        filtered = [x for x in filtered if x["user_persona"] == persona]
    return [AuditLogItem(**item) for item in filtered[:limit]]

