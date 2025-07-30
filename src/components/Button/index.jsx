import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn--${variant}`;
  const sizeClass = size !== 'md' ? `btn--${size}` : '';
  const classes = [baseClass, variantClass, sizeClass, className].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="loading-spinner"></div>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button; 