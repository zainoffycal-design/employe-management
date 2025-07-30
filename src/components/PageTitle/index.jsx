import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const PageTitle = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  className = '',
  showIcon = true,
  actions,
  filters,
  showBackButton = false,
  backTo = '/dashboard'
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(backTo);
  };

  return (
    <motion.div 
      className={`page-header ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header-content">
        <div className="page-title-container">
          <h1 className="page-title">
            {showBackButton && (
              <button 
                className="back-icon-btn"
                onClick={handleBackClick}
                title="Go back"
              >
                <FiArrowLeft size={20} />
              </button>
            )}
            {showIcon && Icon && <Icon className="page-title-icon" />}
            {title}
          </h1>
          {subtitle && (
            <p className="page-subtitle">{subtitle}</p>
          )}
        </div>
        
        {(actions || filters) && (
          <div className="page-header-actions">
            {filters && (
              <div className="page-filters">
                {filters}
              </div>
            )}
            {actions && (
              <div className="page-actions">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PageTitle; 