// Lazy Subject Loader Component with Code Splitting
import React, { useState, useEffect, Suspense } from 'react';
import { subjectComponents, preloadAllSubjects, preloadSubjectsByPriority } from './subjects/LazySubjectComponents';
import { loadSubjectContent, preloadSubjects, getLoadingProgress } from '../utils/progressiveContentLoader';
import codeSplittingManager from '../utils/codeSplittingManager';
import LoadingOverlay from './MobileLoadingState';

const LazySubjectLoader = ({ 
  subject, 
  onSubjectLoad, 
  onError, 
  gameSettings = {},
  userPreferences = {} 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0, percentage: 0 });
  const [preloadingStatus, setPreloadingStatus] = useState('idle');
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  // Get the lazy component for the subject
  const LazyComponent = subjectComponents[subject];

  useEffect(() => {
    if (subject && LazyComponent) {
      loadSubjectWithProgress();
    }
  }, [subject]);

  useEffect(() => {
    // Initialize preloading strategies based on user preferences
    initializePreloading();
    
    // Listen for content loading progress
    const handleProgressUpdate = (event) => {
      if (event.detail.subject === subject) {
        setLoadingProgress(event.detail.progress);
      }
    };

    window.addEventListener('contentLoadProgress', handleProgressUpdate);
    return () => window.removeEventListener('contentLoadProgress', handleProgressUpdate);
  }, []);

  const loadSubjectWithProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startTime = performance.now();
      
      // Load subject content progressively
      const contentPromise = loadSubjectContent(subject, {
        questionCount: gameSettings.questionCount || 50,
        difficulty: gameSettings.difficulty || 'all',
        category: gameSettings.category || 'all'
      });

      // Preload the component if not already loaded
      if (LazyComponent.preload) {
        LazyComponent.preload();
      }

      // Wait for content to load
      const content = await contentPromise;
      
      const loadTime = performance.now() - startTime;
      
      // Update performance metrics
      setPerformanceMetrics({
        loadTime,
        questionsLoaded: content.questions?.length || 0,
        subject,
        timestamp: Date.now()
      });

      // Notify parent component
      if (onSubjectLoad) {
        onSubjectLoad({
          subject,
          content,
          loadTime,
          cached: false
        });
      }

      // Track performance
      if (window.emmyPerformance?.monitor) {
        window.emmyPerformance.monitor.recordCustomMetric(`subject_load_${subject}`, loadTime);
      }

    } catch (err) {
      console.error(`Failed to load subject ${subject}:`, err);
      setError(err);
      
      if (onError) {
        onError(err, subject);
      }
    } finally {
      setLoading(false);
    }
  };

  const initializePreloading = async () => {
    try {
      setPreloadingStatus('initializing');
      
      // Preload subjects based on user preferences
      const { favoriteSubjects = [], recentSubjects = [] } = userPreferences;
      const prioritySubjects = [...new Set([...favoriteSubjects, ...recentSubjects])];
      
      if (prioritySubjects.length > 0) {
        setPreloadingStatus('preloading-priority');
        await preloadSubjectsByPriority({ favoriteSubjects, recentSubjects });
      }

      // Preload all subjects during idle time
      setPreloadingStatus('preloading-all');
      preloadAllSubjects();
      
      // Preload content for likely next subjects
      const likelyNextSubjects = getLikelyNextSubjects(subject);
      if (likelyNextSubjects.length > 0) {
        preloadSubjects(likelyNextSubjects, {
          priority: 'user-preference',
          concurrent: 2,
          questionCount: 20
        });
      }

      setPreloadingStatus('complete');
      
    } catch (error) {
      console.warn('Preloading failed:', error);
      setPreloadingStatus('error');
    }
  };

  const getLikelyNextSubjects = (currentSubject) => {
    // Logic to determine likely next subjects based on current subject
    const subjectFlow = {
      phonics: ['reading', 'spelling'],
      math: ['science', 'geography'],
      reading: ['spelling', 'history'],
      spelling: ['reading', 'phonics'],
      science: ['math', 'geography'],
      art: ['history', 'geography'],
      geography: ['history', 'science'],
      history: ['geography', 'art']
    };

    return subjectFlow[currentSubject] || [];
  };

  const handleRetry = () => {
    setError(null);
    loadSubjectWithProgress();
  };

  const getLoadingMessage = () => {
    if (loadingProgress.percentage > 0) {
      return `Loading ${subject}... ${loadingProgress.percentage}%`;
    }
    return `Loading ${subject} content...`;
  };

  // Error boundary fallback
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-400 via-pink-500 to-purple-600">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Failed to Load {subject}</h2>
          <p className="text-lg mb-6 opacity-90">
            {error.message || 'Something went wrong while loading the content.'}
          </p>
          <div className="space-y-4">
            <button 
              onClick={handleRetry}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 mr-4"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-600"
            >
              Refresh Page
            </button>
          </div>
          {performanceMetrics && (
            <div className="mt-6 text-sm opacity-75">
              <p>Debug Info: Load time {performanceMetrics.loadTime?.toFixed(2)}ms</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !LazyComponent) {
    return (
      <LoadingOverlay
        isVisible={true}
        message={getLoadingMessage()}
        progress={loadingProgress.percentage}
        showProgress={loadingProgress.percentage > 0}
        className="bg-gradient-to-br from-blue-400 via-purple-500 to-pink-600"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <div className="text-2xl font-bold text-white mb-2">
            {subject.charAt(0).toUpperCase() + subject.slice(1)} Adventure
          </div>
          {preloadingStatus !== 'idle' && (
            <div className="text-sm text-white opacity-75 mt-2">
              Preloading: {preloadingStatus}
            </div>
          )}
        </div>
      </LoadingOverlay>
    );
  }

  // Render the lazy-loaded component
  return (
    <Suspense 
      fallback={
        <LoadingOverlay
          isVisible={true}
          message={`Preparing ${subject}...`}
          className="bg-gradient-to-br from-blue-400 via-purple-500 to-pink-600"
        />
      }
    >
      <LazyComponent 
        gameSettings={gameSettings}
        userPreferences={userPreferences}
        performanceMetrics={performanceMetrics}
        onLoad={() => {
          // Component loaded successfully
          if (window.emmyPerformance?.monitor) {
            window.emmyPerformance.monitor.recordCustomMetric(`component_render_${subject}`, performance.now());
          }
        }}
        {...gameSettings}
      />
    </Suspense>
  );
};

// Performance monitoring wrapper
const LazySubjectLoaderWithMetrics = (props) => {
  useEffect(() => {
    // Record component mount
    if (window.emmyPerformance?.monitor) {
      window.emmyPerformance.monitor.recordCustomMetric('lazy_loader_mount', performance.now());
    }

    return () => {
      // Record component unmount
      if (window.emmyPerformance?.monitor) {
        window.emmyPerformance.monitor.recordCustomMetric('lazy_loader_unmount', performance.now());
      }
    };
  }, []);

  return <LazySubjectLoader {...props} />;
};

export default LazySubjectLoaderWithMetrics;