import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Collections from './pages/Collections';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="*" element={<div className="text-center py-12 text-gray-500">Page not found</div>} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}
