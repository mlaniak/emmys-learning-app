import React from 'react';

const SkeletonLoader = ({ 
  className = '',
  variant = 'rectangular',
  width = '100%',
  height = '20px',
  animation = 'pulse',
  children,
  ...props 
}) => {
  const baseClasses = 'bg-gray-200 rounded';
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]',
    none: '',
  };

  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded',
    circular: 'rounded-full',
    card: 'rounded-lg',
  };

  const style = {
    width,
    height: variant === 'circular' ? width : height,
  };

  if (children) {
    return (
      <div className={`${baseClasses} ${animationClasses[animation]} ${className}`} style={style} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      {...props}
    />
  );
};

// Pre-built skeleton components for common use cases
export const TextSkeleton = ({ lines = 1, className = '', ...props }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        variant="text"
        width={index === lines - 1 ? '75%' : '100%'}
        {...props}
      />
    ))}
  </div>
);

export const CardSkeleton = ({ className = '', ...props }) => (
  <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
    <div className="space-y-3">
      <SkeletonLoader variant="rectangular" height="200px" />
      <SkeletonLoader variant="text" height="24px" width="80%" />
      <TextSkeleton lines={2} />
      <div className="flex space-x-2">
        <SkeletonLoader variant="rectangular" height="32px" width="80px" />
        <SkeletonLoader variant="rectangular" height="32px" width="80px" />
      </div>
    </div>
  </div>
);

export const ButtonSkeleton = ({ className = '', ...props }) => (
  <SkeletonLoader
    variant="rectangular"
    height="44px"
    width="120px"
    className={`rounded-lg ${className}`}
    {...props}
  />
);

export const AvatarSkeleton = ({ size = '40px', className = '', ...props }) => (
  <SkeletonLoader
    variant="circular"
    width={size}
    height={size}
    className={className}
    {...props}
  />
);

export const ListItemSkeleton = ({ className = '', ...props }) => (
  <div className={`flex items-center space-x-3 p-3 ${className}`}>
    <AvatarSkeleton size="48px" />
    <div className="flex-1 space-y-2">
      <SkeletonLoader variant="text" height="16px" width="60%" />
      <SkeletonLoader variant="text" height="14px" width="40%" />
    </div>
  </div>
);

export const GameSkeleton = ({ className = '', ...props }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-xl max-w-4xl mx-auto ${className}`}>
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <SkeletonLoader variant="text" height="32px" width="60%" className="mx-auto" />
        <SkeletonLoader variant="text" height="16px" width="40%" className="mx-auto" />
      </div>
      
      {/* Question area */}
      <div className="space-y-4">
        <SkeletonLoader variant="rectangular" height="120px" className="rounded-lg" />
        
        {/* Options */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonLoader
              key={index}
              variant="rectangular"
              height="80px"
              className="rounded-lg"
            />
          ))}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-center space-x-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <ButtonSkeleton key={index} />
        ))}
      </div>
    </div>
  </div>
);

export const ProgressSkeleton = ({ className = '', ...props }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex justify-between items-center">
      <SkeletonLoader variant="text" height="20px" width="30%" />
      <SkeletonLoader variant="text" height="16px" width="20%" />
    </div>
    <SkeletonLoader variant="rectangular" height="8px" className="rounded-full" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="text-center space-y-2">
          <SkeletonLoader variant="circular" width="60px" className="mx-auto" />
          <SkeletonLoader variant="text" height="14px" width="80%" className="mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonLoader;