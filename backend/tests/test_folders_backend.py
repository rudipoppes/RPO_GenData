import pytest

from app.models.user import UserRole


def login(client, email, password):
    r = client.post('/auth/login', json={'email': email, 'password': password})
    assert r.status_code == 200


def test_admin_folder_crud(client, db, admin_user):
    login(client, 'admin@test.com', 'testpassword123')

    # Create folder as admin (no parent)
    r = client.post('/admin/folders', json={'name': 'admin-root-a'})
    assert r.status_code == 200
    folder = r.json()

    # List folders (admin sees all)
    r = client.get('/admin/folders')
    assert r.status_code == 200
    items = r.json()
    assert any(f['id'] == folder['id'] for f in items)

    # Rename
    r = client.put(f/admin/folders/{folder[id]}, json={'name': 'admin-root-a-renamed'})
    assert r.status_code == 200
    assert r.json()['name'] == 'admin-root-a-renamed'

    # Delete
    r = client.delete(f/admin/folders/{folder[id]})
    assert r.status_code == 200


def test_editor_cannot_create_under_admin_folder(client, db, admin_user, editor_user):
    # Admin creates a folder
    login(client, 'admin@test.com', 'testpassword123')
    r = client.post('/admin/folders', json={'name': 'admin-root-b'})
    assert r.status_code == 200
    admin_folder_id = r.json()['id']

    # Editor attempts to create under admin's folder
    client.post('/auth/logout')
    login(client, 'editor@test.com', 'testpassword123')
    r = client.post('/admin/folders', json={'name': 'editor-child', 'parent_folder_id': admin_folder_id})
    assert r.status_code == 403
