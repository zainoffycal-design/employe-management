import React, { useState, memo, useMemo } from 'react';
import { resolveAvatarUrl } from '../../utils/avatarUtils';
import './Avatar.scss';

const Avatar = memo(({ 
  src, 
  alt, 
  name, 
  size = 'medium', 
  className = '',
  onClick,
  style = {}
}) => {
  const [imageError, setImageError] = useState(false);
  
  const displayName = name && typeof name === 'string' ? name.trim() : 'User';

  const sizePx = size === 'small' ? 24 : size === 'large' ? 48 : size === 'xlarge' ? 64 : 32;

  const avatarSrc = useMemo(
    () => resolveAvatarUrl(src, displayName, sizePx),
    [src, displayName, sizePx]
  );

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    const trimmedName = name.trim();
    if (!trimmedName) return '?';
    
    const words = trimmedName.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return '?';
    
    return words[0].charAt(0).toUpperCase();
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

  return (
    <div 
      className={`avatar ${getSizeClass()} ${className}`}
      onClick={onClick}
      style={style}
    >
      {avatarSrc && !imageError ? (
        <img
          src={avatarSrc}
          alt={alt || displayName}
          onError={handleImageError}
          style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
        />
      ) : (
        <div 
          className="avatar-fallback"
          style={{ 
            width: `${sizePx}px`, 
            height: `${sizePx}px`,
            fontSize: `${Math.max(10, sizePx * 0.4)}px`
          }}
          title={displayName}
        >
          {getInitials(displayName)}
        </div>
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export default Avatar; 