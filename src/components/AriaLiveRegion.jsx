import React, { useEffect, useRef } from 'react';

/**
 * AriaLiveRegion - Component for screen reader announcements
 * Provides a dedicated ARIA live region for dynamic content updates
 */
const AriaLiveRegion = ({ 
  message, 
  priority = 'polite', // 'polite' | 'assertive' | 'off'
  clearDelay = 3000,
  className = '',
  ...props 
}) => {
  const regionRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const region = regionRef.current;
    if (!region || !message) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the message
    region.textContent = message;

    // Clear the message after delay to prevent repetition
    if (clearDelay > 0) {
      timeoutRef.current = setTimeout(() => {
        if (region.textContent === message) {
          region.textContent = '';
        }
      }, clearDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearDelay]);

  return (
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      }}
      {...props}
    />
  );
};

/**
 * StatusRegion - For status updates (polite announcements)
 */
export const StatusRegion = ({ message, ...props }) => (
  <AriaLiveRegion message={message} priority="polite" {...props} />
);

/**
 * AlertRegion - For urgent announcements (assertive)
 */
export const AlertRegion = ({ message, ...props }) => (
  <AriaLiveRegion message={message} priority="assertive" {...props} />
);

export default AriaLiveRegion;