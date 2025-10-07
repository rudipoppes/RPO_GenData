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
      setLoading(true);
      const data = await collectionsApi.list();
      setCollections(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading collections...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
            <p className="mt-2 text-gray-600">
              Manage your data collections and their field structures
            </p>
          </div>
          <Link
            to="/collections/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            New Collection
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          {collections.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7l-14 14" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No collections</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new collection.</p>
              <div className="mt-6">
                <Link
                  to="/collections/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Collection
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7l-14 14" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/collections/${collection.id}`} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-lg font-medium text-gray-900 truncate">{collection.name}</p>
                        <p className="text-sm text-gray-500">
                          {collection.fields?.length || 0} field{(collection.fields?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-xs text-gray-500">
                      Created: {new Date(collection.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Updated: {new Date(collection.updated_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      to={`/collections/${collection.id}`}
                      className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/collections/${collection.id}/edit`}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
