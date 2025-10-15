import React, { useState, useEffect, useMemo, memo } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiUserCheck,
  FiBarChart2,
  FiFolder,
  FiPackage
} from 'react-icons/fi';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.scss';

const Sidebar = memo(({ sidebarOpen }) => {
  const { 
    tasks,
    projects
  } = useTask();
  const { currentUser } = useAuth();

  const navigation = useMemo(() => [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    ...(currentUser?.role === 'super_manager' || currentUser?.role === 'manager' ? [
      { path: '/projects', icon: FiFolder, label: 'Project Management' }
    ] : []),
    ...(currentUser?.role === 'super_manager' || currentUser?.role === 'manager' ? [
      { path: '/users', icon: FiUserCheck, label: 'User Management' }
    ] : []),
    { path: '/assets', icon: FiPackage, label: 'Asset Manager' },
    ...(currentUser?.role === 'super_manager' || currentUser?.role === 'manager' ? [
      { path: '/analytics', icon: FiBarChart2, label: 'Analytics' }
    ] : [])
  ], [currentUser]);

  return (
    <motion.aside 
      className={`sidebar${sidebarOpen ? ' open' : ''}`}
      initial={{ x: -280 }}
      animate={{ x: sidebarOpen ? 0 : -280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="sidebar-logo">
        <span className="logo-icon">F</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h6 className="nav-title text-uppercase text-muted fw-bold mb-3">Main Menu</h6>
          <ul className="nav flex-column">
            {navigation.map((item) => (
              <li key={item.path} className="nav-item">
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={18} className="me-3" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </motion.aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar; 