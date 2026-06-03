import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Explore from './pages/Explore';
import ProjectDetail from './pages/ProjectDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectForm from './pages/ProjectForm';
import NotFound from './pages/NotFound';
import AdminPanel from './pages/AdminPanel';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import PublicPortfolio from './pages/PublicPortfolio';
import ClientProfile from './pages/ClientProfile';
import ChatAdmin from './pages/ChatAdmin';
import Vacancies from './pages/Vacancies';
import Developers from './pages/Developers';
import SelectRole from './pages/SelectRole';
import FindDevelopers from './pages/FindDevelopers';
import FindDevelopersHistory from './pages/FindDevelopersHistory';
import Mentors from './pages/Mentors';
import FreelanceDevelopers from './pages/FreelanceDevelopers';

function homeFor(user) {
  if (user.role === 'admin') return '/admin';
  if (!user.onboardingComplete) return '/select-role';
  if (user.userType === 'recruiter') return '/client-profile';
  if (user.userType === 'client') return user.clientProfile?.projectName ? '/developers' : '/client-profile';
  if (user.userType === 'mentee') return '/developers';
  return '/dashboard';
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={homeFor(user)} replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/add" element={<ProtectedRoute><ProjectForm /></ProtectedRoute>} />
          <Route path="/dashboard/edit/:id" element={<ProtectedRoute><ProjectForm /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/client-profile" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
          <Route path="/chat-admin" element={<ProtectedRoute><ChatAdmin /></ProtectedRoute>} />
          <Route path="/vacancies" element={<Vacancies />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/find-developers" element={<ProtectedRoute><FindDevelopers /></ProtectedRoute>} />
          <Route path="/find-developers/history" element={<ProtectedRoute><FindDevelopersHistory /></ProtectedRoute>} />
          <Route path="/mentors" element={<ProtectedRoute><Mentors /></ProtectedRoute>} />
          <Route path="/freelance-developers" element={<FreelanceDevelopers />} />
          <Route path="/portfolio/:userId" element={<PublicPortfolio />} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
<Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'Inter, sans-serif', fontSize: '13px', borderRadius: '10px', border: '1px solid #E5E1DA' },
          success: { iconTheme: { primary: '#00A693', secondary: '#fff' } },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
