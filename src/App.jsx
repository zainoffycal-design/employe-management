import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { useTask } from './contexts/TaskContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';

import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectBoard = lazy(() => import('./pages/ProjectBoard'));
const ProjectManagement = lazy(() => import('./pages/ProjectManagement'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const AssetManager = lazy(() => import('./pages/AssetManager'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Signup = lazy(() => import('./pages/Signup'));
const SetupPassword = lazy(() => import('./pages/SetupPassword'));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, isFormSubmitting } = useAuth();
  if (loading && !isFormSubmitting) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { currentUser } = useAuth();
  const hideHeaderSidebar = location.pathname.startsWith('/setup-password');

  const handleMainContentClick = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="app">
      <ScrollToTop />
      {!hideHeaderSidebar && (
        <Header onMenuClick={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />
      )}
      {sidebarOpen && !hideHeaderSidebar && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {!hideHeaderSidebar && (
        <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      <div 
        className={`app-main${sidebarOpen ? ' sidebar-open' : ''}`}
        onClick={handleMainContentClick}
      > 
        <main className="app-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={<LoadingSpinner size="large" />}>
              <Routes>
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/projects" element={
                  <ProtectedRoute>
                    <ProjectManagement />
                  </ProtectedRoute>
                } />
                <Route path="/project/:projectId/board" element={
                  <ProtectedRoute>
                    <ProjectBoard />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute>
                    {(currentUser?.role === 'super_manager' || currentUser?.role === 'manager') ? (
                      <UserManagement />
                    ) : (
                      <Navigate to="/" replace />
                    )}
                  </ProtectedRoute>
                } />
                <Route path="/assets" element={
                  <ProtectedRoute>
                    <AssetManager />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    {(currentUser?.role === 'super_manager' || currentUser?.role === 'manager') ? (
                      <Analytics />
                    ) : (
                      <Navigate to="/" replace />
                    )}
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

function App() {
  const [checkingUsers, setCheckingUsers] = useState(true);
  const [noUsers, setNoUsers] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkUsers() {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const isEmpty = snapshot.empty;
        setNoUsers(isEmpty);
        if (isEmpty && window.location.pathname !== '/signup') {
          navigate('/signup', { replace: true });
        }
      } catch (error) {
        console.error('Error checking users:', error);
      } finally {
        setCheckingUsers(false);
      }
    }
    checkUsers();
  }, [navigate]);

  if (checkingUsers) {
    return <LoadingSpinner size="large" text="Loading..." />;
  }

  return (
    <Suspense fallback={<LoadingSpinner size="large" text="Loading..." />}>
      <Routes>
        <Route path="/signup" element={noUsers ? <Signup /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={noUsers ? <Navigate to="/signup" replace /> : <Login />} />
        <Route path="/setup-password" element={<SetupPassword />} />
        <Route path="/*" element={
          noUsers ? (
            <Navigate to="/signup" replace />
          ) : (
            <AppLayout />
          )
        } />
      </Routes>
    </Suspense>
  );
}

export default App; 