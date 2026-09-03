import os

class SupabaseClient:
    """Supabase auth and table storage integration interface."""
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL", "")
        self.key = os.getenv("SUPABASE_ANON_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.url and self.key)

supabase_client = SupabaseClient()
