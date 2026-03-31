import React, { memo } from 'react';
import { createPortal } from 'react-dom';
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

  const ease = [0.4, 0, 0.2, 1];
  const transition = { duration: 0.22, ease };

  const modalTree = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            key="slide-modal-overlay"
            className="slide-modal-overlay"
            onClick={handleOverlayClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
          />
          <motion.div 
            key="slide-modal-panel"
            className={`slide-modal ${className}`}
            style={{ width }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={transition}
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

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalTree, document.body);
});

SlideModal.displayName = 'SlideModal';

export default SlideModal;
