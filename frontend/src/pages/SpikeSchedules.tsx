import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { spikeSchedulesApi } from '../services/api';
import type { SpikeSchedule } from '../types/api';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  schedule: SpikeSchedule | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmationDialog({ 
  isOpen, 
  schedule, 
  onConfirm, 
  onCancel 
}: DeleteConfirmationDialogProps) {
  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Spike Schedule</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete the spike schedule "{schedule.name}"?
            </p>
            <div className="mt-4 p-3 bg-yellow-50 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800">This will permanently delete:</h4>
              <ul className="mt-2 text-sm text-yellow-700">
                <li>• The spike schedule and all its field modifications</li>
                <li>• Any active spike data generation will revert to normal</li>
              </ul>
            </div>
          </div>
          <div className="items-center px-4 py-3 flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  
  switch (status) {
    case 'active':
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800`}>
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
          Active
        </span>
      );
    case 'scheduled':
      return (
        <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5"></span>
          Scheduled
        </span>
      );
    case 'expired':
      return (
        <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></span>
          Expired
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
          {status}
        </span>
      );
  }
}

export default function SpikeSchedules() {
  const [schedules, setSchedules] = useState<SpikeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<SpikeSchedule | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await spikeSchedulesApi.list();
      setSchedules(data);
    } catch (err: any) {
      console.error('Failed to load spike schedules:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load spike schedules';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (schedule: SpikeSchedule) => {
    setDeletingSchedule(schedule);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSchedule) return;
    
    setDeleting(true);
    setError('');
    
    try {
      await spikeSchedulesApi.delete(deletingSchedule.id);
      await loadSchedules(); // Reload schedules
      setShowDeleteDialog(false);
      setDeletingSchedule(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete spike schedule';
      setError(errorMessage);
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingSchedule(null);
  };

  const filteredSchedules = schedules.filter(schedule =>
    schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.collection_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDateTime = (dateString: string) => {
    // Convert UTC datetime string to local timezone for display
    const utcDate = new Date(dateString);
    return utcDate.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading spike schedules...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Spike Schedules</h1>
            <p className="mt-2 text-gray-600">
              Manage time-bound field value variations for Anomaly detection
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/spike-schedules/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              New Spike Schedule
            </Link>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search spike schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedules Table */}
      {filteredSchedules.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No spike schedules</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No spike schedules match your search.' : 'Get started by creating a new spike schedule.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Link
                to="/spike-schedules/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Spike Schedule
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredSchedules.map((schedule) => (
              <li key={schedule.id}>
                <div className="px-4 py-4 sm:px-6">
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
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {schedule.name}
                          </p>
                          <StatusBadge status={schedule.status} />
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-500">
                            Collection: <span className="font-medium">{schedule.collection_name}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          {formatDateTime(schedule.start_datetime)}
                        </p>
                        <p className="text-sm text-gray-500">
                          to {formatDateTime(schedule.end_datetime)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/spike-schedules/${schedule.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(schedule)}
                          disabled={deleting}
                          className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        schedule={deletingSchedule}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
