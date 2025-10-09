export class SessionExpiredError extends Error {
  constructor(message: string = 'Session expired') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export const isSessionExpiredError = (error: any): boolean => {
  return error instanceof SessionExpiredError;
};

export const isAuthenticationError = (error: any): boolean => {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  
  if (status === 401) {
    // Check for session expiry indicators
    return detail === 'Not authenticated' || 
           detail?.includes('expired') || 
           detail?.includes('Invalid authentication credentials');
  }
  
  return false;
};
