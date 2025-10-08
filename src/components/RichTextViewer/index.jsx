import React, { memo, useCallback } from 'react';
import './RichTextViewer.scss';

const RichTextViewer = memo(({ content, className = "" }) => {
  if (!content) {
    return <div className={`rich-text-viewer ${className}`}>No description provided.</div>;
  }

  const handleLinkClick = useCallback((e) => {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      e.stopPropagation();
      const url = e.target.href;
      if (url && url !== 'javascript:void(0)') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  }, []);

  return (
    <div 
      className={`rich-text-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      onClick={handleLinkClick}
    />
  );
});

RichTextViewer.displayName = 'RichTextViewer';

export default RichTextViewer;
