import pytest


def login(client, email, password):
    r = client.post('/auth/login', json={'email': email, 'password': password})
    assert r.status_code == 200


def test_editor_create_move_list_by_folder(client, db, editor_user):
    login(client, 'editor@test.com', 'testpassword123')

    # Create a root folder for editor (no parent)
    r = client.post('/admin/folders', json={'name': 'editor-root'})
    assert r.status_code == 200
    root_id = r.json()['id']

    # Create collection under folder
    r = client.post('/admin/collections', json={'name': 'hier-coll', 'parent_folder_id': root_id})
    assert r.status_code == 200
    coll_id = r.json()['id']

    # List by folder
    r = client.get(f'/admin/collections?parent_folder_id={root_id}')
    assert r.status_code == 200
    items = r.json()
    assert any(c['id'] == coll_id for c in items)

    # Move to root
    r = client.post(f'/admin/collections/{coll_id}/move', json={'parent_folder_id': None})
    assert r.status_code == 200

    # Ensure no longer under folder
    r = client.get(f'/admin/collections?parent_folder_id={root_id}')
    assert r.status_code == 200
    items = r.json()
    assert all(c['id'] != coll_id for c in items)
