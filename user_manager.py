from werkzeug.security import generate_password_hash, check_password_hash

class UserManager:
    def __init__(self):
        self.users = {}  # In-memory storage for demo purposes

    def register_user(self, user_id: str, username: str, password: str) -> bool:
        """Register a new user."""
        if user_id in self.users:
            return False
        
        self.users[user_id] = {
            'username': username,
            'password_hash': generate_password_hash(password)
        }
        return True

    def authenticate_user(self, user_id: str, password: str) -> bool:
        """Authenticate a user."""
        if user_id not in self.users:
            return False
        
        return check_password_hash(self.users[user_id]['password_hash'], password)
