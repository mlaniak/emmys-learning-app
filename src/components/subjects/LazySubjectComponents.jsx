// Lazy-loaded Subject Components with Code Splitting
import { createLazyComponent, preloadStrategy } from '../../utils/lazyLoading';

// Create lazy components for each subject with preloading strategies
export const LazyPhonicsComponent = createLazyComponent(
  () => import('./PhonicsComponent'),
  1000 // Preload after 1 second
);

export const LazyMathComponent = createLazyComponent(
  () => import('./MathComponent'),
  1500 // Preload after 1.5 seconds
);

export const LazyReadingComponent = createLazyComponent(
  () => import('./ReadingComponent'),
  2000 // Preload after 2 seconds
);

export const LazySpellingComponent = createLazyComponent(
  () => import('./SpellingComponent'),
  2500 // Preload after 2.5 seconds
);

export const LazyScienceComponent = createLazyComponent(
  () => import('./ScienceComponent'),
  3000 // Preload after 3 seconds
);

export const LazyArtComponent = createLazyComponent(
  () => import('./ArtComponent'),
  3500 // Preload after 3.5 seconds
);

export const LazyGeographyComponent = createLazyComponent(
  () => import('./GeographyComponent'),
  4000 // Preload after 4 seconds
);

export const LazyHistoryComponent = createLazyComponent(
  () => import('./HistoryComponent'),
  4500 // Preload after 4.5 seconds
);

// Preloading strategies for subject components
export const subjectPreloadStrategies = {
  phonics: preloadStrategy.onHover(() => import('./PhonicsComponent')),
  math: preloadStrategy.onHover(() => import('./MathComponent')),
  reading: preloadStrategy.onHover(() => import('./ReadingComponent')),
  spelling: preloadStrategy.onHover(() => import('./SpellingComponent')),
  science: preloadStrategy.onHover(() => import('./ScienceComponent')),
  art: preloadStrategy.onHover(() => import('./ArtComponent')),
  geography: preloadStrategy.onHover(() => import('./GeographyComponent')),
  history: preloadStrategy.onHover(() => import('./HistoryComponent'))
};

// Subject component mapping for dynamic loading
export const subjectComponents = {
  phonics: LazyPhonicsComponent,
  math: LazyMathComponent,
  reading: LazyReadingComponent,
  spelling: LazySpellingComponent,
  science: LazyScienceComponent,
  art: LazyArtComponent,
  geography: LazyGeographyComponent,
  history: LazyHistoryComponent
};

// Preload all subject components during idle time
export const preloadAllSubjects = () => {
  // Use idle callback to preload during browser idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      Object.values(subjectComponents).forEach(component => {
        if (component.preload) {
          component.preload();
        }
      });
    }, { timeout: 5000 });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      Object.values(subjectComponents).forEach(component => {
        if (component.preload) {
          component.preload();
        }
      });
    }, 5000);
  }
};

// Preload specific subjects based on user behavior
export const preloadSubjectsByPriority = (userPreferences = {}) => {
  const { favoriteSubjects = [], recentSubjects = [] } = userPreferences;
  
  // Prioritize favorite and recent subjects
  const prioritySubjects = [...new Set([...favoriteSubjects, ...recentSubjects])];
  
  prioritySubjects.forEach((subject, index) => {
    const component = subjectComponents[subject];
    if (component && component.preload) {
      // Stagger preloading to avoid overwhelming the browser
      setTimeout(() => {
        component.preload();
      }, index * 500);
    }
  });
};

export default {
  LazyPhonicsComponent,
  LazyMathComponent,
  LazyReadingComponent,
  LazySpellingComponent,
  LazyScienceComponent,
  LazyArtComponent,
  LazyGeographyComponent,
  LazyHistoryComponent,
  subjectPreloadStrategies,
  subjectComponents,
  preloadAllSubjects,
  preloadSubjectsByPriority
};