import { useState, useEffect } from 'react';
import { apiKeysApi } from '../services/api';
import type { APIKey, CreateAPIKeyRequest, CreateAPIKeyResponse } from '../types/api';

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
                          {apiKey.key_name}
                        </div>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          apiKey.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {apiKey.is_active ? 'Active' : 'Revoked'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <div>Key: {apiKey.key_hash.substring(0, 8)}••••</div>
                        <div>Scopes: {'API Access'}</div>
                        <div>Created: {new Date(apiKey.created_at).toLocaleDateString()}</div>
                        {apiKey.expires_at && (
                          <div>Expires: {new Date(apiKey.expires_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {apiKey.is_active && (
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
  const [scopes, setScopes] = useState<string[]>(['read']);
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateAPIKeyResponse | null>(null);

  const availableScopes = ['read', 'write', 'admin'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const keyData: CreateAPIKeyRequest = {
      name,
      scopes,
      
      expires_at: expiresAt || undefined
    };

    const result = await onSubmit(keyData);
    if (result) {
      setCreatedKey(result);
    }
    setSubmitting(false);
  };

  const handleScopeChange = (scope: string, checked: boolean) => {
    if (checked) {
      setScopes([...scopes, scope]);
    } else {
      setScopes(scopes.filter(s => s !== scope));
    }
  };

  if (createdKey) {
    return (
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">API Key Created</h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Your API key has been created. Make sure to copy it now - you won't be able to see it again.
            </p>
            <div className="bg-gray-50 p-3 rounded-md border">
              <code className="text-sm font-mono">{createdKey.api_key}</code>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Done
            </button>
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
            Name
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scopes
          </label>
          <div className="space-y-2">
            {availableScopes.map((scope) => (
              <label key={scope} className="flex items-center">
                <input
                  type="checkbox"
                  checked={scopes.includes(scope)}
                  onChange={(e) => handleScopeChange(scope, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{scope}</span>
              </label>
            ))}
          </div>
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
            disabled={submitting || !name.trim() || scopes.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create API Key'}
          </button>
        </div>
      </form>
    </div>
  );
}
