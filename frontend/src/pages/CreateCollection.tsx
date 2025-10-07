import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collectionsApi } from '../services/api';
import type { CreateCollectionRequest, UpdateCollectionRequest } from '../types/api';

export default function CreateCollection() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let collection;
      if (isEdit) {
        const updateData: UpdateCollectionRequest = {
          name: formData.name
        };
        collection = await collectionsApi.update(parseInt(id!), updateData);
      } else {
        const createData: CreateCollectionRequest = {
          name: formData.name
        };
        collection = await collectionsApi.create(createData);
      }

      // Navigate to the collection detail page for field management
      navigate(`/collections/${collection.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'create'} collection`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Collection' : 'New Collection'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEdit 
            ? 'Update the collection details and manage its fields.' 
            : 'Create a new collection and define its data structure.'
          }
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
              onClick={() => navigate('/collections')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Collection' : 'Create Collection')}
            </button>
          </div>
        </form>
      </div>
      
      {isEdit && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            After updating the collection, you can manage its fields below.
          </p>
        </div>
      )}
      
      {!isEdit && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            After creating the collection, you'll be redirected to add fields and define the data structure.
          </p>
        </div>
      )}
    </div>
  );
}
