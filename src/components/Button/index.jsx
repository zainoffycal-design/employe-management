import React, { memo } from 'react';

const Button = memo(({ 
  children, 
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  onClick,
  className = '',
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn--${variant}`;
  const sizeClass = size !== 'md' ? `btn--${size}` : '';
  const loadingClass = loading ? 'btn--loading' : '';
  const classes = [baseClass, variantClass, sizeClass, loadingClass, className].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={loading ? undefined : onClick}
      {...props}
    >
      {loading ? (
        <span className="btn-loading">
          <div className="btn-spinner"></div>
          <span className="btn-loading-text">{loadingText}</span>
        </span>
      ) : (
        <span className="btn-content">
          {children}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button; 