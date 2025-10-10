import pytest
from app.models.api_key import APIKeyAllowed


def login(client, email, password):
    r = client.post('/auth/login', json={'email': email, 'password': password})
    assert r.status_code == 200


def test_folder_scoped_api_key_allows_prefix(client, db, editor_user):
    # Editor login
    login(client, 'editor@test.com', 'testpassword123')

    # Create folder
    r = client.post('/admin/folders', json={'name': 'folder-a'})
    assert r.status_code == 200
    folder = r.json()

    # Create collection under folder
    r = client.post('/admin/collections', json={'name': 'APISCOPE_COLL', 'parent_folder_id': folder['id']})
    assert r.status_code == 200

    # Add one simple field so data API can generate
    coll_id = r.json()['id']
    r = client.post(f'/admin/collections/{coll_id}/fields', json={
        'collection_type': 'Performance',
        'field_name': 'ts',
        'value_type': 'EPOCH_NOW'
    })
    assert r.status_code == 200

    # Create API key and then add folder_path scope via DB
    r = client.post('/admin/api-keys', json={'label': 'folder-scope'})
    assert r.status_code == 200
    body = r.json()
    full_key = body['key']
    key_id = body['id']

    # Insert folder_path permission directly
    db.add(APIKeyAllowed(api_key_id=key_id, folder_path=f/users/{editor_user.username}/))
    db.commit()

    # Call data API with X-API-Key
    r = client.get('/data/APISCOPE_COLL/Performance', headers={'X-API-Key': full_key})
    assert r.status_code == 200

    # Negative case: collection outside folder
    # Create a collection at root
    r = client.post('/admin/collections', json={'name': 'APISCOPE_OUTSIDE'})
    assert r.status_code == 200
    # Try data API for outside collection -> should be 403
    r = client.get('/data/APISCOPE_OUTSIDE/Performance', headers={'X-API-Key': full_key})
    assert r.status_code in (401, 403)  # unauthorized/forbidden
