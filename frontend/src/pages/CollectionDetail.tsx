import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collectionsApi, fieldsApi, spikeSchedulesApi } from '../services/api';
import type { Collection, Field, CreateFieldRequest, SpikeSchedule } from '../types/api';

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [spikeSchedules, setSpikeSchedules] = useState<SpikeSchedule[]>([]);
  const [activeTab, setActiveTab] = useState<'Performance' | 'Configuration' | 'Spikes'>('Performance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [showSnippetModal, setShowSnippetModal] = useState(false);
  const [snippetField, setSnippetField] = useState<Field | null>(null);
  const [copied, setCopied] = useState(false);
  
  // New field form state
  const [newField, setNewField] = useState<CreateFieldRequest>({
    collection_type: 'Performance',
    field_name: '',
    value_type: 'TEXT_FIXED'
  });

  const collectionId = parseInt(id || '0');

  // Helper function to convert UTC datetime string to local timezone string for display
  const convertUTCToLocalString = (utcDateStr: string): string => {
    // Convert string to Date object and return local timezone representation
    const utcDate = new Date(utcDateStr);
    return utcDate.toLocaleString();
  };

  useEffect(() => {
    if (collectionId) {
      loadCollection();
    }
  }, [collectionId]);

  useEffect(() => {
    if (activeTab === 'Performance' || activeTab === 'Configuration') {
      setNewField(prev => ({ ...prev, collection_type: activeTab }));
    }
  }, [activeTab]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const collectionData = await collectionsApi.get(collectionId);
      setCollection(collectionData);
      setFields(collectionData.fields || []);
      
      // Load spike schedules for this collection
      const schedules = await spikeSchedulesApi.listByCollection(collectionId);
      setSpikeSchedules(schedules);
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

  const handleShowSnippet = (field: Field) => {
    setSnippetField(field);
    setShowSnippetModal(true);
  };

  const generateSnippetYAML = (field: Field) => {
    const collectionType = field.collection_type;
    const fieldName = field.field_name;

    return `low_code:
  version: 2
  steps:
    - http:
        method: GET
        uri: /\${silo_comp_name}/${collectionType}
        verify: false
    - json
    - jmespath:
        value: "data.${fieldName}"`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-HTTPS contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      alert("Failed to copy to clipboard. Please select and copy the snippet manually.");
    }
  };

  const handleAddField = async () => {
    try {
      if (editingField) {
        // Update existing field
        await fieldsApi.update(collectionId, editingField.id, newField);
      } else {
        // Create new field
        const fieldData: CreateFieldRequest = {
          collection_type: activeTab === 'Spikes' ? 'Performance' : activeTab,
          field_name: newField.field_name,
          value_type: newField.value_type,
          ...(newField.fixed_value_text && { fixed_value_text: newField.fixed_value_text }),
          ...(newField.fixed_value_number !== undefined && { fixed_value_number: newField.fixed_value_number }),
          ...(newField.fixed_value_float !== undefined && { fixed_value_float: newField.fixed_value_float }),
          ...(newField.range_start_number !== undefined && { range_start_number: newField.range_start_number }),
          ...(newField.range_end_number !== undefined && { range_end_number: newField.range_end_number }),
          ...(newField.range_start_float !== undefined && { range_start_float: newField.range_start_float }),
          ...(newField.range_end_float !== undefined && { range_end_float: newField.range_end_float }),
          ...(newField.float_precision !== undefined && { float_precision: newField.float_precision }),
          ...(newField.start_number !== undefined && { start_number: newField.start_number }),
          ...(newField.step_number !== undefined && { step_number: newField.step_number }),
          ...(newField.reset_number !== undefined && { reset_number: newField.reset_number }),
          ...(newField.current_number !== undefined && { current_number: newField.current_number })
        };
        await fieldsApi.create(collectionId, fieldData);
      }
      await loadCollection();
      setShowAddField(false);
                  setEditingField(null);
      setEditingField(null);
      setNewField({
        collection_type: activeTab === 'Spikes' ? 'Performance' : activeTab,
        field_name: "",
        value_type: "TEXT_FIXED"
      });
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${editingField ? "update" : "create"} field`);
    }
  };

  const getFilteredFields = () => {
    if (activeTab === 'Spikes') return [];
    return fields.filter(field => field.collection_type === activeTab);
  };

  const renderFieldConfiguration = (field: Field) => {
    const config: string[] = [];
    
    switch (field.value_type) {
      case 'TEXT_FIXED':
        if (field.fixed_value_text) config.push(`Text: "${field.fixed_value_text}"`);
        break;
      case 'NUMBER_FIXED':
        if (field.fixed_value_number !== undefined) config.push(`Number: ${field.fixed_value_number}`);
        break;
      case 'FLOAT_FIXED':
        if (field.fixed_value_float !== undefined) config.push(`Float: ${field.fixed_value_float}`);
        break;
      case 'NUMBER_RANGE':
        if (field.range_start_number !== undefined && field.range_end_number !== undefined) {
          config.push(`Range: ${field.range_start_number} - ${field.range_end_number}`);
        }
        break;
      case 'FLOAT_RANGE':
        if (field.range_start_float !== undefined && field.range_end_float !== undefined) {
          config.push(`Range: ${field.range_start_float} - ${field.range_end_float}`);
          config.push(`Precision: ${field.float_precision || 2}`);
        }
        break;
      case 'INCREMENT':
      case 'DECREMENT':
        if (field.start_number !== undefined) config.push(`Start: ${field.start_number}`);
        if (field.step_number !== undefined) config.push(`Step: ${field.step_number}`);
        if (field.reset_number !== undefined) config.push(`Reset: ${field.reset_number}`);
        if (field.current_number !== undefined) config.push(`Current: ${field.current_number}`);
        break;
      case 'EPOCH_NOW':
        config.push('Current timestamp');
        break;
    }
    
    return config.length > 0 ? config.join(', ') : 'No configuration';
  };

  const renderFieldConfigInputs = () => {
    switch (newField.value_type) {
      case 'TEXT_FIXED':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Fixed Text Value *</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={newField.fixed_value_text || ''}
              onChange={(e) => setNewField({...newField, fixed_value_text: e.target.value})}
              placeholder="Enter text value"
            />
          </div>
        );
        
      case 'NUMBER_FIXED':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Fixed Number Value *</label>
            <input
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={newField.fixed_value_number ?? ''}
              onChange={(e) => setNewField({...newField, fixed_value_number: parseInt(e.target.value)})}
              placeholder="Enter number value"
            />
          </div>
        );
        
      case 'FLOAT_FIXED':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Fixed Float Value *</label>
            <input
              type="number"
              step="any"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={newField.fixed_value_float ?? ''}
              onChange={(e) => setNewField({...newField, fixed_value_float: parseFloat(e.target.value)})}
              placeholder="Enter float value"
            />
          </div>
        );
        
      case 'NUMBER_RANGE':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Number *</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={newField.range_start_number ?? ''}
                onChange={(e) => setNewField({...newField, range_start_number: parseInt(e.target.value)})}
                placeholder="Min value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Number *</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={newField.range_end_number ?? ''}
                onChange={(e) => setNewField({...newField, range_end_number: parseInt(e.target.value)})}
                placeholder="Max value"
              />
            </div>
          </div>
        );
        
      case 'FLOAT_RANGE':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Float *</label>
                <input
                  type="number"
                  step="any"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={newField.range_start_float ?? ''}
                  onChange={(e) => setNewField({...newField, range_start_float: parseFloat(e.target.value)})}
                  placeholder="Min value"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Float *</label>
                <input
                  type="number"
                  step="any"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={newField.range_end_float ?? ''}
                  onChange={(e) => setNewField({...newField, range_end_float: parseFloat(e.target.value)})}
                  placeholder="Max value"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Float Precision</label>
              <input
                type="number"
                min="0"
                max="10"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={newField.float_precision || 2}
                onChange={(e) => setNewField({...newField, float_precision: parseInt(e.target.value)})}
                placeholder="Decimal places"
              />
            </div>
          </div>
        );
        
      case 'INCREMENT':
      case 'DECREMENT':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Value *</label>
                <input
                  type="number"
                  step="any"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={newField.start_number ?? ''}
                  onChange={(e) => setNewField({...newField, start_number: parseFloat(e.target.value)})}
                  placeholder="Starting number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Step Value *</label>
                <input
                  type="number"
                  step="any"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={newField.step_number ?? ''}
                  onChange={(e) => setNewField({...newField, step_number: parseFloat(e.target.value)})}
                  placeholder="Increment/decrement by"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reset Threshold (Optional)</label>
              <input
                type="number"
                step="any"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={newField.reset_number ?? ''}
                onChange={(e) => setNewField({...newField, reset_number: parseFloat(e.target.value)})}
                placeholder="Reset to start when threshold reached"
              />
            </div>
          </div>
        );
        
      case 'EPOCH_NOW':
        return (
          <div className="text-sm text-gray-500">
            This field type generates the current Unix timestamp. No additional configuration is needed.
          </div>
        );
        
      default:
        return null;
    }
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
            <p className="mt-2 text-gray-600">
              Manage fields and configuration for this collection
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/spike-schedules/new?collection_id=${collection.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Spike
            </Link>
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
          {(['Performance', 'Configuration', 'Spikes'] as const).map((tab) => (
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
              {tab === 'Spikes' && spikeSchedules.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {spikeSchedules.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Section */}
      {activeTab === 'Spikes' ? (
        /* Spike Schedules Section */
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Spike Schedules
            </h2>
            <Link
              to={`/spike-schedules/new?collection_id=${collectionId}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Spike Schedule
            </Link>
          </div>

          <div className="p-6">
            {spikeSchedules.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No spike schedules</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new spike schedule for this collection.</p>
                <div className="mt-6">
                  <Link
                    to={`/spike-schedules/new?collection_id=${collectionId}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Spike Schedule
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {spikeSchedules.map((schedule) => (
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{schedule.name}</p>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              schedule.status === 'active' ? 'bg-green-100 text-green-800' :
                              schedule.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {schedule.status}
                            </span>
                          </div>
                          <div className="mt-1">
                            <p className="text-sm text-gray-500">
                              {convertUTCToLocalString(schedule.start_datetime)} - {convertUTCToLocalString(schedule.end_datetime)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/spike-schedules/${schedule.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this spike schedule?')) {
                              spikeSchedulesApi.delete(schedule.id).then(() => {
                                loadCollection(); // Reload to refresh the list
                              }).catch(err => {
                                setError(err.response?.data?.detail || 'Failed to delete spike schedule');
                              });
                            }
                          }}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Fields Section */
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
                        {field.field_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {field.value_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {renderFieldConfiguration(field)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleShowSnippet(field)}
                          className="text-purple-600 hover:text-purple-900 mr-4"
                        >
                          Snippet
                        </button>
                        <button
                          onClick={() => {
                            setEditingField(field);
                            setNewField(field as any);
                            setShowAddField(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
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
      )}

      {/* Add Field Modal/Form */}
      {showAddField && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{editingField ? "Edit Field" : "Add New Field"}</h3>
                <button
                  onClick={() => {
                    setShowAddField(false);
                    setEditingField(null);
                    setError('');
                    setNewField({
                      collection_type: activeTab === 'Spikes' ? 'Performance' : activeTab,
                      field_name: '',
                      value_type: 'TEXT_FIXED'
                    });
                  }}
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
                  <label className="block text-sm font-medium text-gray-700">Field Name *</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={newField.field_name}
                    onChange={(e) => setNewField({...newField, field_name: e.target.value})}
                    placeholder="Enter field name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Value Type *</label>
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

                {renderFieldConfigInputs()}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddField(false);
                    setEditingField(null);
                    setError('');
                    setNewField({
                      collection_type: activeTab === 'Spikes' ? 'Performance' : activeTab,
                      field_name: '',
                      value_type: 'TEXT_FIXED'
                    });
                  }}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddField}
                  disabled={!newField.field_name}
                  className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingField ? "Update Field" : "Add Field"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snippet Modal */}
      {showSnippetModal && snippetField && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Snippet Argument</h3>
                <button
                  onClick={() => {
                    setShowSnippetModal(false);
                    setSnippetField(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Copy this snippet to use as SL1 Snippet Argument for field: <strong>{snippetField.field_name}</strong>
                </p>

              </div>

              <div className="mb-4">
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-50 p-3 rounded-l-md border border-gray-300">
                    <pre className="text-sm font-mono break-all whitespace-pre">{generateSnippetYAML(snippetField)}</pre>
                  </div>
                  <button
                    onClick={() => copyToClipboard(generateSnippetYAML(snippetField))}
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

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSnippetModal(false);
                    setSnippetField(null);
                  }}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
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
