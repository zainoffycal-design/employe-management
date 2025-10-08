import React, { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import './Modal.scss';

const Modal = memo(({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  ...props 
}) => {
  const handleOverlayClick = useCallback((e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  const sizeClasses = {
    small: 'modal--small',
    medium: 'modal--medium',
    large: 'modal--large',
    xlarge: 'modal--xlarge'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay"
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          {...props}
        >
          <motion.div 
            className={`modal ${sizeClasses[size]} ${className}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {(title || showCloseButton) && (
              <div className="modal-header">
                <div className="modal-header-content">
                  {title && (
                    <div className="modal-title-container">
                      <h3 className="modal-title">{title}</h3>
                      {title && <div className="modal-title-underline"></div>}
                    </div>
                  )}
                  {showCloseButton && (
                    <motion.button 
                      type="button" 
                      className="modal-close" 
                      onClick={onClose}
                      aria-label="Close modal"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeInOut' }}
                    >
                      <FiX size={20} />
                    </motion.button>
                  )}
                </div>
              </div>
            )}
            <div className="modal-content">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

Modal.displayName = 'Modal';

export default Modal; 