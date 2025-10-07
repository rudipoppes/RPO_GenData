import pytest
import tempfile
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import get_db, Base
from app.models.user import User, UserRole
from app.auth.password import hash_password

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client():
    """Create a test client."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def admin_user(db):
    """Create an admin user for testing."""
    user = User(
        email="admin@test.com",
        username="testadmin",
        password_hash=hash_password("testpassword123"),
        role=UserRole.ADMIN
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(scope="function")
def editor_user(db):
    """Create an editor user for testing."""
    user = User(
        email="editor@test.com",
        username="testeditor",
        password_hash=hash_password("testpassword123"),
        role=UserRole.EDITOR
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(scope="function")
def authenticated_client(client, admin_user):
    """Create an authenticated client."""
    response = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "testpassword123"
    })
    assert response.status_code == 200
    return client
