from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import secrets

# Initialize Argon2id password hasher
ph = PasswordHasher()

def hash_password(password: str) -> str:
    """Hash a password using Argon2id."""
    return ph.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        ph.verify(hashed_password, password)
        return True
    except VerifyMismatchError:
        return False

def generate_password(length: int = 16) -> str:
    """Generate a random password."""
    return secrets.token_urlsafe(length)
