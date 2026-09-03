from typing import Optional, List
from ..models.user import UserModel

class UserRepository:
    def __init__(self):
        self._users = {}

    def get_user_by_id(self, user_id: str) -> Optional[UserModel]:
        return self._users.get(user_id)

    def save(self, user: UserModel) -> UserModel:
        self._users[user.id] = user
        return user

user_repository = UserRepository()
