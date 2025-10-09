import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { setSessionExpiredHandler } from '../services/api';
import SessionExpiredModal from '../components/SessionExpiredModal';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  showSessionExpiredModal: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  handleSessionExpired: () => void;
  dismissSessionExpiredModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const navigate = useNavigate();

  const handleSessionExpired = () => {
    setUser(null);
    setShowSessionExpiredModal(true);
  };

  useEffect(() => {
    // Register the session expired handler with the API service
    setSessionExpiredHandler(handleSessionExpired);
    
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await apiService.login({ email, password });
    await checkAuthStatus();
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    setShowSessionExpiredModal(false);
  };

  const dismissSessionExpiredModal = () => {
    setShowSessionExpiredModal(false);
  };

  const handleLoginRedirect = () => {
    setShowSessionExpiredModal(false);
    navigate('/login');
  };

  const handleStayOnPage = () => {
    setShowSessionExpiredModal(false);
  };

  const value = {
    user,
    loading,
    showSessionExpiredModal,
    login,
    logout,
    handleSessionExpired,
    dismissSessionExpiredModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionExpiredModal
        show={showSessionExpiredModal}
        onLoginRedirect={handleLoginRedirect}
        onStayOnPage={handleStayOnPage}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
