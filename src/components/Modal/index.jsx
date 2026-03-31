import React, { memo } from 'react';
import { createPortal } from 'react-dom';
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
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    small: 'modal--small',
    medium: 'modal--medium',
    large: 'modal--large',
    xlarge: 'modal--xlarge'
  };

  const ease = [0.4, 0, 0.2, 1];

  const modalTree = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="modal-overlay"
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease }}
          {...props}
        >
          <motion.div 
            className={`modal ${sizeClasses[size]} ${className}`}
            initial={{ scale: 0.98, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease }}
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
                      transition={{ duration: 0.12, ease: 'easeOut' }}
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

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalTree, document.body);
});

Modal.displayName = 'Modal';

export default Modal;
