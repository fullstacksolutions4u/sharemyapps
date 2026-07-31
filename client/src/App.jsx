import { lazy, Suspense, useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfirmProvider } from './context/ConfirmContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AppSpinner from './components/AppSpinner';

const Home               = lazy(() => import('./pages/Home'));
const Explore            = lazy(() => import('./pages/Explore'));
import Feed from './pages/Feed';
const ProjectDetail      = lazy(() => import('./pages/ProjectDetail'));
const Login              = lazy(() => import('./pages/Login'));
const Register           = lazy(() => import('./pages/Register'));
const Dashboard          = lazy(() => import('./pages/Dashboard'));
const ProjectForm        = lazy(() => import('./pages/ProjectForm'));
const NotFound           = lazy(() => import('./pages/NotFound'));
const JobAlerts          = lazy(() => import('./pages/JobAlerts'));
const Inbox              = lazy(() => import('./pages/Inbox'));
const Applications       = lazy(() => import('./pages/Applications'));
const AdminPanel         = lazy(() => import('./pages/AdminPanel'));
const PublicPortfolio    = lazy(() => import('./pages/PublicPortfolio'));
const ClientProfile      = lazy(() => import('./pages/ClientProfile'));
const ChatAdmin          = lazy(() => import('./pages/ChatAdmin'));
const Vacancies          = lazy(() => import('./pages/Vacancies'));
const Portfolios         = lazy(() => import('./pages/Portfolios'));
const SelectRole         = lazy(() => import('./pages/SelectRole'));
const FindDevelopers     = lazy(() => import('./pages/FindDevelopers'));
const FindDevelopersHistory = lazy(() => import('./pages/FindDevelopersHistory'));
const Mentors            = lazy(() => import('./pages/Mentors'));
const FreelanceDevelopers = lazy(() => import('./pages/FreelanceDevelopers'));
const ForgotPassword     = lazy(() => import('./pages/ForgotPassword'));
const PaidServices       = lazy(() => import('./pages/PaidServices'));
const MentorshipProgram  = lazy(() => import('./pages/MentorshipProgram'));
const AddVacancy         = lazy(() => import('./pages/AddVacancy'));
const LearningTracker    = lazy(() => import('./pages/LearningTracker'));
const Profile            = lazy(() => import('./pages/Profile'));
const Services           = lazy(() => import('./pages/Services'));
const CurationShowcase   = lazy(() => import('./pages/CurationShowcase'));
const DeveloperInterviewFeedback = lazy(() => import('./pages/DeveloperInterviewFeedback'));
const Overview           = lazy(() => import('./pages/Overview'));
const ProjectsSection    = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.ProjectsSection })));

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <p className="text-muted text-sm">Something went wrong.</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-sm text-accent hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <AppSpinner />
    </div>
  );
}

function homeFor(user) {
  if (user.role === 'admin') return '/admin';
  if (!user.onboardingComplete) return '/select-role';
  if (user.userType === 'recruiter') return user.companyName ? '/find-developers' : '/client-profile';
  if (user.userType === 'client') return user.clientProfile?.projectName ? '/portfolios' : '/client-profile';
  if (user.userType === 'mentee') return '/portfolios';
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

function AdminRedirect() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (!loading && user?.role === 'admin' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }
  return null;
}

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <ScrollToTop />
      <AdminRedirect />
      {!isAdmin && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Suspense fallback={<PageLoader />}>
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="projects" element={<ProjectsSection />} />
              <Route path="add" element={<ProjectForm />} />
              <Route path="edit/:id" element={<ProjectForm />} />
              <Route path="job-alerts" element={<JobAlerts />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="applications" element={<Applications />} />
              <Route path="interview-feedback" element={<DeveloperInterviewFeedback />} />
              <Route path="premium" element={<PaidServices />} />
              <Route path="mentorship" element={<MentorshipProgram />} />
              <Route path="services" element={<Services />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/messages" element={<Navigate to="/dashboard/inbox" state={{ tab: 'messages' }} replace />} />
            <Route path="/notifications" element={<Navigate to="/dashboard/inbox" state={{ tab: 'notifications' }} replace />} />
            <Route path="/feedback" element={<Navigate to="/dashboard/inbox" state={{ tab: 'feedback' }} replace />} />
            <Route path="/profile" element={<ProtectedRoute><Navigate to="/dashboard/profile" replace /></ProtectedRoute>} />
            <Route path="/client-profile" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
            <Route path="/chat-admin" element={<ProtectedRoute><ChatAdmin /></ProtectedRoute>} />
            <Route path="/opportunities" element={<Vacancies />} />
            <Route path="/vacancies" element={<Vacancies />} />
            <Route path="/portfolios" element={<Portfolios />} />
            <Route path="/developers" element={<Navigate to="/portfolios" replace />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/find-developers" element={<ProtectedRoute><FindDevelopers /></ProtectedRoute>} />
            <Route path="/find-developers/history" element={<ProtectedRoute><FindDevelopersHistory /></ProtectedRoute>} />
            <Route path="/post-vacancy" element={<ProtectedRoute><AddVacancy /></ProtectedRoute>} />
            <Route path="/mentors" element={<ProtectedRoute><Mentors /></ProtectedRoute>} />
            <Route path="/freelance-developers" element={<FreelanceDevelopers />} />
            <Route path="/placement-services" element={<PaidServices />} />
            <Route path="/mentorship-program" element={<MentorshipProgram />} />
            <Route path="/career-services" element={<Navigate to="/dashboard/premium" replace />} />
            <Route path="/quiz-zone" element={<LearningTracker />} />
            <Route path="/portfolio/:userId" element={<PublicPortfolio />} />
            <Route path="/showcase/:slug" element={<CurationShowcase />} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
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
        <ConfirmProvider>
          <AppRoutes />
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
