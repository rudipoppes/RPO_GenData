import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collectionsApi, apiKeysApi } from '../services/api';
import type { Collection, APIKey } from '../types/api';

export default function Dashboard() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [collectionsData, apiKeysData] = await Promise.all([
          collectionsApi.list(),
          apiKeysApi.list(),
        ]);
        setCollections(collectionsData);
        setApiKeys(apiKeysData.filter(key => key.is_active));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Collections',
      value: collections.length,
      href: '/collections',
      description: 'Data collections configured'
    },
    {
      name: 'Active API Keys',
      value: apiKeys.length,
      href: '/api-keys',
      description: 'API keys currently active'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your data generation service
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
            <div className="text-lg font-medium text-gray-900 mt-1">
              {stat.name}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {stat.description}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Collections</h2>
          </div>
          <div className="p-6">
            {collections.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No collections yet.{' '}
                <Link to="/collections" className="text-blue-600 hover:text-blue-500">
                  Create your first collection
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {collections.slice(0, 5).map((collection) => (
                  <div key={collection.id} className="flex justify-between items-center">
                    <div>
                      <Link
                        to={`/collections/${collection.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {collection.name}
                      </Link>
                      {collection.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(collection.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {collections.length > 5 && (
                  <Link
                    to="/collections"
                    className="block text-center text-sm text-blue-600 hover:text-blue-500 pt-3"
                  >
                    View all collections
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <Link
                to="/collections/new"
                className="block p-3 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700"
              >
                <div className="font-medium">Create Collection</div>
                <div className="text-sm">Set up a new data collection with fields</div>
              </Link>
              <Link
                to="/api-keys/new"
                className="block p-3 rounded-md bg-green-50 hover:bg-green-100 text-green-700"
              >
                <div className="font-medium">Generate API Key</div>
                <div className="text-sm">Create a new API key for data access</div>
              </Link>
              <Link
                to="/samples"
                className="block p-3 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700"
              >
                <div className="font-medium">View Samples</div>
                <div className="text-sm">See integration examples and code samples</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
