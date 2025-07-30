import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { useTask } from './contexts/TaskContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';
import ProjectManagement from './pages/ProjectManagement';
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';
import Signup from './pages/Signup';
import { getAuth } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { currentUser } = useAuth();
  const { projects } = useTask();
  
  return (
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
      <Route path="/analytics" element={
        <ProtectedRoute>
          {(currentUser?.role === 'super_manager' || currentUser?.role === 'manager') ? (
            <Analytics />
          ) : (
            <Navigate to="/" replace />
          )}
        </ProtectedRoute>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="app">
      <ScrollToTop />
      <Header onMenuClick={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`app-main${sidebarOpen ? ' sidebar-open' : ''}`}>
        <main className="app-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AppRoutes />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

function App() {
  const [checkingUsers, setCheckingUsers] = useState(true);
  const [noUsers, setNoUsers] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hideInitialLoader = () => {
      const initialLoader = document.getElementById('pre-react-loader');
      if (initialLoader) {
        initialLoader.classList.add('hidden');
        setTimeout(() => {
          if (initialLoader.parentNode) {
            initialLoader.parentNode.removeChild(initialLoader);
          }
        }, 300);
      }
    };

    setAppReady(true);
    hideInitialLoader();
  }, []);

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
    return null;
  }

  return (
    <Routes>
      <Route path="/signup" element={noUsers ? <Signup /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={noUsers ? <Navigate to="/signup" replace /> : <Login />} />
      <Route path="/*" element={
        noUsers ? (
          <Navigate to="/signup" replace />
        ) : (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        )
      } />
    </Routes>
  );
}

export default App; 