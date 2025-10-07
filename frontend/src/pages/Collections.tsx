import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collectionsApi } from '../services/api';
import type { Collection } from '../types/api';

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await collectionsApi.list();
      setCollections(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) {
      return;
    }

    try {
      await collectionsApi.delete(id);
      await loadCollections();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete collection');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
          <p className="mt-2 text-gray-600">
            Manage your data collections and their fields
          </p>
        </div>
        <Link
          to="/collections/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          New Collection
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No collections found</div>
          <Link
            to="/collections/new"
            className="text-blue-600 hover:text-blue-500"
          >
            Create your first collection
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {collections.map((collection) => (
              <li key={collection.id}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <Link
                      to={`/collections/${collection.id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="font-medium text-gray-900">
                        {collection.name}
                      </div>
                      {collection.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {collection.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Created {new Date(collection.created_at).toLocaleDateString()}
                      </div>
                    </Link>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/collections/${collection.id}`}
                      className="text-blue-600 hover:text-blue-500 text-sm"
                    >
                      View
                    </Link>
                    <Link
                      to={`/collections/${collection.id}/edit`}
                      className="text-gray-600 hover:text-gray-500 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(collection.id)}
                      className="text-red-600 hover:text-red-500 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
