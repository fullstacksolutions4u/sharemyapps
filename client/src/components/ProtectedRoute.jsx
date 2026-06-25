import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppSpinner from './AppSpinner';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <AppSpinner />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
