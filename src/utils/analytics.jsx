import React, { useState, useEffect, useMemo } from 'react';

// Analytics Data Collection
class AnalyticsCollector {
  constructor() {
    this.events = [];
    this.sessions = [];
    this.userActions = [];
    this.performanceMetrics = [];
    this.maxEvents = 1000;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Track user events
  trackEvent(eventName, properties = {}) {
    const event = {
      id: Date.now() + Math.random(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      eventName,
      properties: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...properties
      }
    };

    this.events.push(event);
    this.trimEvents();
    
    // Store in localStorage for persistence
    this.saveToStorage();
  }

  // Track user actions
  trackAction(action, context = {}) {
    const actionData = {
      id: Date.now() + Math.random(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      action,
      context: {
        screen: context.screen || 'unknown',
        element: context.element || 'unknown',
        ...context
      }
    };

    this.userActions.push(actionData);
    this.saveToStorage();
  }

  // Track performance metrics
  trackPerformance(metricName, value, metadata = {}) {
    const metric = {
      id: Date.now() + Math.random(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      metricName,
      value,
      metadata: {
        url: window.location.href,
        ...metadata
      }
    };

    this.performanceMetrics.push(metric);
    this.saveToStorage();
  }

  // Track session data
  trackSession(data) {
    const sessionData = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: Date.now(),
      duration: Date.now() - this.startTime,
      ...data
    };

    this.sessions.push(sessionData);
    this.saveToStorage();
  }

  // Get analytics data
  getAnalytics() {
    return {
      events: this.events,
      sessions: this.sessions,
      userActions: this.userActions,
      performanceMetrics: this.performanceMetrics,
      currentSession: {
        id: this.sessionId,
        duration: Date.now() - this.startTime,
        eventCount: this.events.length,
        actionCount: this.userActions.length
      }
    };
  }

  // Get aggregated statistics
  getStats() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const recentEvents = this.events.filter(e => new Date(e.timestamp).getTime() > oneDayAgo);
    const recentSessions = this.sessions.filter(s => s.startTime > oneDayAgo);
    const weeklySessions = this.sessions.filter(s => s.startTime > oneWeekAgo);

    // Event statistics
    const eventStats = this.aggregateEvents(recentEvents);
    
    // Session statistics
    const sessionStats = {
      total: recentSessions.length,
      averageDuration: recentSessions.length > 0 
        ? recentSessions.reduce((sum, s) => sum + s.duration, 0) / recentSessions.length 
        : 0,
      weeklyTotal: weeklySessions.length
    };

    // Performance statistics
    const performanceStats = this.aggregatePerformanceMetrics();

    // User action statistics
    const actionStats = this.aggregateUserActions();

    return {
      events: eventStats,
      sessions: sessionStats,
      performance: performanceStats,
      actions: actionStats,
      generatedAt: new Date().toISOString()
    };
  }

  // Aggregate events by name
  aggregateEvents(events) {
    const eventCounts = {};
    const eventTimestamps = {};

    events.forEach(event => {
      eventCounts[event.eventName] = (eventCounts[event.eventName] || 0) + 1;
      if (!eventTimestamps[event.eventName]) {
        eventTimestamps[event.eventName] = [];
      }
      eventTimestamps[event.eventName].push(new Date(event.timestamp).getTime());
    });

    return Object.keys(eventCounts).map(eventName => ({
      name: eventName,
      count: eventCounts[eventName],
      lastOccurrence: Math.max(...eventTimestamps[eventName]),
      frequency: eventCounts[eventName] / (24 * 60 * 60) // events per day
    }));
  }

  // Aggregate performance metrics
  aggregatePerformanceMetrics() {
    const metrics = {};
    
    this.performanceMetrics.forEach(metric => {
      if (!metrics[metric.metricName]) {
        metrics[metric.metricName] = [];
      }
      metrics[metric.metricName].push(metric.value);
    });

    return Object.keys(metrics).map(metricName => {
      const values = metrics[metricName];
      return {
        name: metricName,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    });
  }

  // Aggregate user actions
  aggregateUserActions() {
    const actionCounts = {};
    const screenCounts = {};

    this.userActions.forEach(action => {
      actionCounts[action.action] = (actionCounts[action.action] || 0) + 1;
      screenCounts[action.context.screen] = (screenCounts[action.context.screen] || 0) + 1;
    });

    return {
      byAction: Object.keys(actionCounts).map(action => ({
        action,
        count: actionCounts[action]
      })),
      byScreen: Object.keys(screenCounts).map(screen => ({
        screen,
        count: screenCounts[screen]
      }))
    };
  }

  // Trim events to prevent memory issues
  trimEvents() {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  // Save data to localStorage
  saveToStorage() {
    try {
      const data = {
        events: this.events.slice(-100), // Keep only last 100 events
        sessions: this.sessions.slice(-50), // Keep only last 50 sessions
        userActions: this.userActions.slice(-200), // Keep only last 200 actions
        performanceMetrics: this.performanceMetrics.slice(-100) // Keep only last 100 metrics
      };
      localStorage.setItem('emmy-analytics', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save analytics data:', error);
    }
  }

  // Load data from localStorage
  loadFromStorage() {
    try {
      const data = localStorage.getItem('emmy-analytics');
      if (data) {
        const parsed = JSON.parse(data);
        this.events = parsed.events || [];
        this.sessions = parsed.sessions || [];
        this.userActions = parsed.userActions || [];
        this.performanceMetrics = parsed.performanceMetrics || [];
      }
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
    }
  }

  // Clear all data
  clearData() {
    this.events = [];
    this.sessions = [];
    this.userActions = [];
    this.performanceMetrics = [];
    localStorage.removeItem('emmy-analytics');
  }

  // Export data
  exportData() {
    const data = this.getAnalytics();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emmy-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
export const analyticsCollector = new AnalyticsCollector();

// Analytics Dashboard Component
export const AnalyticsDashboard = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    if (isOpen) {
      // Load data from storage
      analyticsCollector.loadFromStorage();
      
      // Generate stats
      const analyticsStats = analyticsCollector.getStats();
      setStats(analyticsStats);
      setLoading(false);
    }
  }, [isOpen]);

  const handleExport = () => {
    analyticsCollector.exportData();
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all analytics data?')) {
      analyticsCollector.clearData();
      setStats(null);
      setLoading(true);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">📊 Analytics Dashboard</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', name: 'Overview', icon: '📈' },
            { id: 'events', name: 'Events', icon: '🎯' },
            { id: 'sessions', name: 'Sessions', icon: '⏱️' },
            { id: 'performance', name: 'Performance', icon: '⚡' },
            { id: 'actions', name: 'User Actions', icon: '👆' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                selectedTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {selectedTab === 'overview' && <OverviewTab stats={stats} />}
          {selectedTab === 'events' && <EventsTab stats={stats} />}
          {selectedTab === 'sessions' && <SessionsTab stats={stats} />}
          {selectedTab === 'performance' && <PerformanceTab stats={stats} />}
          {selectedTab === 'actions' && <ActionsTab stats={stats} />}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Data collected locally • Privacy-friendly
            </div>
            <div className="space-x-3">
              <button
                onClick={handleExport}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Export Data
              </button>
              <button
                onClick={handleClear}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab Components
const OverviewTab = ({ stats }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold mb-4">📈 Overview</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{stats?.events?.length || 0}</div>
        <div className="text-sm text-gray-600">Total Events</div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{stats?.sessions?.total || 0}</div>
        <div className="text-sm text-gray-600">Sessions Today</div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">
          {stats?.sessions?.averageDuration ? Math.round(stats.sessions.averageDuration / 1000) : 0}s
        </div>
        <div className="text-sm text-gray-600">Avg Session Duration</div>
      </div>
    </div>

    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-semibold mb-2">Top Events</h4>
      <div className="space-y-2">
        {stats?.events?.slice(0, 5).map(event => (
          <div key={event.name} className="flex justify-between">
            <span className="text-sm">{event.name}</span>
            <span className="text-sm font-medium">{event.count}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const EventsTab = ({ stats }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold mb-4">🎯 Events</h3>
    
    <div className="space-y-3">
      {stats?.events?.map(event => (
        <div key={event.name} className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">{event.name}</span>
            <span className="text-sm text-gray-600">{event.count} occurrences</span>
          </div>
          <div className="text-sm text-gray-600">
            Last: {new Date(event.lastOccurrence).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            Frequency: {event.frequency.toFixed(2)} per day
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SessionsTab = ({ stats }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold mb-4">⏱️ Sessions</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-xl font-bold text-blue-600">{stats?.sessions?.total || 0}</div>
        <div className="text-sm text-gray-600">Sessions Today</div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="text-xl font-bold text-green-600">{stats?.sessions?.weeklyTotal || 0}</div>
        <div className="text-sm text-gray-600">Sessions This Week</div>
      </div>
    </div>

    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-semibold mb-2">Session Statistics</h4>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">Average Duration</span>
          <span className="text-sm font-medium">
            {stats?.sessions?.averageDuration ? Math.round(stats.sessions.averageDuration / 1000) : 0} seconds
          </span>
        </div>
      </div>
    </div>
  </div>
);

const PerformanceTab = ({ stats }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold mb-4">⚡ Performance</h3>
    
    <div className="space-y-3">
      {stats?.performance?.map(metric => (
        <div key={metric.name} className="bg-gray-50 p-4 rounded-lg">
          <div className="font-medium mb-2">{metric.name}</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Average</div>
              <div className="font-medium">{metric.average.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-600">Min</div>
              <div className="font-medium">{metric.min.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-600">Max</div>
              <div className="font-medium">{metric.max.toFixed(2)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ActionsTab = ({ stats }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold mb-4">👆 User Actions</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-semibold mb-3">By Action</h4>
        <div className="space-y-2">
          {stats?.actions?.byAction?.map(action => (
            <div key={action.action} className="flex justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm">{action.action}</span>
              <span className="text-sm font-medium">{action.count}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-3">By Screen</h4>
        <div className="space-y-2">
          {stats?.actions?.byScreen?.map(screen => (
            <div key={screen.screen} className="flex justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm">{screen.screen}</span>
              <span className="text-sm font-medium">{screen.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default {
  AnalyticsCollector,
  analyticsCollector,
  AnalyticsDashboard
};
