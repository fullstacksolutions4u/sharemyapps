import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const Home               = lazy(() => import('./pages/Home'));
const Explore            = lazy(() => import('./pages/Explore'));
const ProjectDetail      = lazy(() => import('./pages/ProjectDetail'));
const Login              = lazy(() => import('./pages/Login'));
const Register           = lazy(() => import('./pages/Register'));
const Dashboard          = lazy(() => import('./pages/Dashboard'));
const ProjectForm        = lazy(() => import('./pages/ProjectForm'));
const NotFound           = lazy(() => import('./pages/NotFound'));
const AdminPanel         = lazy(() => import('./pages/AdminPanel'));
const Messages           = lazy(() => import('./pages/Messages'));
const Notifications      = lazy(() => import('./pages/Notifications'));
const Profile            = lazy(() => import('./pages/Profile'));
const PublicPortfolio    = lazy(() => import('./pages/PublicPortfolio'));
const ClientProfile      = lazy(() => import('./pages/ClientProfile'));
const ChatAdmin          = lazy(() => import('./pages/ChatAdmin'));
const Vacancies          = lazy(() => import('./pages/Vacancies'));
const Developers         = lazy(() => import('./pages/Developers'));
const SelectRole         = lazy(() => import('./pages/SelectRole'));
const FindDevelopers     = lazy(() => import('./pages/FindDevelopers'));
const FindDevelopersHistory = lazy(() => import('./pages/FindDevelopersHistory'));
const Mentors            = lazy(() => import('./pages/Mentors'));
const FreelanceDevelopers = lazy(() => import('./pages/FreelanceDevelopers'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
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
