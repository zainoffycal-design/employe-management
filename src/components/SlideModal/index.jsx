import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import './SlideModal.scss';

const SlideModal = memo(({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  width = '400px',
  className = '',
  ...props 
}) => {
  const handleOverlayClick = (event) => {
    event.stopPropagation();
    onClose();
  };

  const handleModalClick = (event) => {
    event.stopPropagation();
  };

  const handleCloseClick = (event) => {
    event.stopPropagation();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="slide-modal-overlay"
            onClick={handleOverlayClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
          <motion.div 
            className={`slide-modal ${className}`}
            style={{ width }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={handleModalClick}
            {...props}
          >
            <div className="slide-modal-header">
              <h3 className="slide-modal-title">{title}</h3>
              <button 
                type="button" 
                className="slide-modal-close" 
                onClick={handleCloseClick}
                aria-label="Close modal"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="slide-modal-content">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

SlideModal.displayName = 'SlideModal';

export default SlideModal; 