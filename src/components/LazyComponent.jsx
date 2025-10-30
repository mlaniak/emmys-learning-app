import React, { Suspense, lazy, useState, useEffect } from 'react';
import SkeletonLoader, { GameSkeleton, CardSkeleton } from './SkeletonLoader';

// Higher-order component for lazy loading with intersection observer
const withLazyLoading = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);
  
  return React.forwardRef((props, ref) => {
    const [shouldLoad, setShouldLoad] = useState(false);
    const [elementRef, setElementRef] = useState(null);

    useEffect(() => {
      if (!elementRef) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setShouldLoad(true);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '100px', // Start loading 100px before component comes into view
          threshold: 0.1,
        }
      );

      observer.observe(elementRef);

      return () => {
        if (elementRef) {
          observer.unobserve(elementRef);
        }
      };
    }, [elementRef]);

    if (!shouldLoad) {
      return (
        <div ref={setElementRef} className="min-h-[200px] flex items-center justify-center">
          {fallback || <SkeletonLoader height="200px" className="w-full" />}
        </div>
      );
    }

    return (
      <Suspense fallback={fallback || <SkeletonLoader height="200px" className="w-full" />}>
        <LazyComponent ref={ref} {...props} />
      </Suspense>
    );
  });
};

// Lazy loading wrapper component
const LazyComponentWrapper = ({ 
  children, 
  fallback = null, 
  threshold = 0.1, 
  rootMargin = '50px',
  className = '',
  minHeight = '100px',
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [elementRef, setElementRef] = useState(null);

  useEffect(() => {
    if (!elementRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(elementRef);

    return () => {
      if (elementRef) {
        observer.unobserve(elementRef);
      }
    };
  }, [elementRef, rootMargin, threshold]);

  return (
    <div 
      ref={setElementRef} 
      className={className}
      style={{ minHeight }}
      {...props}
    >
      {isVisible ? children : (fallback || <SkeletonLoader height={minHeight} className="w-full" />)}
    </div>
  );
};

// Pre-configured lazy components for common use cases
export const LazyGameComponent = withLazyLoading(
  () => import('../components/InteractiveGames'),
  <GameSkeleton />
);

export const LazyProgressTracker = withLazyLoading(
  () => import('../components/ProgressTracker'),
  <CardSkeleton />
);

export const LazyAchievementGallery = withLazyLoading(
  () => import('../components/AchievementGallery'),
  <CardSkeleton />
);

export const LazyParentDashboard = withLazyLoading(
  () => import('../components/ParentDashboard'),
  <CardSkeleton />
);

export const LazyProfileManager = withLazyLoading(
  () => import('../components/ProfileManager'),
  <CardSkeleton />
);

export const LazyVisualLearningAids = withLazyLoading(
  () => import('../components/VisualLearningAids'),
  <CardSkeleton />
);

// Lazy loading hook for dynamic imports
export const useLazyImport = (importFunc) => {
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadComponent = async () => {
    if (component || loading) return;

    setLoading(true);
    setError(null);

    try {
      const module = await importFunc();
      setComponent(() => module.default || module);
    } catch (err) {
      setError(err);
      console.error('Failed to load component:', err);
    } finally {
      setLoading(false);
    }
  };

  return { component, loading, error, loadComponent };
};

// Preload components for better performance
export const preloadComponent = (importFunc) => {
  return importFunc().catch(err => {
    console.warn('Failed to preload component:', err);
  });
};

// Batch preload multiple components
export const preloadComponents = (importFuncs) => {
  return Promise.allSettled(
    importFuncs.map(importFunc => preloadComponent(importFunc))
  );
};

// Component for lazy loading with retry mechanism
export const LazyComponentWithRetry = ({ 
  importFunc, 
  fallback = null, 
  maxRetries = 3,
  retryDelay = 1000,
  ...props 
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);

  const LazyComponent = lazy(() => 
    importFunc().catch(err => {
      if (retryCount < maxRetries) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            importFunc().then(resolve).catch(reject);
          }, retryDelay * (retryCount + 1));
        });
      }
      setError(err);
      throw err;
    })
  );

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="text-red-600 text-center">
          <div className="text-lg mb-2">⚠️</div>
          <div className="text-sm">Failed to load component</div>
          <button 
            onClick={() => {
              setError(null);
              setRetryCount(0);
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={fallback || <SkeletonLoader height="200px" className="w-full" />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export { withLazyLoading, LazyComponentWrapper };
export default LazyComponentWrapper;