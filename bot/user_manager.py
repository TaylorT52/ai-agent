import json
import os
import hashlib
from pathlib import Path
from typing import Dict, Any, Optional

class UserManager:
    """Manages user accounts and data for the Discord bot."""
    
    def __init__(self, data_file: str = "users.json"):
        """Initialize the user manager with a data file."""
        self.data_file = Path(os.path.dirname(os.path.abspath(__file__))) / data_file
        self.users = {}
        self.load_users()
    
    def load_users(self) -> None:
        """Load users from the data file."""
        if self.data_file.exists():
            try:
                with open(self.data_file, 'r') as f:
                    self.users = json.load(f)
            except json.JSONDecodeError:
                print(f"Error decoding {self.data_file}. Starting with empty user database.")
                self.users = {}
    
    def save_users(self) -> None:
        """Save users to the data file."""
        with open(self.data_file, 'w') as f:
            json.dump(self.users, f, indent=2)
    
    def hash_password(self, password: str) -> str:
        """Hash a password for secure storage."""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def register_user(self, user_id: str, username: str, password: str) -> bool:
        """Register a new user."""
        if user_id in self.users:
            return False  # User already exists
        
        self.users[user_id] = {
            "username": username,
            "password_hash": self.hash_password(password),
            "sessions": {},
            "forms": []
        }
        self.save_users()
        return True
    
    def authenticate_user(self, user_id: str, password: str) -> bool:
        """Authenticate a user with their password."""
        if user_id not in self.users:
            return False
        
        return self.users[user_id]["password_hash"] == self.hash_password(password)
    
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by their ID."""
        return self.users.get(user_id)
    
    def start_form_session(self, user_id: str, form_id: str, form_data: Dict[str, Any]) -> str:
        """Start a new form session for a user."""
        if user_id not in self.users:
            return None
        
        session_id = f"session_{len(self.users[user_id]['sessions']) + 1}"
        self.users[user_id]["sessions"][session_id] = {
            "form_id": form_id,
            "form_data": form_data,
            "status": "in_progress",
            "current_field": 0,
            "collected_data": {}
        }
        self.save_users()
        return session_id
    
    def get_active_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get the active session for a user."""
        if user_id not in self.users:
            return None
        
        for session_id, session in self.users[user_id]["sessions"].items():
            if session["status"] == "in_progress":
                return {"session_id": session_id, **session}
        
        return None
    
    def save_field_response(self, user_id: str, session_id: str, field_name: str, response: str) -> bool:
        """Save a field response for a form session."""
        if user_id not in self.users or session_id not in self.users[user_id]["sessions"]:
            return False
        
        session = self.users[user_id]["sessions"][session_id]
        session["collected_data"][field_name] = response
        self.save_users()
        return True
    
    def advance_session(self, user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
        """Advance the session to the next field."""
        if user_id not in self.users or session_id not in self.users[user_id]["sessions"]:
            return None
        
        session = self.users[user_id]["sessions"][session_id]
        session["current_field"] += 1
        
        # Check if we've reached the end of the form
        if session["current_field"] >= len(session["form_data"]["fields"]):
            session["status"] = "completed"
            self.save_users()
            return {"status": "completed", "data": session["collected_data"]}
        
        # Return the next field
        field = session["form_data"]["fields"][session["current_field"]]
        self.save_users()
        return {"status": "in_progress", "field": field}
    
    def complete_session(self, user_id: str, session_id: str) -> Dict[str, Any]:
        """Mark a session as completed and return the collected data."""
        if user_id not in self.users or session_id not in self.users[user_id]["sessions"]:
            return None
        
        session = self.users[user_id]["sessions"][session_id]
        session["status"] = "completed"
        self.save_users()
        return session["collected_data"]
