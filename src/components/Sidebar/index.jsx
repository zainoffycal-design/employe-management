import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiUserCheck,
  FiBarChart2,
  FiFolder,
  FiPackage,
  FiDollarSign,
  FiFileText,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.scss';

const Sidebar = memo(({ sidebarOpen }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  useEffect(() => {
    if (location.pathname.startsWith('/finance')) {
      setExpandedMenus(prev => ({ ...prev, finance: true }));
    }
  }, [location.pathname]);

  const toggleMenu = useCallback((menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  }, []);

  const navigation = useMemo(() => [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    ...(currentUser?.role === 'super_manager' || currentUser?.role === 'manager' ? [
      { path: '/projects', icon: FiFolder, label: 'Project Management' }
    ] : []),
    ...(currentUser?.role === 'super_manager' || currentUser?.role === 'manager' ? [
      { path: '/users', icon: FiUserCheck, label: 'User Management' }
    ] : []),
    { path: '/assets', icon: FiPackage, label: 'Asset Manager' },
    ...(currentUser?.role === 'super_manager' ? [
      { path: '/employee-performance', icon: FiBarChart2, label: 'Employee Performance' }
    ] : []),
    ...(currentUser?.role === 'super_manager' ? [
      {
        key: 'finance',
        icon: FiDollarSign,
        label: 'Finance',
        subItems: [
          { path: '/finance/overview', label: 'Financial Overview' },
          { path: '/finance/commissions', label: 'Commissions' }
        ]
      }
    ] : []),
    ...(currentUser?.role === 'super_manager' ? [
      { path: '/calculator', icon: FiFileText, label: 'Project Calculator' }
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
            {navigation.map((item) => {
              if (item.subItems) {
                const isExpanded = expandedMenus[item.key];
                const isActive = item.subItems.some(subItem => location.pathname === subItem.path);
                
                return (
                  <li key={item.key} className="nav-item nav-item-with-submenu">
                    <div
                      className={`nav-link nav-link-parent d-flex align-items-center ${isActive ? 'active' : ''}`}
                      onClick={() => toggleMenu(item.key)}
                    >
                      <item.icon size={18} className="me-3" />
                      <span>{item.label}</span>
                      {isExpanded ? (
                        <FiChevronDown size={16} className="ms-auto" />
                      ) : (
                        <FiChevronRight size={16} className="ms-auto" />
                      )}
                    </div>
                    {isExpanded && (
                      <ul className="nav-submenu">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.path} className="nav-subitem">
                            <NavLink
                              to={subItem.path}
                              className={({ isActive }) => `nav-link nav-link-sub d-flex align-items-center ${isActive ? 'active' : ''}`}
                            >
                              <span>{subItem.label}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }
              
              return (
                <li key={item.path} className="nav-item">
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}
                  >
                    <item.icon size={18} className="me-3" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </motion.aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar; 