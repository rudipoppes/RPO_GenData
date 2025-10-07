import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collectionsApi } from '../services/api';
import type { Collection, UpdateCollectionRequest } from '../types/api';
import CollectionDetail from './CollectionDetail';

export default function EditCollection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: ''
  });

  const collectionId = parseInt(id || '0');

  useEffect(() => {
    if (collectionId) {
      loadCollection();
    }
  }, [collectionId]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const collectionData = await collectionsApi.get(collectionId);
      setCollection(collectionData);
      setFormData({
        name: collectionData.name
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const updateData: UpdateCollectionRequest = {
        name: formData.name
      };
      
      await collectionsApi.update(collectionId, updateData);
      
      // Reload collection data
      await loadCollection();
      
      // Show success and redirect to detail view
      navigate(`/collections/${collectionId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update collection');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading collection...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Collection not found</div>
        <button
          onClick={() => navigate('/collections')}
          className="text-blue-600 hover:text-blue-500"
        >
          Back to Collections
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Edit Form */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Collection</h1>
          <p className="mt-2 text-gray-600">
            Update the collection details and manage its fields.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Collection Name *
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter collection name"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Choose a descriptive name for your data collection.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(`/collections/${collection.id}`)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Collection'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Field Management Section */}
      <div className="border-t border-gray-200 pt-8">
        <CollectionDetail />
      </div>
    </div>
  );
}
