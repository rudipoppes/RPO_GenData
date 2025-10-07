import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collectionsApi } from '../services/api';

export default function CreateCollection() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && id) {
      loadCollection(parseInt(id));
    }
  }, [isEditing, id]);

  const loadCollection = async (collectionId: number) => {
    try {
      setLoading(true);
      const collection = await collectionsApi.get(collectionId);
      setName(collection.name);
      setDescription(collection.description || '');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const collectionData = { name, description: description || undefined };
      
      if (isEditing && id) {
        await collectionsApi.update(parseInt(id), collectionData);
      } else {
        await collectionsApi.create(collectionData);
      }
      
      navigate('/collections');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/collections');
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Collection' : 'Create New Collection'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEditing ? 'Update your collection details' : 'Add a new data collection to your service'}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Collection Name *
            </label>
            <input
              type="text"
              id="name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="Enter collection name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              A unique name for your collection (e.g., "Truck Data01", "Server Metrics")
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="Optional description of this collection"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Describe what kind of data this collection will generate
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Collection' : 'Create Collection')}
            </button>
          </div>
        </form>
      </div>

      {isEditing && !loading && (
        <div className="mt-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Next Steps</h3>
            <p className="text-sm text-gray-600 mb-4">
              After updating your collection, you can:
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Add fields to define the data structure</li>
              <li>• Configure field types and value generation</li>
              <li>• Test your collection with sample API calls</li>
            </ul>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="mt-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">What's Next?</h3>
            <p className="text-sm text-gray-600 mb-4">
              After creating your collection, you'll be able to:
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Add fields with different data types (string, number, boolean, etc.)</li>
              <li>• Configure value generation (fixed values, ranges, patterns)</li>
              <li>• Set up Performance and Configuration data types</li>
              <li>• Generate API keys for external access</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
