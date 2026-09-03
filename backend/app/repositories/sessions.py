from typing import Optional
from ..models.session import SessionModel

class SessionRepository:
    def __init__(self):
        self._sessions = {}

    def get_session(self, session_id: str) -> Optional[SessionModel]:
        return self._sessions.get(session_id)

    def save(self, session: SessionModel) -> SessionModel:
        self._sessions[session.session_id] = session
        return session

session_repository = SessionRepository()
