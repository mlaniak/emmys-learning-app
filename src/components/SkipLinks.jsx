import React, { useEffect, useRef } from 'react';

const SkipLinks = () => {
  const skipLinksRef = useRef(null);

  useEffect(() => {
    // Check if skip links already exist (from accessibility manager)
    const existingSkipLinks = document.querySelector('.skip-links');
    if (existingSkipLinks && existingSkipLinks !== skipLinksRef.current) {
      // Hide this component if skip links already exist
      if (skipLinksRef.current) {
        skipLinksRef.current.style.display = 'none';
      }
    }
  }, []);

  return (
    <div ref={skipLinksRef} className="skip-links">
      <a 
        href="#main-content" 
        className="skip-link"
        onFocus={(e) => e.target.classList.add('visible')}
        onBlur={(e) => e.target.classList.remove('visible')}
      >
        Skip to main content
      </a>
      <a 
        href="#navigation" 
        className="skip-link"
        onFocus={(e) => e.target.classList.add('visible')}
        onBlur={(e) => e.target.classList.remove('visible')}
      >
        Skip to navigation
      </a>
      <a 
        href="#game-area" 
        className="skip-link"
        onFocus={(e) => e.target.classList.add('visible')}
        onBlur={(e) => e.target.classList.remove('visible')}
      >
        Skip to game area
      </a>
    </div>
  );
};

export default SkipLinks;