import React, { useState, useEffect } from 'react';
import { APIKey, CreateAPIKeyRequest, Collection } from '../types/api';
import { collectionsApi, apiKeysApi } from '../services/api';

interface EditApiKeyFormProps {
  apiKey: APIKey;
  onSubmit: (data: CreateAPIKeyRequest) => Promise<APIKey | null>;
  onCancel: () => void;
}

export function EditApiKeyForm({ apiKey, onSubmit, onCancel }: EditApiKeyFormProps) {
  const [name, setName] = useState(apiKey.label);
  const [expiresAt, setExpiresAt] = useState(
    apiKey.expires_at ? new Date(apiKey.expires_at).toISOString().split('T')[0] : ''
  );
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [allCollections, setAllCollections] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [apiKey.id]);

  const loadData = async () => {
    try {
      // Load all collections
      const collectionsData = await collectionsApi.list();
      setCollections(collectionsData);
      
      // Load current API key collections
      const keyCollections = await apiKeysApi.getAllowedCollections(apiKey.id);
      if (keyCollections.length === 0) {
        setAllCollections(true);
      } else {
        setAllCollections(false);
        setSelectedCollections(keyCollections.map(c => c.collection_id));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const keyData: CreateAPIKeyRequest = {
      label: name,
      expires_at: expiresAt ? expiresAt + 'T23:59:59.000Z' : undefined,
      collection_ids: allCollections ? undefined : selectedCollections
    };

    const result = await onSubmit(keyData);
    if (result) {
      onCancel();
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

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Edit API Key</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            type="text"
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Collection Access
          </label>
          {loading ? (
            <div className="text-sm text-gray-500">Loading current settings...</div>
          ) : (
            <>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="editCollectionAccess"
                    checked={allCollections}
                    onChange={() => setAllCollections(true)}
                    className="rounded-full border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    All Collections (current and future)
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="editCollectionAccess"
                    checked={!allCollections}
                    onChange={() => setAllCollections(false)}
                    className="rounded-full border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Specific Collections Only
                  </span>
                </label>
              </div>

              {!allCollections && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {collections.length === 0 ? (
                    <div className="text-sm text-gray-500">No collections available</div>
                  ) : (
                    collections.map((collection) => (
                      <label key={collection.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCollections.includes(collection.id)}
                          onChange={() => handleCollectionToggle(collection.id)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {collection.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label htmlFor="edit-expires-at" className="block text-sm font-medium text-gray-700">
            Expiration Date (Optional)
          </label>
          <input
            type="date"
            id="edit-expires-at"
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
            disabled={submitting || loading || !name.trim() || (!allCollections && selectedCollections.length === 0)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Update API Key'}
          </button>
        </div>
      </form>
    </div>
  );
}
