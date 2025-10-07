import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collectionsApi, apiKeysApi } from '../services/api';
import type { Collection, APIKey } from '../types/api';

export default function Dashboard() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [collectionsData, apiKeysData] = await Promise.all([
        collectionsApi.list(),
        apiKeysApi.list()
      ]);
      setCollections(collectionsData);
      setApiKeys(apiKeysData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search function across collections and fields
  const filteredCollections = collections.filter(collection => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    
    // Search collection name and description
    if (collection.name.toLowerCase().includes(term) || 
        collection.description?.toLowerCase().includes(term)) {
      return true;
    }
    
    // Search in field names, types, and field values (if fields exist)
    if (collection.fields && collection.fields.length > 0) {
      return collection.fields.some(field => 
        field.field_name.toLowerCase().includes(term) ||
        field.value_type.toLowerCase().includes(term) ||
        (field.fixed_value_text && field.fixed_value_text.toLowerCase().includes(term)) ||
        (field.fixed_value_number && field.fixed_value_number.toString().includes(term)) ||
        (field.fixed_value_float && field.fixed_value_float.toString().includes(term)) ||
        (field.range_start_number && field.range_start_number.toString().includes(term)) ||
        (field.range_end_number && field.range_end_number.toString().includes(term)) ||
        (field.range_start_float && field.range_start_float.toString().includes(term)) ||
        (field.range_end_float && field.range_end_float.toString().includes(term)) ||
        (field.start_number && field.start_number.toString().includes(term)) ||
        (field.step_number && field.step_number.toString().includes(term)) ||
        (field.reset_number && field.reset_number.toString().includes(term))
      );
    }
    
    return false;
  });

  const getSearchMatchType = (collection: Collection) => {
    if (!searchTerm) return null;
    const term = searchTerm.toLowerCase();
    
    if (collection.name.toLowerCase().includes(term) || 
        collection.description?.toLowerCase().includes(term)) {
      return 'collection';
    }
    
    return 'field';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your data collections and API access
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="max-w-lg">
          <label htmlFor="search" className="sr-only">Search collections and fields</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="search"
              name="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search collections and fields..."
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <p className="mt-2 text-sm text-gray-600">
              Found {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7l-14 14" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Collections</dt>
                  <dd className="text-lg font-medium text-gray-900">{collections.length}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/collections/new" className="font-medium text-blue-600 hover:text-blue-500">
                Create new collection
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2m0 0V7a2 2 0 012-2m0 0v4h4V7a2 2 0 00-2-2H9z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">API Keys</dt>
                  <dd className="text-lg font-medium text-gray-900">{apiKeys.length}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/api-keys" className="font-medium text-blue-600 hover:text-blue-500">
                Manage API keys
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Fields</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {collections.reduce((acc, collection) => acc + (collection.fields?.length || 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">Across all collections</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Collections */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Collections</h2>
            <Link
              to="/collections/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              New Collection
            </Link>
          </div>
        </div>
        <div className="p-6">
          {filteredCollections.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">
                {searchTerm ? 'No collections match your search' : 'No collections found'}
              </div>
              <p className="text-sm text-gray-400">
                {searchTerm ? 'Try a different search term' : 'Create your first collection to start generating data'}
              </p>
              {!searchTerm && (
                <Link
                  to="/collections/new"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                >
                  Create Collection
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCollections.map((collection) => {
                const matchType = getSearchMatchType(collection);
                return (
                  <div
                    key={collection.id}
                    className={`relative rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow ${
                      matchType ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7l-14 14" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/collections/${collection.id}`} className="focus:outline-none">
                          <span className="absolute inset-0" aria-hidden="true" />
                          <p className="text-sm font-medium text-gray-900 truncate">{collection.name}</p>
                          <p className="text-sm text-gray-500">
                            {collection.fields?.length || 0} field{(collection.fields?.length || 0) !== 1 ? 's' : ''}
                          {collection.owner_username && (
                            <p className="text-xs text-gray-400">
                              Owner: {collection.owner_username}
                            </p>
                          )}
                          </p>
                          {matchType === 'field' && searchTerm && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                              Match in fields
                            </span>
                          )}
                        </Link>
                      </div>
                      <div className="flex-shrink-0">
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/collections/new"
              className="relative rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="mt-2 block text-sm font-medium text-gray-900">Create Collection</span>
                <span className="mt-1 block text-sm text-gray-500">Set up a new data collection</span>
              </div>
            </Link>

            <Link
              to="/api-keys"
              className="relative rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2m0 0V7a2 2 0 012-2m0 0v4h4V7a2 2 0 00-2-2H9z" />
                </svg>
                <span className="mt-2 block text-sm font-medium text-gray-900">Generate API Key</span>
                <span className="mt-1 block text-sm text-gray-500">Create keys for API access</span>
              </div>
            </Link>

            <div className="relative rounded-lg border-2 border-dashed border-gray-300 p-6 opacity-50 cursor-not-allowed">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="mt-2 block text-sm font-medium text-gray-900">View Analytics</span>
                <span className="mt-1 block text-sm text-gray-500">Coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
