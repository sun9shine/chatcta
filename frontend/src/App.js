import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './store/authStore';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';

// User Dashboard
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/user/Dashboard';
import ConnectedPages from './pages/user/ConnectedPages';
import Bots from './pages/user/Bots';
import BotBuilder from './pages/user/BotBuilder';
import MessageFlow from './pages/user/MessageFlow';
import CommentFlow from './pages/user/CommentFlow';
import Support from './pages/user/Support';
import Profile from './pages/user/Profile';
import DeleteAccount from './pages/user/DeleteAccount';

// Admin
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPlatforms from './pages/admin/AdminPlatforms';
import AdminSmtp from './pages/admin/AdminSmtp';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminPrivacy from './pages/admin/AdminPrivacy';
import AdminPublish from './pages/admin/AdminPublish';
import AdminSupport from './pages/admin/AdminSupport';
import AdminDataExport from './pages/admin/AdminDataExport';
import AdminCredentials from './pages/admin/AdminCredentials';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

const AppRoutes = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      {/* User Dashboard */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="pages" element={<ConnectedPages />} />
        <Route path="bots" element={<Bots />} />
        <Route path="bots/new" element={<BotBuilder />} />
        <Route path="bots/:id" element={<BotBuilder />} />
        <Route path="message-flow" element={<MessageFlow />} />
        <Route path="comment-flow" element={<CommentFlow />} />
        <Route path="support" element={<Support />} />
        <Route path="profile" element={<Profile />} />
        <Route path="delete-account" element={<DeleteAccount />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<PrivateRoute adminOnly><AdminLayout /></PrivateRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="platforms" element={<AdminPlatforms />} />
        <Route path="smtp" element={<AdminSmtp />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="privacy" element={<AdminPrivacy />} />
        <Route path="publish" element={<AdminPublish />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="data-export" element={<AdminDataExport />} />
        <Route path="credentials" element={<AdminCredentials />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-center" toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
          duration: 3000
        }} />
      </Router>
    </AuthProvider>
  );
}

export default App;
