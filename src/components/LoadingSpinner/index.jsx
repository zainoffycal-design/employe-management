import React, { memo } from 'react';
import './LoadingSpinner.scss';

const LoadingSpinner = memo(({ size = 'medium', text = 'Loading...' }) => {
  return (
    <div className={`loading-spinner-container ${size}`}>
      <div className="loading-spinner"></div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner; 