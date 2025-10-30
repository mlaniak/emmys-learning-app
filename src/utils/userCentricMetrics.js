/**
 * User-Centric Performance Metrics and Reporting
 * Tracks performance from the user's perspective and provides actionable insights
 */

class UserCentricMetrics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.metrics = {
      pageLoadTime: null,
      timeToInteractive: null,
      userInteractions: [],
      frustrationEvents: [],
      satisfactionScore: null,
      taskCompletionTimes: {},
      errorEvents: [],
      navigationTiming: {},
      deviceInfo: this.getDeviceInfo()
    };
    this.observers = [];
    this.isTracking = false;
  }

  initialize() {
    if (this.isTracking) return;

    this.trackPageLoad();
    this.trackUserInteractions();
    this.trackFrustrationEvents();
    this.trackNavigationTiming();
    this.setupVisibilityTracking();
    
    this.isTracking = true;
    console.log('User-centric metrics tracking initialized');
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getUserId() {
    // Try to get user ID from localStorage or generate anonymous ID
    let userId = localStorage.getItem('emmy-user-id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('emmy-user-id', userId);
    }
    return userId;
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceMemory: navigator.deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      connection: this.getConnectionInfo(),
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent)
    };
  }

  getConnectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return 'unknown';
    
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  trackPageLoad() {
    const startTime = performance.now();
    
    // Track when page becomes interactive
    const checkInteractive = () => {
      if (document.readyState === 'complete') {
        this.metrics.pageLoadTime = performance.now() - startTime;
        this.metrics.timeToInteractive = this.calculateTimeToInteractive();
        this.notifyObservers('pageLoad', {
          loadTime: this.metrics.pageLoadTime,
          timeToInteractive: this.metrics.timeToInteractive
        });
      } else {
        setTimeout(checkInteractive, 100);
      }
    };

    if (document.readyState === 'complete') {
      checkInteractive();
    } else {
      window.addEventListener('load', checkInteractive);
    }
  }

  calculateTimeToInteractive() {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0];
      if (navigationEntry) {
        return navigationEntry.domInteractive - navigationEntry.navigationStart;
      }
    } catch (error) {
      console.warn('Failed to calculate time to interactive:', error);
    }
    return null;
  }

  trackUserInteractions() {
    const interactionTypes = ['click', 'touch', 'keydown', 'scroll'];
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        const interaction = {
          type,
          timestamp: Date.now(),
          target: this.getElementSelector(event.target),
          responseTime: null,
          completed: false
        };

        // Measure response time for clicks and touches
        if (type === 'click' || type === 'touch') {
          const startTime = performance.now();
          
          // Use requestAnimationFrame to measure when the UI updates
          requestAnimationFrame(() => {
            interaction.responseTime = performance.now() - startTime;
            interaction.completed = true;
            
            // Track slow interactions as frustration events
            if (interaction.responseTime > 100) {
              this.trackFrustrationEvent('slow_interaction', {
                interaction,
                responseTime: interaction.responseTime
              });
            }
          });
        }

        this.metrics.userInteractions.push(interaction);
        
        // Keep only last 100 interactions
        if (this.metrics.userInteractions.length > 100) {
          this.metrics.userInteractions.shift();
        }

        this.notifyObservers('userInteraction', interaction);
      }, { passive: true });
    });
  }

  getElementSelector(element) {
    if (!element) return 'unknown';
    
    // Try to create a meaningful selector
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    if (element.tagName) return element.tagName.toLowerCase();
    return 'unknown';
  }

  trackFrustrationEvents() {
    // Track rapid clicks (user frustration indicator)
    let clickCount = 0;
    let clickTimer = null;

    document.addEventListener('click', () => {
      clickCount++;
      
      if (clickTimer) clearTimeout(clickTimer);
      
      clickTimer = setTimeout(() => {
        if (clickCount >= 3) {
          this.trackFrustrationEvent('rapid_clicks', { clickCount });
        }
        clickCount = 0;
      }, 1000);
    });

    // Track page visibility changes (user switching away)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackFrustrationEvent('page_abandoned', {
          timeOnPage: Date.now() - this.sessionStartTime
        });
      }
    });

    // Track scroll thrashing (rapid scrolling)
    let scrollCount = 0;
    let scrollTimer = null;

    window.addEventListener('scroll', () => {
      scrollCount++;
      
      if (scrollTimer) clearTimeout(scrollTimer);
      
      scrollTimer = setTimeout(() => {
        if (scrollCount > 10) {
          this.trackFrustrationEvent('scroll_thrashing', { scrollCount });
        }
        scrollCount = 0;
      }, 2000);
    }, { passive: true });
  }

  trackFrustrationEvent(type, data = {}) {
    const event = {
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href,
      ...data
    };

    this.metrics.frustrationEvents.push(event);
    
    // Keep only last 50 frustration events
    if (this.metrics.frustrationEvents.length > 50) {
      this.metrics.frustrationEvents.shift();
    }

    console.warn('User frustration event detected:', event);
    this.notifyObservers('frustrationEvent', event);
  }

  trackNavigationTiming() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.metrics.navigationTiming = {
          dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpConnection: navigation.connectEnd - navigation.connectStart,
          serverResponse: navigation.responseEnd - navigation.requestStart,
          domProcessing: navigation.domComplete - navigation.domLoading,
          resourceLoading: navigation.loadEventEnd - navigation.domContentLoadedEventEnd
        };
      }
    } catch (error) {
      console.warn('Failed to track navigation timing:', error);
    }
  }

  setupVisibilityTracking() {
    this.sessionStartTime = Date.now();
    let visibilityStartTime = Date.now();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User switched away from the page
        const visibilityDuration = Date.now() - visibilityStartTime;
        this.trackCustomMetric('page_visibility_duration', visibilityDuration);
      } else {
        // User returned to the page
        visibilityStartTime = Date.now();
      }
    });
  }

  // Track task completion times (e.g., completing a quiz, navigating to a section)
  startTask(taskName) {
    const taskId = `${taskName}_${Date.now()}`;
    this.metrics.taskCompletionTimes[taskId] = {
      name: taskName,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      completed: false
    };
    return taskId;
  }

  completeTask(taskId, success = true) {
    const task = this.metrics.taskCompletionTimes[taskId];
    if (!task) return;

    task.endTime = Date.now();
    task.duration = task.endTime - task.startTime;
    task.completed = true;
    task.success = success;

    this.notifyObservers('taskCompleted', task);

    // Track slow task completion as potential frustration
    if (task.duration > 30000) { // 30 seconds
      this.trackFrustrationEvent('slow_task_completion', {
        taskName: task.name,
        duration: task.duration
      });
    }
  }

  trackError(error, context = {}) {
    const errorEvent = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };

    this.metrics.errorEvents.push(errorEvent);
    
    // Keep only last 20 errors
    if (this.metrics.errorEvents.length > 20) {
      this.metrics.errorEvents.shift();
    }

    this.notifyObservers('error', errorEvent);
  }

  trackCustomMetric(name, value, metadata = {}) {
    if (!this.metrics.customMetrics) {
      this.metrics.customMetrics = {};
    }

    this.metrics.customMetrics[name] = {
      value,
      timestamp: Date.now(),
      ...metadata
    };

    this.notifyObservers('customMetric', { name, value, metadata });
  }

  calculateSatisfactionScore() {
    // Calculate user satisfaction based on various factors
    let score = 100; // Start with perfect score

    // Deduct points for frustration events
    const frustrationPenalty = this.metrics.frustrationEvents.length * 5;
    score -= Math.min(frustrationPenalty, 30); // Max 30 points deduction

    // Deduct points for slow interactions
    const slowInteractions = this.metrics.userInteractions.filter(i => i.responseTime > 100);
    const slowInteractionPenalty = slowInteractions.length * 2;
    score -= Math.min(slowInteractionPenalty, 20); // Max 20 points deduction

    // Deduct points for errors
    const errorPenalty = this.metrics.errorEvents.length * 10;
    score -= Math.min(errorPenalty, 40); // Max 40 points deduction

    // Bonus points for task completion
    const completedTasks = Object.values(this.metrics.taskCompletionTimes).filter(t => t.completed && t.success);
    const taskBonus = completedTasks.length * 2;
    score += Math.min(taskBonus, 10); // Max 10 points bonus

    this.metrics.satisfactionScore = Math.max(0, Math.min(100, score));
    return this.metrics.satisfactionScore;
  }

  generateUserReport() {
    const satisfactionScore = this.calculateSatisfactionScore();
    
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      deviceInfo: this.metrics.deviceInfo,
      performance: {
        pageLoadTime: this.metrics.pageLoadTime,
        timeToInteractive: this.metrics.timeToInteractive,
        navigationTiming: this.metrics.navigationTiming
      },
      userExperience: {
        satisfactionScore,
        totalInteractions: this.metrics.userInteractions.length,
        frustrationEvents: this.metrics.frustrationEvents.length,
        errorEvents: this.metrics.errorEvents.length,
        averageResponseTime: this.calculateAverageResponseTime(),
        completedTasks: Object.values(this.metrics.taskCompletionTimes).filter(t => t.completed).length
      },
      insights: this.generateInsights(),
      recommendations: this.generateUserRecommendations()
    };
  }

  calculateAverageResponseTime() {
    const interactionsWithResponseTime = this.metrics.userInteractions.filter(i => i.responseTime !== null);
    if (interactionsWithResponseTime.length === 0) return 0;
    
    const totalResponseTime = interactionsWithResponseTime.reduce((sum, i) => sum + i.responseTime, 0);
    return totalResponseTime / interactionsWithResponseTime.length;
  }

  generateInsights() {
    const insights = [];
    
    // Performance insights
    if (this.metrics.pageLoadTime > 3000) {
      insights.push({
        type: 'performance',
        message: 'Page load time is slower than recommended',
        severity: 'medium'
      });
    }

    // User experience insights
    if (this.metrics.frustrationEvents.length > 3) {
      insights.push({
        type: 'ux',
        message: 'Multiple user frustration events detected',
        severity: 'high'
      });
    }

    // Device-specific insights
    if (this.metrics.deviceInfo.isMobile && this.calculateAverageResponseTime() > 150) {
      insights.push({
        type: 'mobile',
        message: 'Touch interactions are slower than optimal on mobile',
        severity: 'medium'
      });
    }

    return insights;
  }

  generateUserRecommendations() {
    const recommendations = [];
    const satisfactionScore = this.metrics.satisfactionScore || this.calculateSatisfactionScore();
    
    if (satisfactionScore < 70) {
      recommendations.push({
        priority: 'high',
        message: 'User experience needs improvement',
        actions: ['Reduce page load time', 'Optimize touch interactions', 'Fix error-prone features']
      });
    }

    if (this.metrics.deviceInfo.isMobile && this.metrics.pageLoadTime > 2000) {
      recommendations.push({
        priority: 'medium',
        message: 'Mobile performance optimization needed',
        actions: ['Implement lazy loading', 'Optimize images', 'Reduce bundle size']
      });
    }

    return recommendations;
  }

  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('User metrics observer failed:', error);
      }
    });
  }

  exportUserData() {
    const report = this.generateUserReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-metrics-${this.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
export const userCentricMetrics = new UserCentricMetrics();

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    userCentricMetrics.initialize();
  } else {
    window.addEventListener('load', () => {
      userCentricMetrics.initialize();
    });
  }
}

export default userCentricMetrics;