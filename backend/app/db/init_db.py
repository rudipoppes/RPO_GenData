from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.auth.password import hash_password

def create_initial_admin_user():
    """Create an initial admin user if no users exist."""
    db = SessionLocal()
    try:
        # Check if any users exist
        user_count = db.query(User).count()
        if user_count == 0:
            # Create initial admin user
            admin_user = User(
                email="admin@example.com",
                username="admin",
                password_hash=hash_password("admin123"),
                role=UserRole.ADMIN
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"Created initial admin user: {admin_user.email}")
            return admin_user
        else:
            print(f"Database already has {user_count} users")
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_admin_user()
