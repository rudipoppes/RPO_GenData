#!/usr/bin/env python3
"""
Quick Backend Test Script for RPO_GenData
Run this to verify the backend is working correctly.
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import requests
import time
import json

BASE_URL = "http://localhost:8088"
session = requests.Session()

def test_backend():
    print("🧪 Testing RPO_GenData Backend...")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing health check...")
    try:
        response = session.get(f"{BASE_URL}/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print("✅ Health check passed")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test 2: Login
    print("\n2. Testing admin login...")
    try:
        login_data = {"email": "admin@example.com", "password": "admin123"}
        response = session.post(f"{BASE_URL}/auth/login", json=login_data)
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        user_data = response.json()
        print(f"✅ Logged in as: {user_data['user']['email']} ({user_data['user']['role']})")
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return False
    
    # Test 3: Create collection
    print("\n3. Testing collection creation...")
    try:
        collection_data = {"name": "Test Collection"}
        response = session.post(f"{BASE_URL}/admin/collections", json=collection_data)
        assert response.status_code == 200, f"Collection creation failed: {response.status_code}"
        collection = response.json()
        collection_id = collection["id"]
        print(f"✅ Created collection: {collection['name']} (ID: {collection_id})")
    except Exception as e:
        print(f"❌ Collection creation failed: {e}")
        return False
    
    # Test 4: Create fields
    print("\n4. Testing field creation...")
    fields_to_create = [
        {
            "collection_type": "Performance",
            "field_name": "Temperature",
            "value_type": "NUMBER_RANGE",
            "range_start_number": 20,
            "range_end_number": 35
        },
        {
            "collection_type": "Performance", 
            "field_name": "Status",
            "value_type": "TEXT_FIXED",
            "fixed_value_text": "Active"
        },
        {
            "collection_type": "Performance",
            "field_name": "Counter",
            "value_type": "INCREMENT",
            "start_number": 100,
            "step_number": 1,
            "reset_number": 110
        }
    ]
    
    try:
        for field_data in fields_to_create:
            response = session.post(f"{BASE_URL}/admin/collections/{collection_id}/fields", json=field_data)
            assert response.status_code == 200, f"Field creation failed: {response.status_code}"
            field = response.json()
            print(f"✅ Created field: {field['field_name']} ({field['value_type']})")
    except Exception as e:
        print(f"❌ Field creation failed: {e}")
        return False
    
    # Test 5: Create API key
    print("\n5. Testing API key creation...")
    try:
        api_key_data = {"label": "Test API Key"}
        response = session.post(f"{BASE_URL}/admin/api-keys", json=api_key_data)
        assert response.status_code == 200, f"API key creation failed: {response.status_code}"
        api_key_response = response.json()
        api_key = api_key_response["key"]
        print(f"✅ Created API key: {api_key_response['key_prefix']}*** (Label: {api_key_response['label']})")
    except Exception as e:
        print(f"❌ API key creation failed: {e}")
        return False
    
    # Test 6: Generate data via public API
    print("\n6. Testing data generation...")
    try:
        headers = {"X-API-Key": api_key}
        response = requests.get(f"{BASE_URL}/api/Test%20Collection/Performance", headers=headers)
        assert response.status_code == 200, f"Data generation failed: {response.status_code}"
        data = response.json()
        print(f"✅ Generated data for '{data['collection']}' ({data['type']}):")
        print(f"   Generated at: {data['generated_at_epoch']}")
        for field_name, value in data['data'].items():
            print(f"   {field_name}: {value}")
    except Exception as e:
        print(f"❌ Data generation failed: {e}")
        return False
    
    # Test 7: Generate data multiple times to test INCREMENT
    print("\n7. Testing stateful increment...")
    try:
        for i in range(3):
            headers = {"X-API-Key": api_key}
            response = requests.get(f"{BASE_URL}/api/Test%20Collection/Performance", headers=headers)
            data = response.json()
            counter_value = data['data']['Counter']
            print(f"   Call {i+1}: Counter = {counter_value}")
            time.sleep(0.1)  # Small delay between calls
    except Exception as e:
        print(f"❌ Increment test failed: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 ALL TESTS PASSED! Backend is working correctly.")
    print("\nYou can now:")
    print(f"• Access API docs: {BASE_URL}/api/docs")
    print(f"• Use the API with key: {api_key[:16]}...")
    print(f"• Login to admin (when frontend is ready): admin@example.com / admin123")
    return True

if __name__ == "__main__":
    success = test_backend()
    sys.exit(0 if success else 1)
