import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './store/authStore';

// Public
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import DataDeletion from './pages/DataDeletion';

// User Layout
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

// New User Pages
import Analytics from './pages/user/Analytics';
import ScheduledPosts from './pages/user/ScheduledPosts';
import ABTests from './pages/user/ABTests';
import Templates from './pages/user/Templates';
import Team from './pages/user/Team';
import Conversions from './pages/user/Conversions';
import Subscription from './pages/user/Subscription';
import AISettings from './pages/admin/AdminAISettings';

// Admin Layout
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
import AdminTemplates from './pages/admin/AdminTemplates';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a' }}>
      <div style={{ width:40, height:40, border:'3px solid #334155', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

const AppRoutes = () => {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/data-deletion" element={<DataDeletion />} />

      {/* User Dashboard */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="pages" element={<ConnectedPages />} />
        <Route path="bots" element={<Bots />} />
        <Route path="bots/new" element={<BotBuilder />} />
        <Route path="bots/:id" element={<BotBuilder />} />
        <Route path="message-flow" element={<MessageFlow />} />
        <Route path="comment-flow" element={<CommentFlow />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="scheduled" element={<ScheduledPosts />} />
        <Route path="ab-tests" element={<ABTests />} />
        <Route path="templates" element={<Templates />} />
        <Route path="team" element={<Team />} />
        <Route path="conversions" element={<Conversions />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="support" element={<Support />} />
        <Route path="profile" element={<Profile />} />
        <Route path="delete-account" element={<DeleteAccount />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<PrivateRoute adminOnly><AdminLayout /></PrivateRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="platforms" element={<AdminPlatforms />} />
        <Route path="smtp" element={<AdminSmtp />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="privacy" element={<AdminPrivacy />} />
        <Route path="publish" element={<AdminPublish />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="data-export" element={<AdminDataExport />} />
        <Route path="templates" element={<AdminTemplates />} />
        <Route path="ai-settings" element={<AISettings />} />
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
          style: { background:'#1e293b', color:'#f1f5f9', border:'1px solid #334155' },
          duration: 3000
        }} />
      </Router>
    </AuthProvider>
  );
}

export default App;
