import React, { useState } from 'react';
import './Avatar.scss';

const Avatar = ({ 
  src, 
  alt, 
  name, 
  size = 'medium', 
  className = '',
  onClick,
  style = {}
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Ensure name is a string and has a fallback
  const displayName = name && typeof name === 'string' ? name.trim() : 'User';
  
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    const trimmedName = name.trim();
    if (!trimmedName) return '?';
    
    const words = trimmedName.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return '?';
    
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return words
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'avatar--small';
      case 'large': return 'avatar--large';
      case 'xlarge': return 'avatar--xlarge';
      default: return 'avatar--medium';
    }
  };

  const getSizePx = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 48;
      case 'xlarge': return 64;
      default: return 32;
    }
  };

  return (
    <div 
      className={`avatar ${getSizeClass()} ${className}`}
      onClick={onClick}
      style={style}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || displayName}
          onError={handleImageError}
          style={{ width: `${getSizePx()}px`, height: `${getSizePx()}px` }}
        />
      ) : (
        <div 
          className="avatar-fallback"
          style={{ 
            width: `${getSizePx()}px`, 
            height: `${getSizePx()}px`,
            fontSize: `${Math.max(10, getSizePx() * 0.4)}px`
          }}
          title={displayName}
        >
          {getInitials(displayName)}
        </div>
      )}
    </div>
  );
};

export default Avatar; 