import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import logo from '../../assets/logo.svg';
import './AuthLayout.scss';

const AuthLayout = memo(({ 
  children, 
  title, 
  subtitle, 
  className = '',
  animationDelay = 0 
}) => {
  return (
    <div className={`auth-page ${className}`}>
      <div className="auth-container">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: animationDelay }}
        >
          <div className="auth-header">
            <img src={logo} alt="Logo" className="auth-logo" />
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
});

AuthLayout.displayName = 'AuthLayout';

export default AuthLayout; 