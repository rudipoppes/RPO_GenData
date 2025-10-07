import { useState, useEffect } from 'react';
import { apiKeysApi, collectionsApi } from '../services/api';
import type { APIKey, CreateAPIKeyRequest, CreateAPIKeyResponse, Collection } from '../types/api';

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setError('');
      const data = await apiKeysApi.list();
      setApiKeys(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (keyData: CreateAPIKeyRequest): Promise<CreateAPIKeyResponse | null> => {
    try {
      const newKey = await apiKeysApi.create(keyData);
      await loadApiKeys();
      setShowCreateForm(false);
      return newKey;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create API key');
      return null;
    }
  };

  const handleRevoke = async (id: number) => {
    if (!window.confirm('Are you sure you want to revoke this API key?')) {
      return;
    }

    try {
      await apiKeysApi.revoke(id);
      await loadApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to revoke API key');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      await apiKeysApi.delete(id);
      await loadApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete API key');
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
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="mt-2 text-gray-600">
            Manage API keys for external data access
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create API Key
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {showCreateForm && (
        <CreateApiKeyForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {apiKeys.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No API keys found</div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="text-blue-600 hover:text-blue-500"
          >
            Create your first API key
          </button>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {apiKeys.map((apiKey) => (
              <li key={apiKey.id}>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="font-medium text-gray-900">
                          {apiKey.label}
                        </div>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          apiKey.status === "active" 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {apiKey.status === 'active' ? 'Active' : 'Revoked'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <div>Key: {apiKey.key_prefix}••••</div>
                        <div>Scopes: {'API Access'}</div>
                        <div>Created: {new Date(apiKey.created_at).toLocaleDateString()}</div>
                        {apiKey.expires_at && (
                          <div>Expires: {new Date(apiKey.expires_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {apiKey.status === "active" && (
                        <button
                          onClick={() => handleRevoke(apiKey.id)}
                          className="text-yellow-600 hover:text-yellow-500 text-sm"
                        >
                          Revoke
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(apiKey.id)}
                        className="text-red-600 hover:text-red-500 text-sm"
                      >
                        Delete
                      </button>
                    </div>
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

function CreateApiKeyForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (data: CreateAPIKeyRequest) => Promise<CreateAPIKeyResponse | null>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [allCollections, setAllCollections] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateAPIKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await collectionsApi.list();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const keyData: CreateAPIKeyRequest = {
      label: name,
      expires_at: expiresAt || undefined,
      collection_ids: allCollections ? undefined : selectedCollections
    };

    const result = await onSubmit(keyData);
    if (result) {
      setCreatedKey(result);
    }
    setSubmitting(false);
  };

  const handleCollectionToggle = (collectionId: number) => {
    if (selectedCollections.includes(collectionId)) {
      setSelectedCollections(selectedCollections.filter(id => id !== collectionId));
    } else {
      setSelectedCollections([...selectedCollections, collectionId]);
    }
  };

  const copyToClipboard = async () => {
    if (createdKey) {
      try {
        await navigator.clipboard.writeText(createdKey.key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  const handleComplete = () => {
    if (acknowledged) {
      onCancel();
    }
  };

  // Show created key modal with security warning
  if (createdKey) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2m0 0V7a2 2 0 012-2m0 0v4h4V7a2 2 0 00-2-2H9z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
              API Key Created Successfully
            </h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Important Security Notice
                  </h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This is the only time you'll see the complete API key. Please copy it now and store it securely. If you lose this key, you'll need to create a new one.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your API Key:
              </label>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-50 p-3 rounded-l-md border border-gray-300">
                  <code className="text-sm font-mono break-all">{createdKey.key}</code>
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-3 border border-l-0 border-gray-300 rounded-r-md transition-colors ${
                    copied 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-600">
                  I understand this is the only time I will see the complete API key and I have saved it securely.
                </span>
              </label>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleComplete}
                disabled={!acknowledged}
                className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  acknowledged 
                    ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Create API Key</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            placeholder="Enter API key name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Collection Access
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="collectionAccess"
                checked={allCollections}
                onChange={() => setAllCollections(true)}
                className="rounded-full border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">
                All Collections (current and future)
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="collectionAccess"
                checked={!allCollections}
                onChange={() => setAllCollections(false)}
                className="rounded-full border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">
                Specific Collections Only
              </span>
            </label>
          </div>

          {!allCollections && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {collectionsLoading ? (
                <div className="text-sm text-gray-500">Loading collections...</div>
              ) : collections.length === 0 ? (
                <div className="text-sm text-gray-500">No collections available</div>
              ) : (
                collections.map((collection) => (
                  <label key={collection.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(collection.id)}
                      onChange={() => handleCollectionToggle(collection.id)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {collection.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700">
            Expiration Date (Optional)
          </label>
          <input
            type="date"
            id="expires_at"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !name.trim() || (!allCollections && selectedCollections.length === 0)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create API Key'}
          </button>
        </div>
      </form>
    </div>
  );
}
