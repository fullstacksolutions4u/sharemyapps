import { Navigate } from 'react-router-dom';

export default function Register() {
  return <Navigate to="/login?signup=1" replace />;
}
