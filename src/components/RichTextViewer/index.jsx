import React from 'react';
import './RichTextViewer.scss';

const RichTextViewer = ({ content, className = "" }) => {
  if (!content) {
    return <div className={`rich-text-viewer ${className}`}>No description provided.</div>;
  }

  const handleLinkClick = (e) => {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      e.stopPropagation();
      const url = e.target.href;
      if (url && url !== 'javascript:void(0)') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <div 
      className={`rich-text-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      onClick={handleLinkClick}
    />
  );
};

export default RichTextViewer;
