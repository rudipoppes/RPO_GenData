import pytest
import time
from app.models.collection import Collection
from app.models.field import Field, CollectionType, ValueType
from app.generators.value_generator import ValueGenerator

def test_data_generation_api_endpoint(authenticated_client, db):
    """Test the public data generation API endpoint."""
    # Create collection
    collection_response = authenticated_client.post("/admin/collections", json={
        "name": "Test Data Collection"
    })
    collection_id = collection_response.json()["id"]
    
    # Create fields with different value types
    fields_data = [
        {
            "collection_type": "Performance",
            "field_name": "Fixed Text",
            "value_type": "TEXT_FIXED",
            "fixed_value_text": "Hello World"
        },
        {
            "collection_type": "Performance",
            "field_name": "Fixed Number",
            "value_type": "NUMBER_FIXED",
            "fixed_value_number": 42
        },
        {
            "collection_type": "Performance", 
            "field_name": "Number Range",
            "value_type": "NUMBER_RANGE",
            "range_start_number": 1,
            "range_end_number": 100
        },
        {
            "collection_type": "Performance",
            "field_name": "Epoch Time",
            "value_type": "EPOCH_NOW"
        }
    ]
    
    for field_data in fields_data:
        response = authenticated_client.post(f"/admin/collections/{collection_id}/fields", json=field_data)
        assert response.status_code == 200
    
    # Create API key
    api_key_response = authenticated_client.post("/admin/api-keys", json={
        "label": "Test API Key"
    })
    assert api_key_response.status_code == 200
    api_key = api_key_response.json()["key"]
    
    # Test data generation via public API
    headers = {"X-API-Key": api_key}
    response = authenticated_client.get("/api/Test%20Data%20Collection/Performance", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["collection"] == "Test Data Collection"
    assert data["type"] == "Performance"
    assert "generated_at_epoch" in data
    assert "data" in data
    
    generated_data = data["data"]
    assert generated_data["Fixed Text"] == "Hello World"
    assert generated_data["Fixed Number"] == 42
    assert 1 <= generated_data["Number Range"] <= 100
    assert isinstance(generated_data["Epoch Time"], int)
    assert abs(generated_data["Epoch Time"] - time.time()) < 10  # Within 10 seconds

def test_increment_generation_basic(db):
    """Test basic increment value generation."""
    # Create test field with increment
    field = Field(
        collection_id=1,
        collection_type=CollectionType.PERFORMANCE,
        field_name="Counter",
        value_type=ValueType.INCREMENT,
        start_number=10,
        step_number=5,
        reset_number=30
    )
    
    # Test increment behavior - sequence should be: 10, 15, 20, 25, 30, then reset to 10
    value1 = ValueGenerator.generate_value(field, db)
    assert value1 == 10  # First call returns start value
    assert field.current_number == 15  # Next value is calculated
    
    value2 = ValueGenerator.generate_value(field, db) 
    assert value2 == 15
    assert field.current_number == 20
    
    value3 = ValueGenerator.generate_value(field, db)
    assert value3 == 20
    assert field.current_number == 25
    
    value4 = ValueGenerator.generate_value(field, db)
    assert value4 == 25
    assert field.current_number == 30
    
    value5 = ValueGenerator.generate_value(field, db)
    assert value5 == 30
    assert field.current_number == 10  # FIXED: Reset to start value, not start + step

def test_increment_generation_reset_boundary(db):
    """Test increment reset at boundary - the bug we're fixing."""
    # Test case matching the user's example: start=1, step=1, reset=10
    field = Field(
        collection_id=1,
        collection_type=CollectionType.PERFORMANCE,
        field_name="Simple Counter",
        value_type=ValueType.INCREMENT,
        start_number=1,
        step_number=1,
        reset_number=10
    )
    
    # Generate sequence: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    values = []
    for i in range(10):
        value = ValueGenerator.generate_value(field, db)
        values.append(value)
    
    # Should be [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    assert values == [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    
    # After reaching 10, next value should be 1 (not 2!)
    reset_value = ValueGenerator.generate_value(field, db)
    assert reset_value == 1  # This was the bug - was returning 2

def test_decrement_generation_basic(db):
    """Test basic decrement value generation."""
    # Create test field with decrement
    field = Field(
        collection_id=1,
        collection_type=CollectionType.PERFORMANCE,
        field_name="Countdown",
        value_type=ValueType.DECREMENT,
        start_number=20,
        step_number=3,
        reset_number=5
    )
    
    # Test decrement behavior - sequence should be: 20, 17, 14, 11, 8, then reset to 20
    value1 = ValueGenerator.generate_value(field, db)
    assert value1 == 20  # First call returns start value
    assert field.current_number == 17  # Next value is calculated
    
    value2 = ValueGenerator.generate_value(field, db)
    assert value2 == 17
    assert field.current_number == 14
    
    value3 = ValueGenerator.generate_value(field, db)
    assert value3 == 14
    assert field.current_number == 11
    
    value4 = ValueGenerator.generate_value(field, db)
    assert value4 == 11
    assert field.current_number == 8
    
    value5 = ValueGenerator.generate_value(field, db)
    assert value5 == 8
    assert field.current_number == 20  # FIXED: Reset to start value, not start - step

def test_decrement_generation_reset_boundary(db):
    """Test decrement reset at boundary."""
    # Test case: start=10, step=2, reset=1
    field = Field(
        collection_id=1,
        collection_type=CollectionType.PERFORMANCE,
        field_name="Simple Countdown",
        value_type=ValueType.DECREMENT,
        start_number=10,
        step_number=2,
        reset_number=1
    )
    
    # Generate sequence: 10, 8, 6, 4, 2
    values = []
    for i in range(5):
        value = ValueGenerator.generate_value(field, db)
        values.append(value)
    
    # Should be [10, 8, 6, 4, 2]
    assert values == [10, 8, 6, 4, 2]
    
    # Next value would be 0, but that's < reset_number (1), so should reset to start_number (10)
    reset_value = ValueGenerator.generate_value(field, db)
    assert reset_value == 10  # Should reset to start value

def test_value_validation():
    """Test field value validation."""
    # Valid TEXT_FIXED field
    field = Field(
        collection_id=1,
        collection_type=CollectionType.PERFORMANCE,
        field_name="Valid Text",
        value_type=ValueType.TEXT_FIXED,
        fixed_value_text="test"
    )
    errors = ValueGenerator.validate_field_config(field)
    assert len(errors) == 0
    
    # Invalid TEXT_FIXED field (missing text value)
    field = Field(
        collection_id=1,
        collection_type=CollectionType.PERFORMANCE,
        field_name="Invalid Text",
        value_type=ValueType.TEXT_FIXED
        # Missing fixed_value_text
    )
    errors = ValueGenerator.validate_field_config(field)
    assert len(errors) > 0
    assert "fixed_value_text is required" in errors[0]
    
    # Invalid NUMBER_RANGE field (start > end)
    field = Field(
        collection_id=1,
        collection_type=CollectionType.PERFORMANCE,
        field_name="Invalid Range",
        value_type=ValueType.NUMBER_RANGE,
        range_start_number=100,
        range_end_number=10
    )
    errors = ValueGenerator.validate_field_config(field)
    assert len(errors) > 0
    assert "must be <=" in errors[0]
