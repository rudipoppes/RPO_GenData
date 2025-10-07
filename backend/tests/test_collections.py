import pytest
from app.models.collection import Collection
from app.models.field import Field, CollectionType, ValueType

def test_create_collection(authenticated_client):
    """Test creating a collection."""
    response = authenticated_client.post("/admin/collections", json={
        "name": "Test Collection"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Collection"

def test_list_collections(authenticated_client):
    """Test listing collections."""
    # Create a collection first
    authenticated_client.post("/admin/collections", json={
        "name": "Test Collection"
    })
    
    response = authenticated_client.get("/admin/collections")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Test Collection"

def test_get_collection_with_fields(authenticated_client):
    """Test getting a collection with its fields."""
    # Create collection
    collection_response = authenticated_client.post("/admin/collections", json={
        "name": "Test Collection"
    })
    collection_id = collection_response.json()["id"]
    
    # Create a field
    authenticated_client.post(f"/admin/collections/{collection_id}/fields", json={
        "collection_type": "Performance",
        "field_name": "Test Field",
        "value_type": "TEXT_FIXED",
        "fixed_value_text": "test value"
    })
    
    # Get collection with fields
    response = authenticated_client.get(f"/admin/collections/{collection_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Collection"
    assert len(data["fields"]) == 1
    assert data["fields"][0]["field_name"] == "Test Field"

def test_create_field_validation(authenticated_client):
    """Test field creation with validation."""
    # Create collection
    collection_response = authenticated_client.post("/admin/collections", json={
        "name": "Test Collection"
    })
    collection_id = collection_response.json()["id"]
    
    # Test invalid field (missing required fixed value)
    response = authenticated_client.post(f"/admin/collections/{collection_id}/fields", json={
        "collection_type": "Performance",
        "field_name": "Invalid Field",
        "value_type": "TEXT_FIXED"
        # Missing fixed_value_text
    })
    assert response.status_code == 400

def test_update_collection(authenticated_client):
    """Test updating a collection."""
    # Create collection
    collection_response = authenticated_client.post("/admin/collections", json={
        "name": "Test Collection"
    })
    collection_id = collection_response.json()["id"]
    
    # Update collection
    response = authenticated_client.patch(f"/admin/collections/{collection_id}", json={
        "name": "Updated Collection"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Collection"

def test_delete_collection(authenticated_client):
    """Test deleting a collection."""
    # Create collection
    collection_response = authenticated_client.post("/admin/collections", json={
        "name": "Test Collection"
    })
    collection_id = collection_response.json()["id"]
    
    # Delete collection
    response = authenticated_client.delete(f"/admin/collections/{collection_id}")
    assert response.status_code == 200
    
    # Verify it's gone
    response = authenticated_client.get(f"/admin/collections/{collection_id}")
    assert response.status_code == 404
