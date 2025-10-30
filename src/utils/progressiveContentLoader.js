// Progressive Content Loader for Large Educational Content Sets
import { ProgressiveLoader } from './lazyLoading';

class ProgressiveContentLoader {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 20;
    this.loadDelay = options.loadDelay || 100;
    this.maxConcurrent = options.maxConcurrent || 3;
    this.cache = new Map();
    this.loadingStates = new Map();
    this.progressiveLoader = new ProgressiveLoader({
      chunkSize: this.chunkSize,
      loadDelay: this.loadDelay
    });
  }

  // Load educational content progressively
  async loadEducationalContent(subject, options = {}) {
    const {
      questionCount = 50,
      difficulty = 'all',
      category = 'all',
      forceReload = false
    } = options;

    const cacheKey = `${subject}-${difficulty}-${category}-${questionCount}`;
    
    // Return cached content if available
    if (!forceReload && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check if already loading
    if (this.loadingStates.has(cacheKey)) {
      return this.loadingStates.get(cacheKey);
    }

    // Start loading
    const loadingPromise = this.loadContentChunks(subject, {
      questionCount,
      difficulty,
      category
    });

    this.loadingStates.set(cacheKey, loadingPromise);

    try {
      const content = await loadingPromise;
      this.cache.set(cacheKey, content);
      return content;
    } finally {
      this.loadingStates.delete(cacheKey);
    }
  }

  // Load content in chunks
  async loadContentChunks(subject, options) {
    const { questionCount, difficulty, category } = options;
    
    try {
      // Dynamically import subject content
      const contentModule = await this.loadSubjectModule(subject);
      
      if (!contentModule) {
        throw new Error(`Failed to load content for subject: ${subject}`);
      }

      // Extract questions and achievements
      const { questions = [], achievements = [] } = this.extractContentFromModule(contentModule, subject);
      
      // Filter content based on options
      const filteredQuestions = this.filterQuestions(questions, { difficulty, category });
      
      // Limit question count
      const limitedQuestions = filteredQuestions.slice(0, questionCount);
      
      // Load questions progressively
      const progressiveQuestions = await this.progressiveLoader.loadInChunks(
        limitedQuestions,
        (chunk, chunkIndex) => this.processQuestionChunk(chunk, chunkIndex, subject)
      );

      return {
        questions: progressiveQuestions,
        achievements,
        metadata: {
          subject,
          totalQuestions: progressiveQuestions.length,
          difficulty,
          category,
          loadedAt: Date.now()
        }
      };

    } catch (error) {
      console.error(`Failed to load content for ${subject}:`, error);
      throw error;
    }
  }

  // Load subject module dynamically
  async loadSubjectModule(subject) {
    const moduleMap = {
      science: () => import('../data/subjects/scienceContent.js'),
      art: () => import('../data/subjects/artContent.js'),
      geography: () => import('../data/subjects/geographyContent.js'),
      history: () => import('../data/subjects/historyContent.js'),
      // Fallback to main educational content
      phonics: () => import('../data/educationalContent.js'),
      math: () => import('../data/educationalContent.js'),
      reading: () => import('../data/educationalContent.js'),
      spelling: () => import('../data/educationalContent.js')
    };

    const moduleLoader = moduleMap[subject];
    if (!moduleLoader) {
      throw new Error(`Unknown subject: ${subject}`);
    }

    return await moduleLoader();
  }

  // Extract content from loaded module
  extractContentFromModule(module, subject) {
    // Try different export patterns
    const patterns = [
      `${subject}Questions`,
      `enhanced${subject.charAt(0).toUpperCase() + subject.slice(1)}Questions`,
      'questions',
      'default'
    ];

    let questions = [];
    let achievements = [];

    for (const pattern of patterns) {
      if (module[pattern]) {
        if (Array.isArray(module[pattern])) {
          questions = module[pattern];
        } else if (module[pattern].questions) {
          questions = module[pattern].questions;
        }
        break;
      }
    }

    // Try to find achievements
    const achievementPatterns = [
      `${subject}Achievements`,
      'achievements',
      'subjectAchievements'
    ];

    for (const pattern of achievementPatterns) {
      if (module[pattern] && Array.isArray(module[pattern])) {
        achievements = module[pattern];
        break;
      }
    }

    return { questions, achievements };
  }

  // Filter questions based on criteria
  filterQuestions(questions, { difficulty, category }) {
    let filtered = [...questions];

    // Filter by difficulty if specified
    if (difficulty && difficulty !== 'all') {
      filtered = filtered.filter(q => {
        return q.difficulty === difficulty || 
               q.level === difficulty ||
               (!q.difficulty && !q.level && difficulty === 'medium'); // Default to medium
      });
    }

    // Filter by category if specified
    if (category && category !== 'all') {
      filtered = filtered.filter(q => {
        return q.category === category ||
               q.type === category ||
               q.subject === category;
      });
    }

    return filtered;
  }

  // Process question chunk
  async processQuestionChunk(chunk, chunkIndex, subject) {
    // Add metadata to each question
    return chunk.map((question, index) => ({
      ...question,
      id: `${subject}-${chunkIndex}-${index}`,
      subject,
      chunkIndex,
      loadedAt: Date.now()
    }));
  }

  // Preload content for multiple subjects
  async preloadSubjects(subjects, options = {}) {
    const {
      priority = 'normal',
      concurrent = this.maxConcurrent,
      questionCount = 20
    } = options;

    // Sort subjects by priority
    const sortedSubjects = this.sortSubjectsByPriority(subjects, priority);
    
    // Create batches for concurrent loading
    const batches = this.createBatches(sortedSubjects, concurrent);
    
    const results = [];
    
    for (const batch of batches) {
      const batchPromises = batch.map(subject => 
        this.loadEducationalContent(subject, { questionCount })
          .catch(error => {
            console.warn(`Preload failed for ${subject}:`, error);
            return null;
          })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null));
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, this.loadDelay));
    }
    
    return results;
  }

  // Sort subjects by priority
  sortSubjectsByPriority(subjects, priority) {
    const priorityScores = {
      phonics: 10,
      math: 9,
      reading: 8,
      spelling: 7,
      science: 6,
      art: 5,
      geography: 4,
      history: 3
    };

    if (priority === 'user-preference') {
      // Could be enhanced with actual user data
      return subjects.sort((a, b) => (priorityScores[b] || 0) - (priorityScores[a] || 0));
    }

    return subjects;
  }

  // Create batches for concurrent processing
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  // Get loading progress for a subject
  getLoadingProgress(subject) {
    const cacheKey = `${subject}-loading-progress`;
    return this.cache.get(cacheKey) || { loaded: 0, total: 0, percentage: 0 };
  }

  // Update loading progress
  updateLoadingProgress(subject, loaded, total) {
    const cacheKey = `${subject}-loading-progress`;
    const progress = {
      loaded,
      total,
      percentage: total > 0 ? Math.round((loaded / total) * 100) : 0
    };
    this.cache.set(cacheKey, progress);
    
    // Emit progress event if available
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('contentLoadProgress', {
        detail: { subject, progress }
      }));
    }
  }

  // Clear cache for specific subject or all
  clearCache(subject = null) {
    if (subject) {
      const keysToDelete = Array.from(this.cache.keys())
        .filter(key => key.startsWith(subject));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  // Get cache statistics
  getCacheStats() {
    const stats = {
      totalEntries: this.cache.size,
      subjects: new Set(),
      memoryEstimate: 0
    };

    for (const [key, value] of this.cache.entries()) {
      const subject = key.split('-')[0];
      stats.subjects.add(subject);
      
      // Rough memory estimate
      if (value && value.questions) {
        stats.memoryEstimate += value.questions.length * 0.5; // KB per question estimate
      }
    }

    stats.subjects = Array.from(stats.subjects);
    return stats;
  }

  // Cleanup old cache entries
  cleanupCache(maxAge = 30 * 60 * 1000) { // 30 minutes default
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, value] of this.cache.entries()) {
      if (value && value.metadata && value.metadata.loadedAt) {
        if (now - value.metadata.loadedAt > maxAge) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }
}

// Create singleton instance
const progressiveContentLoader = new ProgressiveContentLoader();

// Utility functions
export const loadSubjectContent = (subject, options) => {
  return progressiveContentLoader.loadEducationalContent(subject, options);
};

export const preloadSubjects = (subjects, options) => {
  return progressiveContentLoader.preloadSubjects(subjects, options);
};

export const getLoadingProgress = (subject) => {
  return progressiveContentLoader.getLoadingProgress(subject);
};

export const clearContentCache = (subject) => {
  return progressiveContentLoader.clearCache(subject);
};

export const getContentCacheStats = () => {
  return progressiveContentLoader.getCacheStats();
};

export default progressiveContentLoader;