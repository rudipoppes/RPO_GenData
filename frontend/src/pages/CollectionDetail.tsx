import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collectionsApi, fieldsApi } from '../services/api';
import type { Collection, Field } from '../types/api';

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [activeTab, setActiveTab] = useState<'Performance' | 'Configuration'>('Performance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddField, setShowAddField] = useState(false);
  
  // New field form state
  const [newField, setNewField] = useState({
    name: '',
    value_type: 'TEXT_FIXED' as const
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
      setFields(collectionData.fields || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!window.confirm('Are you sure you want to delete this field?')) {
      return;
    }

    try {
      await fieldsApi.delete(collectionId, fieldId);
      await loadCollection();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete field');
    }
  };

  const handleAddField = async () => {
    try {
      await fieldsApi.create(collectionId, {
        collection_type: activeTab,
        field_name: newField.name,
        value_type: newField.value_type
      });
      
      // Reset form
      setNewField({
        name: '',
        value_type: 'TEXT_FIXED'
      });
      setShowAddField(false);
      await loadCollection();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create field');
    }
  };

  const getFilteredFields = () => {
    return fields.filter(_field => {
      // For now, show all fields under both tabs
      // This can be enhanced to filter by collection_type when that field is available
      return true;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Collection not found</div>
        <Link to="/collections" className="text-blue-600 hover:text-blue-500">
          Back to Collections
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
            {collection.description && (
              <p className="mt-2 text-gray-600">{collection.description}</p>
            )}
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/collections/${collection.id}/edit`}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Edit Collection
            </Link>
            <button
              onClick={() => navigate('/collections')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back to Collections
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['Performance', 'Configuration'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Fields Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {activeTab} Fields
          </h2>
          <button
            onClick={() => setShowAddField(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Field
          </button>
        </div>

        <div className="p-6">
          {getFilteredFields().length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No {activeTab.toLowerCase()} fields defined</div>
              <p className="text-sm text-gray-400">Add fields to define the data structure for this collection</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Field Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Configuration
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredFields().map((field) => (
                    <tr key={field.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {field.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {field.value_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {JSON.stringify(field.value_config)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Field Modal/Form */}
      {showAddField && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Field</h3>
                <button
                  onClick={() => setShowAddField(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Field Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={newField.name}
                    onChange={(e) => setNewField({...newField, name: e.target.value})}
                    placeholder="Enter field name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Value Type</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={newField.value_type}
                    onChange={(e) => setNewField({...newField, value_type: e.target.value as any})}
                  >
                    <option value="TEXT_FIXED">Fixed Text</option>
                    <option value="NUMBER_FIXED">Fixed Number</option>
                    <option value="FLOAT_FIXED">Fixed Float</option>
                    <option value="NUMBER_RANGE">Number Range</option>
                    <option value="FLOAT_RANGE">Float Range</option>
                    <option value="EPOCH_NOW">Current Timestamp</option>
                    <option value="INCREMENT">Auto Increment</option>
                    <option value="DECREMENT">Auto Decrement</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddField(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddField}
                  disabled={!newField.name}
                  className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Usage Examples */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">API Usage</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Use these endpoints to generate data from this collection:
          </p>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm">
              <div className="mb-2">
                <strong>Performance Data:</strong>
              </div>
              <code className="text-blue-600">
                GET /api/data/{encodeURIComponent(collection.name)}/Performance
              </code>
            </div>
            <div className="text-sm mt-4">
              <div className="mb-2">
                <strong>Configuration Data:</strong>
              </div>
              <code className="text-blue-600">
                GET /api/data/{encodeURIComponent(collection.name)}/Configuration
              </code>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: These endpoints require an API key. Generate one in the <Link to="/api-keys" className="text-blue-600 hover:text-blue-500">API Keys</Link> section.
          </p>
        </div>
      </div>
    </div>
  );
}
