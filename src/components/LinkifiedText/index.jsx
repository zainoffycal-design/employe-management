import React from 'react';
import { parseLinks, parseTextWithMentions } from '../../utils/uiUtils';

const LinkifiedText = ({ text, className = '', style = {} }) => {
  if (!text) return null;
  
  const mentionParts = parseTextWithMentions(text);
  const allParts = [];
  
  mentionParts.forEach(part => {
    if (part.type === 'mention') {
      allParts.push(part);
    } else {
      const linkParts = parseLinks(part.content);
      allParts.push(...linkParts);
    }
  });
  
  return (
    <span className={className} style={style}>
      {allParts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={index}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}
              onClick={(e) => e.stopPropagation()}
            >
              {part.text}
            </a>
          );
        }
        if (part.type === 'mention') {
          return (
            <span
              key={index}
              className="mention-tag"
              style={{
                color: 'var(--primary-color)',
                fontWeight: 500,
                backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                padding: '0.125rem 0.25rem',
                borderRadius: '0.25rem',
                display: 'inline-block'
              }}
            >
              @{part.name}
            </span>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
};

export default LinkifiedText;

