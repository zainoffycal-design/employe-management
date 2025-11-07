import React from 'react';
import { parseLinks } from '../../utils/uiUtils';

const LinkifiedText = ({ text, className = '', style = {} }) => {
  if (!text) return null;
  
  const parts = parseLinks(text);
  
  return (
    <span className={className} style={style}>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={index}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#15A970', textDecoration: 'underline' }}
              onClick={(e) => e.stopPropagation()}
            >
              {part.text}
            </a>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
};

export default LinkifiedText;

