import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { spikeSchedulesApi, collectionsApi } from '../services/api';
import type { 
  CreateSpikeScheduleRequest, 
  UpdateSpikeScheduleRequest, 
  Collection, 
  SpikeScheduleField 
} from '../types/api';

export default function CreateSpikeSchedule() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const preselectedCollectionId = searchParams.get('collection_id');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [editableFields, setEditableFields] = useState<SpikeScheduleField[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    start_datetime: '',
    end_datetime: ''
  });

  const PERFORMANCE_NUMERIC_TYPES = [
    'NUMBER_FIXED', 'FLOAT_FIXED', 'NUMBER_RANGE', 'FLOAT_RANGE', 'INCREMENT', 'DECREMENT'
  ];

  // Helper function to convert local datetime input to UTC ISO string
  const convertLocalDateTimeToUTC = (localDateTime: string): string => {
    if (!localDateTime) return '';
    // Create a Date object from the local datetime string (browser timezone)
    const localDate = new Date(localDateTime);
    // Convert to UTC ISO string for API
    return localDate.toISOString();
  };

  // Helper function to convert UTC datetime to local datetime input format
  const convertUTCToLocalDateTime = (utcDate: Date): string => {
    // Convert UTC date to local timezone and format for datetime-local input
    const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    loadCollections();
    if (isEdit && id) {
      loadSpikeSchedule(parseInt(id));
    } else if (preselectedCollectionId) {
      // Auto-select the collection if provided via query param
      const collectionId = parseInt(preselectedCollectionId);
      handleCollectionChange(collectionId);
    }
  }, [isEdit, id, preselectedCollectionId]);

  const loadCollections = async () => {
    try {
      const data = await collectionsApi.list();
      setCollections(data);
    } catch (err: any) {
      setError('Failed to load collections');
    }
  };

  const loadSpikeSchedule = async (scheduleId: number) => {
    try {
      const schedule = await spikeSchedulesApi.get(scheduleId);
      setFormData({
        name: schedule.name,
        start_datetime: convertUTCToLocalDateTime(new Date(schedule.start_datetime)),
        end_datetime: convertUTCToLocalDateTime(new Date(schedule.end_datetime))
      });
      
      // Find the collection
      const collection = collections.find(c => c.id === schedule.collection_id);
      if (collection) {
        setSelectedCollection(collection);
        setEditableFields(schedule.spike_fields.filter(f => f.is_editable));
      }
    } catch (err: any) {
      setError('Failed to load spike schedule');
    }
  };

  const handleCollectionChange = async (collectionId: number) => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;

    setSelectedCollection(collection);
    
    try {
      const collectionData = await collectionsApi.get(collectionId);
      const fields = collectionData.fields || [];
      
      // Initialize editable fields with original values
      const editable = fields
        .filter(field => 
          field.collection_type === 'Performance' && 
          PERFORMANCE_NUMERIC_TYPES.includes(field.value_type)
        )
        .map(field => ({
          original_field_id: field.id,
          collection_type: field.collection_type,
          field_name: field.field_name,
          value_type: field.value_type,
          is_editable: true,
          fixed_value_number: field.fixed_value_number,
          fixed_value_float: field.fixed_value_float,
          range_start_number: field.range_start_number,
          range_end_number: field.range_end_number,
          range_start_float: field.range_start_float,
          range_end_float: field.range_end_float,
          float_precision: field.float_precision,
          start_number: field.start_number,
          step_number: field.step_number,
          reset_number: field.reset_number
        }));
      
      setEditableFields(editable);
    } catch (err: any) {
      setError('Failed to load collection fields');
    }
  };

  const handleFieldChange = (fieldId: number, field: string, value: number | undefined) => {
    setEditableFields(prev => 
      prev.map(f => 
        f.original_field_id === fieldId 
          ? { ...f, [field]: value }
          : f
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Spike schedule name is required');
      return;
    }
    
    if (!selectedCollection) {
      setError('Please select a collection');
      return;
    }
    
    if (!formData.start_datetime || !formData.end_datetime) {
      setError('Start and end datetime are required');
      return;
    }
    
    if (new Date(formData.start_datetime) >= new Date(formData.end_datetime)) {
      setError('End datetime must be after start datetime');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const spikeFields = editableFields.map(field => ({
        original_field_id: field.original_field_id,
        ...(field.fixed_value_number !== undefined && { fixed_value_number: field.fixed_value_number }),
        ...(field.fixed_value_float !== undefined && { fixed_value_float: field.fixed_value_float }),
        ...(field.range_start_number !== undefined && { range_start_number: field.range_start_number }),
        ...(field.range_end_number !== undefined && { range_end_number: field.range_end_number }),
        ...(field.range_start_float !== undefined && { range_start_float: field.range_start_float }),
        ...(field.range_end_float !== undefined && { range_end_float: field.range_end_float }),
        ...(field.float_precision !== undefined && { float_precision: field.float_precision }),
        ...(field.start_number !== undefined && { start_number: field.start_number }),
        ...(field.step_number !== undefined && { step_number: field.step_number }),
        ...(field.reset_number !== undefined && { reset_number: field.reset_number })
      }));

      if (isEdit) {
        const updateData: UpdateSpikeScheduleRequest = {
          name: formData.name,
          start_datetime: convertLocalDateTimeToUTC(formData.start_datetime),
          end_datetime: convertLocalDateTimeToUTC(formData.end_datetime),
          spike_fields: spikeFields
        };
        await spikeSchedulesApi.update(parseInt(id!), updateData);
      } else {
        const createData: CreateSpikeScheduleRequest = {
          collection_id: selectedCollection.id,
          name: formData.name,
          start_datetime: convertLocalDateTimeToUTC(formData.start_datetime),
          end_datetime: convertLocalDateTimeToUTC(formData.end_datetime),
          spike_fields: spikeFields
        };
        await spikeSchedulesApi.create(createData);
      }

      navigate('/spike-schedules');
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'create'} spike schedule`);
    } finally {
      setLoading(false);
    }
  };

  const renderFieldInput = (field: SpikeScheduleField) => {
    const baseClasses = "mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500";
    
    switch (field.value_type) {
      case 'NUMBER_FIXED':
        return (
          <input
            type="number"
            className={baseClasses}
            value={field.fixed_value_number || ''}
            onChange={(e) => handleFieldChange(field.original_field_id, 'fixed_value_number', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Enter number"
          />
        );
      
      case 'FLOAT_FIXED':
        return (
          <input
            type="number"
            step="any"
            className={baseClasses}
            value={field.fixed_value_float || ''}
            onChange={(e) => handleFieldChange(field.original_field_id, 'fixed_value_float', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Enter float"
          />
        );
      
      case 'NUMBER_RANGE':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              className={baseClasses}
              value={field.range_start_number || ''}
              onChange={(e) => handleFieldChange(field.original_field_id, 'range_start_number', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Start"
            />
            <input
              type="number"
              className={baseClasses}
              value={field.range_end_number || ''}
              onChange={(e) => handleFieldChange(field.original_field_id, 'range_end_number', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="End"
            />
          </div>
        );
      
      case 'FLOAT_RANGE':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                className={baseClasses}
                value={field.range_start_float || ''}
                onChange={(e) => handleFieldChange(field.original_field_id, 'range_start_float', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Start"
              />
              <input
                type="number"
                step="any"
                className={baseClasses}
                value={field.range_end_float || ''}
                onChange={(e) => handleFieldChange(field.original_field_id, 'range_end_float', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="End"
              />
            </div>
            <input
              type="number"
              min="0"
              max="10"
              className={baseClasses}
              value={field.float_precision || ''}
              onChange={(e) => handleFieldChange(field.original_field_id, 'float_precision', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Precision (0-10)"
            />
          </div>
        );
      
      case 'INCREMENT':
      case 'DECREMENT':
        return (
          <div className="space-y-2">
            <input
              type="number"
              step="any"
              className={baseClasses}
              value={field.start_number || ''}
              onChange={(e) => handleFieldChange(field.original_field_id, 'start_number', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Start number"
            />
            <input
              type="number"
              step="any"
              className={baseClasses}
              value={field.step_number || ''}
              onChange={(e) => handleFieldChange(field.original_field_id, 'step_number', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Step number"
            />
            <input
              type="number"
              step="any"
              className={baseClasses}
              value={field.reset_number || ''}
              onChange={(e) => handleFieldChange(field.original_field_id, 'reset_number', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Reset number"
            />
          </div>
        );
      
      default:
        return <div className="text-gray-500 text-sm">Not editable</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Spike Schedule' : 'New Spike Schedule'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEdit 
            ? 'Update the spike schedule details and field modifications.' 
            : 'Create a time-bound variation of collection field values for Anomaly detection.'
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Spike Schedule Name *
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter spike schedule name"
                required
              />
            </div>

            <div>
              <label htmlFor="collection" className="block text-sm font-medium text-gray-700">
                Collection *
              </label>
              <select
                id="collection"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedCollection?.id || ''}
                onChange={(e) => handleCollectionChange(parseInt(e.target.value))}
                required
                disabled={isEdit}
              >
                <option value="">Select a collection</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DateTime Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="start_datetime" className="block text-sm font-medium text-gray-700">
                Start DateTime *
              </label>
              <input
                type="datetime-local"
                id="start_datetime"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.start_datetime}
                onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="end_datetime" className="block text-sm font-medium text-gray-700">
                End DateTime *
              </label>
              <input
                type="datetime-local"
                id="end_datetime"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.end_datetime}
                onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Field Modifications */}
          {selectedCollection && editableFields.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Editable Performance Fields
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Only numeric performance fields can be modified. All other fields will use their original values.
              </p>
              
              <div className="space-y-4">
                {editableFields.map(field => (
                  <div key={field.original_field_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{field.field_name}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {field.value_type}
                      </span>
                    </div>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCollection && editableFields.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No editable performance fields found in this collection.</p>
              <p className="text-sm mt-1">Only numeric performance fields (NUMBER_FIXED, FLOAT_FIXED, NUMBER_RANGE, FLOAT_RANGE, INCREMENT, DECREMENT) can be modified.</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/spike-schedules')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCollection}
              className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Spike Schedule' : 'Create Spike Schedule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
