from datetime import datetime, timezone

def get_utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

def parse_iso_date(date_str: str) -> datetime:
    return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
