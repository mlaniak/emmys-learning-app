// Code Splitting Manager for Dynamic Imports and Bundle Optimization
import { lazyLoadingMetrics } from './lazyLoading';

class CodeSplittingManager {
  constructor() {
    this.loadedModules = new Map();
    this.preloadQueue = new Set();
    this.loadingPromises = new Map();
    this.performanceMetrics = new Map();
  }

  // Dynamic import with caching and performance tracking
  async loadModule(modulePath, options = {}) {
    const { 
      cache = true, 
      timeout = 10000, 
      retries = 2,
      trackPerformance = true 
    } = options;

    // Return cached module if available
    if (cache && this.loadedModules.has(modulePath)) {
      if (trackPerformance) {
        lazyLoadingMetrics.trackCacheHit(modulePath, true);
      }
      return this.loadedModules.get(modulePath);
    }

    // Return existing loading promise if module is already being loaded
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }

    const startTime = performance.now();
    
    // Create loading promise with timeout and retry logic
    const loadingPromise = this.loadWithRetry(modulePath, retries, timeout);
    this.loadingPromises.set(modulePath, loadingPromise);

    try {
      const module = await loadingPromise;
      
      // Cache the loaded module
      if (cache) {
        this.loadedModules.set(modulePath, module);
      }

      // Track performance metrics
      if (trackPerformance) {
        const loadTime = lazyLoadingMetrics.trackLoadTime(modulePath, startTime);
        this.performanceMetrics.set(modulePath, {
          loadTime,
          timestamp: Date.now(),
          cached: false
        });
        lazyLoadingMetrics.trackCacheHit(modulePath, false);
      }

      return module;
    } catch (error) {
      console.error(`Failed to load module ${modulePath}:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(modulePath);
    }
  }

  // Load module with retry logic
  async loadWithRetry(modulePath, retries, timeout) {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.loadWithTimeout(modulePath, timeout);
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // Load module with timeout
  async loadWithTimeout(modulePath, timeout) {
    return Promise.race([
      this.dynamicImport(modulePath),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Module load timeout: ${modulePath}`)), timeout)
      )
    ]);
  }

  // Dynamic import wrapper for different module types
  async dynamicImport(modulePath) {
    switch (true) {
      case modulePath.includes('subjects/'):
        return this.loadSubjectModule(modulePath);
      case modulePath.includes('components/'):
        return this.loadComponentModule(modulePath);
      case modulePath.includes('utils/'):
        return this.loadUtilityModule(modulePath);
      default:
        return import(modulePath);
    }
  }

  // Load subject-specific modules
  async loadSubjectModule(modulePath) {
    const module = await import(modulePath);
    
    // Validate subject module structure
    if (!module.default && !module.questions && !module.achievements) {
      console.warn(`Subject module ${modulePath} may be missing expected exports`);
    }
    
    return module;
  }

  // Load component modules
  async loadComponentModule(modulePath) {
    const module = await import(/* @vite-ignore */ modulePath);
    
    // Validate component module structure
    if (!module.default && typeof module.default !== 'function') {
      console.warn(`Component module ${modulePath} may be missing default export`);
    }
    
    return module;
  }

  // Load utility modules
  async loadUtilityModule(modulePath) {
    const module = await import(/* @vite-ignore */ modulePath);
    
    // Initialize utility if it has an init method
    if (module.default && typeof module.default.init === 'function') {
      try {
        await module.default.init();
      } catch (error) {
        console.warn(`Failed to initialize utility ${modulePath}:`, error);
      }
    }
    
    return module;
  }

  // Preload modules based on priority
  async preloadModules(modules, options = {}) {
    const { 
      concurrent = 3, 
      delay = 100,
      priority = 'normal' 
    } = options;

    // Sort modules by priority
    const sortedModules = this.sortModulesByPriority(modules, priority);
    
    // Load modules in batches to avoid overwhelming the browser
    const batches = this.createBatches(sortedModules, concurrent);
    
    for (const batch of batches) {
      const promises = batch.map(modulePath => 
        this.loadModule(modulePath, { cache: true, trackPerformance: false })
          .catch(error => {
            console.warn(`Preload failed for ${modulePath}:`, error);
            return null;
          })
      );
      
      await Promise.all(promises);
      
      // Add delay between batches
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Sort modules by priority
  sortModulesByPriority(modules, priority) {
    const priorityOrder = {
      high: ['components/', 'utils/performance', 'utils/accessibility'],
      normal: ['data/', 'utils/'],
      low: ['examples/', 'test/']
    };

    if (priority === 'user-behavior') {
      // Sort based on user behavior patterns (could be enhanced with analytics)
      return modules.sort((a, b) => {
        const aScore = this.getUserBehaviorScore(a);
        const bScore = this.getUserBehaviorScore(b);
        return bScore - aScore;
      });
    }

    const order = priorityOrder[priority] || priorityOrder.normal;
    
    return modules.sort((a, b) => {
      const aIndex = order.findIndex(pattern => a.includes(pattern));
      const bIndex = order.findIndex(pattern => b.includes(pattern));
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
  }

  // Get user behavior score for module prioritization
  getUserBehaviorScore(modulePath) {
    // This could be enhanced with actual user analytics
    const baseScores = {
      'phonics': 10,
      'math': 9,
      'reading': 8,
      'spelling': 7,
      'science': 6,
      'art': 5,
      'geography': 4,
      'history': 3
    };

    for (const [subject, score] of Object.entries(baseScores)) {
      if (modulePath.includes(subject)) {
        return score;
      }
    }

    return 1;
  }

  // Create batches for concurrent loading
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  // Get performance metrics
  getPerformanceMetrics() {
    const metrics = {
      totalModules: this.loadedModules.size,
      averageLoadTime: 0,
      cacheHitRate: 0,
      moduleBreakdown: {}
    };

    if (this.performanceMetrics.size > 0) {
      const loadTimes = Array.from(this.performanceMetrics.values()).map(m => m.loadTime);
      metrics.averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      
      // Calculate cache hit rate (simplified)
      const totalRequests = this.performanceMetrics.size + this.loadedModules.size;
      metrics.cacheHitRate = this.loadedModules.size / totalRequests;
      
      // Module breakdown
      for (const [path, data] of this.performanceMetrics.entries()) {
        const category = this.getModuleCategory(path);
        if (!metrics.moduleBreakdown[category]) {
          metrics.moduleBreakdown[category] = { count: 0, totalTime: 0 };
        }
        metrics.moduleBreakdown[category].count++;
        metrics.moduleBreakdown[category].totalTime += data.loadTime;
      }
    }

    return metrics;
  }

  // Get module category for metrics
  getModuleCategory(modulePath) {
    if (modulePath.includes('subjects/')) return 'subjects';
    if (modulePath.includes('components/')) return 'components';
    if (modulePath.includes('utils/')) return 'utils';
    if (modulePath.includes('data/')) return 'data';
    return 'other';
  }

  // Clear cache
  clearCache() {
    this.loadedModules.clear();
    this.performanceMetrics.clear();
    this.preloadQueue.clear();
  }

  // Get cache status
  getCacheStatus() {
    return {
      size: this.loadedModules.size,
      modules: Array.from(this.loadedModules.keys()),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Estimate memory usage (simplified)
  estimateMemoryUsage() {
    // This is a rough estimate
    return this.loadedModules.size * 50; // KB per module (rough estimate)
  }
}

// Create singleton instance
const codeSplittingManager = new CodeSplittingManager();

// Subject module paths for easy reference
export const SUBJECT_MODULES = {
  science: () => import('../data/subjects/scienceContent.js'),
  art: () => import('../data/subjects/artContent.js'),
  geography: () => import('../data/subjects/geographyContent.js'),
  history: () => import('../data/subjects/historyContent.js'),
  phonics: () => import('../data/educationalContent.js'),
  math: () => import('../data/educationalContent.js'),
  reading: () => import('../data/educationalContent.js'),
  spelling: () => import('../data/educationalContent.js')
};

// Component module paths
export const COMPONENT_MODULES = {
  science: () => import('../components/subjects/ScienceComponent.jsx'),
  art: () => import('../components/subjects/ArtComponent.jsx'),
  geography: () => import('../components/subjects/GeographyComponent.jsx'),
  history: () => import('../components/subjects/HistoryComponent.jsx'),
  phonics: () => import('../components/subjects/PhonicsComponent.jsx'),
  math: () => import('../components/subjects/MathComponent.jsx'),
  reading: () => import('../components/subjects/ReadingComponent.jsx'),
  spelling: () => import('../components/subjects/SpellingComponent.jsx')
};

// Utility functions
export const loadSubjectContent = async (subject) => {
  const moduleLoader = SUBJECT_MODULES[subject];
  if (!moduleLoader) {
    throw new Error(`Unknown subject: ${subject}`);
  }
  
  return codeSplittingManager.loadModule(`subjects/${subject}Content`, {
    cache: true,
    trackPerformance: true
  });
};

export const loadSubjectComponent = async (subject) => {
  const moduleLoader = COMPONENT_MODULES[subject];
  if (!moduleLoader) {
    throw new Error(`Unknown subject component: ${subject}`);
  }
  
  return codeSplittingManager.loadModule(`components/subjects/${subject}Component`, {
    cache: true,
    trackPerformance: true
  });
};

export const preloadSubjects = async (subjects, options) => {
  const modules = subjects.flatMap(subject => [
    `subjects/${subject}Content`,
    `components/subjects/${subject}Component`
  ]);
  
  return codeSplittingManager.preloadModules(modules, options);
};

export default codeSplittingManager;