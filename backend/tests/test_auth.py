import pytest
from app.models.user import UserRole

def test_login_success(client, admin_user):
    """Test successful login."""
    response = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "testpassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "user" in data
    assert data["user"]["email"] == "admin@test.com"
    assert data["user"]["role"] == UserRole.ADMIN.value

def test_login_invalid_credentials(client, admin_user):
    """Test login with invalid credentials."""
    response = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_get_current_user(authenticated_client):
    """Test getting current user info."""
    response = authenticated_client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@test.com"

def test_logout(authenticated_client):
    """Test logout."""
    response = authenticated_client.post("/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logout successful"

def test_change_password(authenticated_client):
    """Test password change."""
    response = authenticated_client.post("/auth/change-password", json={
        "current_password": "testpassword123",
        "new_password": "newpassword123"
    })
    assert response.status_code == 200

def test_create_user_as_admin(authenticated_client):
    """Test creating a user as admin."""
    response = authenticated_client.post("/auth/users", json={
        "email": "newuser@test.com",
        "username": "newuser",
        "password": "password123",
        "role": "Editor"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert data["role"] == "Editor"
