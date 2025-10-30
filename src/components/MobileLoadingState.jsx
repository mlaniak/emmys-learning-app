import React from 'react';
import { getDeviceType } from '../utils/responsiveUtils';

const MobileLoadingState = ({ 
  type = 'default',
  message = 'Loading...',
  showProgress = false,
  progress = 0,
  className = '',
  size = 'medium'
}) => {
  const deviceType = getDeviceType();
  const isMobile = deviceType === 'mobile' || deviceType === 'ios' || deviceType === 'android';

  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  const containerClasses = {
    small: 'p-2',
    medium: 'p-4',
    large: 'p-8'
  };

  const textClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const renderSpinner = () => (
    <div className={`animate-spin rounded-full border-2 border-blue-500 border-t-transparent ${sizeClasses[size]}`} />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-blue-500 rounded-full animate-pulse ${
            size === 'small' ? 'w-2 h-2' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'
          }`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={`bg-blue-500 rounded-full animate-pulse ${sizeClasses[size]}`} />
  );

  const renderBounce = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-blue-500 rounded-full animate-bounce ${
            size === 'small' ? 'w-2 h-2' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'
          }`}
          style={{
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );

  const renderProgressBar = () => (
    <div className="w-full max-w-xs">
      <div className="bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
      <div className={`text-center text-gray-600 ${textClasses[size]}`}>
        {Math.round(progress)}%
      </div>
    </div>
  );

  const renderGameLoading = () => (
    <div className="text-center space-y-4">
      <div className="text-4xl animate-bounce">🎮</div>
      <div className="flex justify-center space-x-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-8 bg-gradient-to-t from-blue-400 to-purple-500 rounded animate-pulse"
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1.5s'
            }}
          />
        ))}
      </div>
      <div className={`text-gray-600 ${textClasses[size]}`}>
        Preparing your learning adventure...
      </div>
    </div>
  );

  const renderSkeletonCard = () => (
    <div className="bg-white rounded-lg p-4 shadow-lg max-w-sm mx-auto">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 rounded mb-3"></div>
        <div className="h-3 bg-gray-300 rounded mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-300 rounded flex-1"></div>
          <div className="h-8 bg-gray-300 rounded flex-1"></div>
        </div>
      </div>
    </div>
  );

  const getLoadingComponent = () => {
    switch (type) {
      case 'spinner':
        return renderSpinner();
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'bounce':
        return renderBounce();
      case 'progress':
        return renderProgressBar();
      case 'game':
        return renderGameLoading();
      case 'skeleton':
        return renderSkeletonCard();
      default:
        return isMobile ? renderDots() : renderSpinner();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
      {getLoadingComponent()}
      
      {message && type !== 'game' && type !== 'skeleton' && (
        <div className={`mt-3 text-gray-600 text-center ${textClasses[size]}`}>
          {message}
        </div>
      )}
      
      {showProgress && type !== 'progress' && (
        <div className={`mt-2 text-gray-500 ${textClasses.small}`}>
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

// Specialized loading components
export const GameLoadingState = ({ message = 'Loading game...', ...props }) => (
  <MobileLoadingState type="game" message={message} {...props} />
);

export const ProgressLoadingState = ({ progress, message = 'Loading...', ...props }) => (
  <MobileLoadingState type="progress" progress={progress} message={message} {...props} />
);

export const SkeletonLoadingState = ({ ...props }) => (
  <MobileLoadingState type="skeleton" {...props} />
);

export const QuickLoadingState = ({ ...props }) => (
  <MobileLoadingState type="dots" size="small" {...props} />
);

// Full-screen loading overlay
export const LoadingOverlay = ({ 
  isVisible, 
  type = 'default',
  message = 'Loading...',
  progress,
  onCancel,
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
        <MobileLoadingState 
          type={type} 
          message={message} 
          progress={progress}
          showProgress={typeof progress === 'number'}
          size="large"
        />
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileLoadingState;