/**
 * Performance Dashboard Component
 * Provides real-time performance monitoring and visualization
 */

import React, { useState, useEffect, useCallback } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor.js';

const PerformanceDashboard = ({ isVisible = false, onClose }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshData = useCallback(() => {
    const report = performanceMonitor.getPerformanceReport();
    setPerformanceData(report);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Initial load
    refreshData();

    // Auto-refresh every 5 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(refreshData, 5000);
    }

    // Subscribe to performance updates
    const unsubscribe = performanceMonitor.subscribe((event, data) => {
      if (autoRefresh) {
        refreshData();
      }
    });

    return () => {
      if (interval) clearInterval(interval);
      unsubscribe();
    };
  }, [isVisible, autoRefresh, refreshData]);

  if (!isVisible || !performanceData) return null;

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const CoreWebVitalsTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(performanceData.coreWebVitals.metrics).map(([metric, value]) => {
          const rating = performanceData.coreWebVitals.ratings[metric];
          return (
            <div key={metric} className="bg-white rounded-lg p-4 border">
              <div className="text-sm font-medium text-gray-600">{metric}</div>
              <div className="text-2xl font-bold text-gray-900">
                {value !== null ? formatTime(value) : 'N/A'}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full inline-block mt-2 ${getRatingColor(rating)}`}>
                {rating || 'unknown'}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-white rounded-lg p-4 border">
        <h4 className="font-semibold mb-2">Overall Score</h4>
        <div className="flex items-center">
          <div className="text-3xl font-bold text-gray-900 mr-4">
            {performanceData.coreWebVitals.overallScore}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full ${
                performanceData.coreWebVitals.overallScore >= 80 ? 'bg-green-500' :
                performanceData.coreWebVitals.overallScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${performanceData.coreWebVitals.overallScore}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  const BundleAnalysisTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold mb-2">Bundle Size</h4>
          <div className="text-2xl font-bold text-gray-900">
            {formatBytes(performanceData.bundleSize.total)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Scripts: {formatBytes(performanceData.bundleSize.scripts.totalSize)} ({performanceData.bundleSize.scripts.count} files)
          </div>
          <div className="text-sm text-gray-600">
            Styles: {formatBytes(performanceData.bundleSize.stylesheets.totalSize)} ({performanceData.bundleSize.stylesheets.count} files)
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold mb-2">Total Resources</h4>
          <div className="text-2xl font-bold text-gray-900">
            {performanceData.resourceTiming.totalResources}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Total Size: {formatBytes(performanceData.resourceTiming.totalSize)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold mb-2">Memory Usage</h4>
          <div className="text-2xl font-bold text-gray-900">
            {formatBytes(performanceData.memoryUsage.current)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Trend: {performanceData.memoryUsage.trend}
          </div>
          <div className="text-sm text-gray-600">
            Peak: {formatBytes(performanceData.memoryUsage.peak)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border">
        <h4 className="font-semibold mb-2">Resources by Type</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(performanceData.resourceTiming.byType).map(([type, data]) => (
            <div key={type} className="text-center">
              <div className="text-lg font-semibold text-gray-900">{data.count}</div>
              <div className="text-sm text-gray-600">{type}</div>
              <div className="text-xs text-gray-500">{formatBytes(data.totalSize)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const NetworkTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold mb-2">Network Requests</h4>
          <div className="text-2xl font-bold text-gray-900">
            {performanceData.networkRequests.total}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Avg Response: {formatTime(performanceData.networkRequests.averageResponseTime)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold mb-2">Error Rate</h4>
          <div className="text-2xl font-bold text-gray-900">
            {performanceData.networkRequests.errorRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold mb-2">Component Performance</h4>
          <div className="text-2xl font-bold text-gray-900">
            {formatTime(performanceData.componentPerformance.averageLoadTime)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Average Load Time</div>
        </div>
      </div>

      {performanceData.componentPerformance.slowestComponents.length > 0 && (
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold mb-2">Slowest Components</h4>
          <div className="space-y-2">
            {performanceData.componentPerformance.slowestComponents.map((component, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{component.name}</span>
                <span className="text-sm font-medium text-gray-900">{formatTime(component.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const BudgetViolationsTab = () => (
    <div className="space-y-4">
      {performanceData.budgetViolations.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 mr-2">✅</div>
            <div className="text-green-800 font-medium">No budget violations detected</div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {performanceData.budgetViolations.map((violation, index) => (
            <div key={index} className={`border rounded-lg p-4 ${
              violation.severity === 'critical' ? 'bg-red-50 border-red-200' :
              violation.severity === 'high' ? 'bg-orange-50 border-orange-200' :
              violation.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-900">{violation.metric}</div>
                  <div className="text-sm text-gray-600">
                    Current: {typeof violation.current === 'number' ? formatTime(violation.current) : violation.current}
                  </div>
                  <div className="text-sm text-gray-600">
                    Budget: {typeof violation.budget === 'number' ? formatTime(violation.budget) : violation.budget}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  violation.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  violation.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {violation.severity}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {performanceData.recommendations.length > 0 && (
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold mb-2">Recommendations</h4>
          <div className="space-y-2">
            {performanceData.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start">
                <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                  rec.priority === 'high' ? 'bg-red-500' :
                  rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{rec.type}</div>
                  <div className="text-sm text-gray-600">{rec.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Core Web Vitals', component: CoreWebVitalsTab },
    { id: 'bundle', label: 'Bundle Analysis', component: BundleAnalysisTab },
    { id: 'network', label: 'Network & Components', component: NetworkTab },
    { id: 'budget', label: 'Budget Violations', component: BudgetViolationsTab }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-50 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">Performance Dashboard</h2>
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-1"
                />
                Auto-refresh
              </label>
              <button
                onClick={refreshData}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Refresh
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b">
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {tabs.find(tab => tab.id === activeTab)?.component()}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;