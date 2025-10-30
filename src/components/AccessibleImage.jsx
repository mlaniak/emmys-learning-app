import React from 'react';

/**
 * AccessibleImage - Enhanced image component with comprehensive accessibility support
 * Provides proper alt text, loading states, error handling, and WCAG compliance
 */
const AccessibleImage = ({
  src,
  alt,
  decorative = false,
  longDescription,
  caption,
  className = '',
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  fallbackAlt,
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const imgRef = React.useRef(null);

  // Generate unique IDs for ARIA relationships
  const longDescId = React.useMemo(() => 
    longDescription ? `img-desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null,
    [longDescription]
  );

  const captionId = React.useMemo(() => 
    caption ? `img-caption-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null,
    [caption]
  );

  // Handle image load
  const handleLoad = (e) => {
    setImageLoaded(true);
    setImageError(false);
    if (onLoad) onLoad(e);
  };

  // Handle image error with fallback
  const handleError = (e) => {
    setImageError(true);
    
    // Try fallback image if available and not already tried
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    
    if (onError) onError(e);
  };

  // Determine appropriate alt text
  const getAltText = () => {
    if (decorative) return '';
    if (imageError && fallbackAlt) return fallbackAlt;
    return alt || '';
  };

  // Determine ARIA attributes
  const getAriaAttributes = () => {
    const attributes = {};
    
    if (decorative) {
      attributes['aria-hidden'] = 'true';
      attributes['role'] = 'presentation';
    } else {
      if (longDescId) {
        attributes['aria-describedby'] = longDescId;
      }
      if (captionId) {
        attributes['aria-labelledby'] = captionId;
      }
    }
    
    return attributes;
  };

  // Build CSS classes
  const imageClasses = [
    'accessible-image',
    className,
    imageLoaded ? 'loaded' : 'loading',
    imageError ? 'error' : '',
  ].filter(Boolean).join(' ');

  return (
    <figure className="accessible-image-container">
      {/* Loading placeholder */}
      {!imageLoaded && !imageError && (
        <div 
          className="image-loading-placeholder"
          aria-label="Image loading"
          role="img"
        >
          <div className="loading-spinner" aria-hidden="true">
            <span className="sr-only">Loading image...</span>
          </div>
        </div>
      )}

      {/* Error fallback */}
      {imageError && !fallbackSrc && (
        <div 
          className="image-error-placeholder"
          role="img"
          aria-label={alt || 'Image failed to load'}
        >
          <div className="error-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
          <span className="error-text">
            {alt ? `Image unavailable: ${alt}` : 'Image unavailable'}
          </span>
        </div>
      )}

      {/* Main image */}
      {!imageError && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={getAltText()}
          className={imageClasses}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          {...getAriaAttributes()}
          {...props}
        />
      )}

      {/* Long description (hidden but accessible) */}
      {longDescription && !decorative && (
        <div id={longDescId} className="sr-only">
          {longDescription}
        </div>
      )}

      {/* Visible caption */}
      {caption && (
        <figcaption id={captionId} className="image-caption">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

/**
 * AccessibleIcon - Icon component with proper accessibility support
 */
export const AccessibleIcon = ({
  children,
  label,
  decorative = false,
  className = '',
  size = 24,
  ...props
}) => {
  const iconClasses = [
    'accessible-icon',
    className,
    decorative ? 'decorative' : 'semantic'
  ].filter(Boolean).join(' ');

  if (decorative) {
    return (
      <span
        className={iconClasses}
        aria-hidden="true"
        role="presentation"
        style={{ width: size, height: size }}
        {...props}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={iconClasses}
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
      {...props}
    >
      {children}
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
};

/**
 * AccessibleButton - Button component with comprehensive accessibility support
 */
export const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  type = 'button',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaPressed,
  ariaControls,
  className = '',
  ...props
}) => {
  const buttonRef = React.useRef(null);

  const buttonClasses = [
    'accessible-button',
    `variant-${variant}`,
    `size-${size}`,
    fullWidth ? 'full-width' : '',
    loading ? 'loading' : '',
    disabled ? 'disabled' : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };

  const handleKeyDown = (e) => {
    // Handle Enter and Space key activation
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      aria-controls={ariaControls}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className="button-loading-indicator" aria-hidden="true">
          <AccessibleIcon decorative size={16}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeDashoffset="32">
                <animate attributeName="stroke-dashoffset" dur="1s" values="32;0;32" repeatCount="indefinite"/>
              </circle>
            </svg>
          </AccessibleIcon>
        </span>
      )}
      
      <span className={loading ? 'sr-only' : 'button-content'}>
        {loading ? loadingText : children}
      </span>
      
      {loading && (
        <span aria-live="polite" className="sr-only">
          {loadingText}
        </span>
      )}
    </button>
  );
};

export default AccessibleImage;