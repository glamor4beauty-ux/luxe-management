import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Performers from './pages/Performers';
import PerformerForm from './pages/PerformerForm';
import PerformerView from './pages/PerformerView';
import Memos from './pages/Memos';
import CalendarPage from './pages/CalendarPage';
import StripchatPage from './pages/StripchatPage';
import Payouts from './pages/Payouts.jsx';
import Tasks from './pages/Tasks';
import Register from './pages/Register';
import PerformerDashboard from './pages/PerformerDashboard';
import PerformerShifts from './pages/PerformerShifts';
import SupportContact from './pages/SupportContact';
import KnowledgeBase from './pages/KnowledgeBase';
import PerformerProfile from './pages/PerformerProfile';
import RecruiterDashboard from './pages/RecruiterDashboard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  // Role-based landing page redirect
  const getLandingPage = () => {
    if (!user) return <Dashboard />;
    if (user.role === 'recruiter') return <RecruiterDashboard />;
    if (user.role === 'performer') return <PerformerDashboard />;
    return <Dashboard />; // admin/default
  };

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={getLandingPage()} />
        <Route path="/performers" element={<Performers />} />
        <Route path="/performers/new" element={<PerformerForm />} />
        <Route path="/performers/:id" element={<PerformerView />} />
        <Route path="/performers/:id/edit" element={<PerformerForm />} />
        <Route path="/memos" element={<Memos />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/stripchat" element={<StripchatPage />} />
        <Route path="/payouts" element={<Payouts />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/register" element={<Register />} />
        <Route path="/performer" element={<PerformerDashboard />} />
        <Route path="/performer-shifts" element={<PerformerShifts />} />
        <Route path="/support" element={<SupportContact />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/performer-profile" element={<PerformerProfile />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App