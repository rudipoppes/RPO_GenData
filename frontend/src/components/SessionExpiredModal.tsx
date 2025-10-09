
interface SessionExpiredModalProps {
  show: boolean;
  onLoginRedirect: () => void;
  onStayOnPage: () => void;
}

export default function SessionExpiredModal({ 
  show, 
  onLoginRedirect, 
  onStayOnPage 
}: SessionExpiredModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-semibold text-gray-900">
            Session Expired
          </h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          Your session has expired for security reasons. Please log in again to continue working, 
          or stay on this page to save any unsaved changes first.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={onLoginRedirect}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Log In Again
          </button>
          <button 
            onClick={onStayOnPage}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
          >
            Stay on Page
          </button>
        </div>
      </div>
    </div>
  );
}
