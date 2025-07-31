import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import { useNavigate } from 'react-router-dom';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';
import logo from '../../assets/logo.png';
import Modal from '../Modal';
import Button from '../Button';
import Avatar from '../Avatar';
import './Header.scss';

const AnimatedMenuIcon = ({ open }) => (
  <div className={`animated-menu-icon${open ? ' open' : ''}`}>
    <span></span>
    <span></span>
    <span></span>
  </div>
);

const Header = ({ onMenuClick, sidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const { projects } = useTask();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const userMenuRef = useRef(null);



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);



  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, passwordData.newPassword);
      
      // Reset form and close modal
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordChange(false);
      
      // Success feedback could be added here
      alert('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else {
        setPasswordError('Failed to update password');
      }
    } finally {
      setPasswordLoading(false);
    }
  };



  const handleDropdownNav = (path) => {
    setShowUserMenu(false);
    navigate(path);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_manager':
        return 'Super Manager';
      case 'manager':
        return 'Manager';
      case 'designer':
        return 'Designer';
      case 'developer':
        return 'Developer';
      case 'bd':
        return 'Business Developer';
      default:
        return role;
    }
  };

  return (
    <header className="header navbar navbar-expand-lg navbar-light bg-white border-bottom">
      <div className="container-fluid">
        <button className="menu-btn" onClick={onMenuClick} aria-label="Toggle sidebar">
          <AnimatedMenuIcon open={sidebarOpen} />
        </button>
        <div className="navbar-brand">
          <button 
            className="logo-btn" 
            onClick={() => navigate('/')}
          >
            <img src={logo} alt="Logo" className="logo-img" />
          </button>
        </div>
        
        <div className="navbar-nav ms-auto align-items-center">
          <div className="nav-item dropdown" ref={userMenuRef}>
            <button 
              className="user-dropdown-btn d-flex align-items-center"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-expanded={showUserMenu}
            >
              <Avatar 
                src={currentUser?.avatar} 
                name={currentUser?.name || 'User'}
                size="medium"
                className="me-2"
              />
              <span className="user-name">{currentUser?.name || 'User'}</span>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={`dropdown-arrow ${showUserMenu ? 'rotated' : ''}`}
                style={{ marginLeft: '4px', transition: 'transform 0.2s ease' }}
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
            
            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  className="dropdown-menu show"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ 
                    duration: 0.25,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                >
                  <motion.div 
                    className="dropdown-header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                  >
                    <div className='d-flex justify-content-center'>
                      <Avatar 
                        src={currentUser?.avatar} 
                        name={currentUser?.name || 'User'}
                        size="large"
                        className="dropdown-avatar"
                      />
                    </div>
                    <div className="dropdown-user-info">
                      <h6 className="mb-1">{currentUser?.name || 'User'}</h6>
                      <small>{currentUser?.email || 'No email'}</small>
                      <div className="mt-1">
                        <span className="badge bg-primary">{getRoleDisplayName(currentUser?.role)}</span>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="dropdown-divider"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  />
                  
                  <motion.button 
                    className="dropdown-item" 
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowPasswordChange(true);
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.2 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiLock className="dropdown-icon" size={16} />
                    <span>Change Password</span>
                  </motion.button>
                  
                  <motion.div 
                    className="dropdown-divider"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                  />
                  
                  <motion.button 
                    className="dropdown-item text-danger" 
                    onClick={handleLogout}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.2 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiLogOut className="dropdown-icon" size={16} />
                    <span>Logout</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>



      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordChange}
        onClose={() => {
          setShowPasswordChange(false);
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setPasswordError('');
        }}
        title="Change Password"
        size="medium"
      >
        <form onSubmit={handlePasswordChange}>
          {passwordError && (
            <div className="alert alert-danger">
              {passwordError}
            </div>
          )}
          
          <div className="form-group">
            <label>Current Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                className="form-control"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>New Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="form-control"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => {
                setShowPasswordChange(false);
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                });
                setPasswordError('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              loading={passwordLoading}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
};

export default Header; 