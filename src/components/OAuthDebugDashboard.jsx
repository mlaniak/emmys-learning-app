/**
 * OAuth Debug Dashboard Component
 * 
 * Provides a comprehensive dashboard for viewing OAuth logs, errors, and performance metrics
 * in development mode for debugging OAuth authentication issues.
 */

import React, { useState, useEffect } from 'react';
import { isDevelopment } from '../utils/environmentConfig';
import { oauthLogger } from '../utils/oauthLogger';

const OAuthDebugDashboard = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [flows, setFlows] = useState([]);
  const [errorStats, setErrorStats] = useState(null);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadDashboardData();
    }
  }, [isOpen]);

  const loadDashboardData = () => {
    setLoading(true);
    try {
      const allFlows = oauthLogger.getAllOAuthFlows();
      const errors = oauthLogger.getOAuthErrorStats();
      const performance = oauthLogger.getOAuthPerformanceStats();
      
      setFlows(allFlows);
      setErrorStats(errors);
      setPerformanceStats(performance);
    } catch (error) {
      console.error('Failed to load OAuth debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = () => {
    oauthLogger.exportOAuthLogs();
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all OAuth logs?')) {
      oauthLogger.clearOAuthLogs();
      loadDashboardData();
    }
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (success, hasErrors) => {
    if (success) return 'text-green-600';
    if (hasErrors) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = (success, hasErrors) => {
    if (success) return '✅';
    if (hasErrors) return '❌';
    return '⏳';
  };

  if (!isDevelopment() || !isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading OAuth debug data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">🔐 OAuth Debug Dashboard</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>
          <p className="text-blue-100 mt-2">Development mode OAuth monitoring and debugging</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'flows', name: 'OAuth Flows', icon: '🔄' },
            { id: 'errors', name: 'Errors', icon: '🚨' },
            { id: 'performance', name: 'Performance', icon: '⚡' },
            { id: 'debug', name: 'Debug Tools', icon: '🔧' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
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
          {activeTab === 'overview' && (
            <OverviewTab 
              flows={flows} 
              errorStats={errorStats} 
              performanceStats={performanceStats} 
            />
          )}
          {activeTab === 'flows' && (
            <FlowsTab 
              flows={flows} 
              selectedFlow={selectedFlow}
              onSelectFlow={setSelectedFlow}
              formatDuration={formatDuration}
              formatTimestamp={formatTimestamp}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          )}
          {activeTab === 'errors' && (
            <ErrorsTab 
              errorStats={errorStats} 
              flows={flows}
              formatTimestamp={formatTimestamp}
            />
          )}
          {activeTab === 'performance' && (
            <PerformanceTab 
              performanceStats={performanceStats}
              flows={flows}
              formatDuration={formatDuration}
            />
          )}
          {activeTab === 'debug' && (
            <DebugTab 
              onExportLogs={handleExportLogs}
              onClearLogs={handleClearLogs}
              onRefresh={loadDashboardData}
              flows={flows}
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              OAuth Debug Dashboard • Development Mode Only
            </div>
            <div className="space-x-3">
              <button
                onClick={loadDashboardData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={handleExportLogs}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Export Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ flows, errorStats, performanceStats }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold mb-4">📊 OAuth Overview</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{flows.length}</div>
        <div className="text-sm text-gray-600">Total Flows</div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {performanceStats?.successfulFlows || 0}
        </div>
        <div className="text-sm text-gray-600">Successful</div>
      </div>
      
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-red-600">
          {errorStats?.totalErrors || 0}
        </div>
        <div className="text-sm text-gray-600">Total Errors</div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">
          {performanceStats?.averageDuration ? 
            `${(performanceStats.averageDuration / 1000).toFixed(1)}s` : 'N/A'}
        </div>
        <div className="text-sm text-gray-600">Avg Duration</div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Errors by Provider</h4>
        <div className="space-y-2">
          {Object.entries(errorStats?.errorsByProvider || {}).map(([provider, count]) => (
            <div key={provider} className="flex justify-between">
              <span className="text-sm capitalize">{provider}</span>
              <span className="text-sm font-medium text-red-600">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Performance by Provider</h4>
        <div className="space-y-2">
          {Object.entries(performanceStats?.performanceByProvider || {}).map(([provider, stats]) => (
            <div key={provider} className="flex justify-between">
              <span className="text-sm capitalize">{provider}</span>
              <span className="text-sm font-medium">
                {(stats.average / 1000).toFixed(1)}s avg
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Flows Tab Component
const FlowsTab = ({ flows, selectedFlow, onSelectFlow, formatDuration, formatTimestamp, getStatusColor, getStatusIcon }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold mb-4">🔄 OAuth Flows</h3>
    
    {selectedFlow ? (
      <FlowDetails 
        flow={selectedFlow} 
        onBack={() => onSelectFlow(null)}
        formatDuration={formatDuration}
        formatTimestamp={formatTimestamp}
      />
    ) : (
      <div className="space-y-3">
        {flows.map(flow => (
          <div 
            key={flow.flowId} 
            className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => onSelectFlow(flow)}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {getStatusIcon(flow.success, flow.errors.length > 0)}
                </span>
                <span className="font-medium capitalize">{flow.provider}</span>
                <span className="text-sm text-gray-500">#{flow.flowId.slice(-8)}</span>
              </div>
              <div className="text-sm text-gray-600">
                {formatTimestamp(flow.startTime)}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className={getStatusColor(flow.success, flow.errors.length > 0)}>
                {flow.completed ? (flow.success ? 'Completed' : 'Failed') : 'In Progress'}
              </span>
              <span className="text-gray-600">
                {flow.duration ? formatDuration(flow.duration) : 'Ongoing'}
              </span>
            </div>
          </div>
        ))}
        {flows.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No OAuth flows recorded yet
          </div>
        )}
      </div>
    )}
  </div>
);

// Flow Details Component
const FlowDetails = ({ flow, onBack, formatDuration, formatTimestamp }) => (
  <div className="space-y-4">
    <div className="flex items-center space-x-4 mb-4">
      <button 
        onClick={onBack}
        className="text-blue-600 hover:text-blue-800"
      >
        ← Back to Flows
      </button>
      <h4 className="text-lg font-semibold">Flow Details: {flow.provider}</h4>
    </div>

    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><strong>Flow ID:</strong> {flow.flowId}</div>
        <div><strong>Provider:</strong> {flow.provider}</div>
        <div><strong>Status:</strong> {flow.completed ? (flow.success ? 'Success' : 'Failed') : 'In Progress'}</div>
        <div><strong>Duration:</strong> {flow.duration ? formatDuration(flow.duration) : 'Ongoing'}</div>
        <div><strong>Events:</strong> {flow.events.length}</div>
        <div><strong>Errors:</strong> {flow.errors.length}</div>
      </div>
    </div>

    <div className="space-y-4">
      <div>
        <h5 className="font-semibold mb-2">Events</h5>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {flow.events.map(event => (
            <div key={event.id} className="bg-white p-2 rounded border text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{event.eventType}</span>
                <span className="text-gray-500">{formatTimestamp(event.timestamp)}</span>
              </div>
              <div className="text-gray-600">Stage: {event.stage}</div>
            </div>
          ))}
        </div>
      </div>

      {flow.errors.length > 0 && (
        <div>
          <h5 className="font-semibold mb-2 text-red-600">Errors</h5>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {flow.errors.map(error => (
              <div key={error.id} className="bg-red-50 p-2 rounded border text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-red-700">{error.errorType}</span>
                  <span className="text-gray-500">{formatTimestamp(error.timestamp)}</span>
                </div>
                <div className="text-red-600">{error.message}</div>
                <div className="text-gray-600">Stage: {error.stage}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

// Errors Tab Component
const ErrorsTab = ({ errorStats, flows, formatTimestamp }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold mb-4">🚨 OAuth Errors</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-red-600">{errorStats?.totalErrors || 0}</div>
        <div className="text-sm text-gray-600">Total Errors</div>
      </div>
      
      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">{errorStats?.recentErrors?.length || 0}</div>
        <div className="text-sm text-gray-600">Recent (24h)</div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-yellow-600">
          {errorStats?.topErrors?.[0]?.type || 'None'}
        </div>
        <div className="text-sm text-gray-600">Most Common</div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Errors by Type</h4>
        <div className="space-y-2">
          {Object.entries(errorStats?.errorsByType || {}).map(([type, count]) => (
            <div key={type} className="flex justify-between">
              <span className="text-sm">{type.replace(/_/g, ' ')}</span>
              <span className="text-sm font-medium text-red-600">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Recent Errors</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {errorStats?.recentErrors?.slice(0, 10).map(error => (
            <div key={error.id} className="bg-white p-2 rounded border text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-red-700">{error.errorType}</span>
                <span className="text-gray-500">{formatTimestamp(error.timestamp)}</span>
              </div>
              <div className="text-gray-600 truncate">{error.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Performance Tab Component
const PerformanceTab = ({ performanceStats, flows, formatDuration }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold mb-4">⚡ OAuth Performance</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{performanceStats?.totalFlows || 0}</div>
        <div className="text-sm text-gray-600">Total Flows</div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{performanceStats?.successfulFlows || 0}</div>
        <div className="text-sm text-gray-600">Successful</div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">
          {performanceStats?.averageDuration ? formatDuration(performanceStats.averageDuration) : 'N/A'}
        </div>
        <div className="text-sm text-gray-600">Average Duration</div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-yellow-600">
          {performanceStats?.successfulFlows && performanceStats?.totalFlows ? 
            `${((performanceStats.successfulFlows / performanceStats.totalFlows) * 100).toFixed(1)}%` : 'N/A'}
        </div>
        <div className="text-sm text-gray-600">Success Rate</div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Slowest Flows</h4>
        <div className="space-y-2">
          {performanceStats?.slowestFlows?.map(flow => (
            <div key={flow.flowId} className="flex justify-between text-sm">
              <span className="capitalize">{flow.provider}</span>
              <span className="font-medium text-red-600">{formatDuration(flow.duration)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Fastest Flows</h4>
        <div className="space-y-2">
          {performanceStats?.fastestFlows?.map(flow => (
            <div key={flow.flowId} className="flex justify-between text-sm">
              <span className="capitalize">{flow.provider}</span>
              <span className="font-medium text-green-600">{formatDuration(flow.duration)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Debug Tab Component
const DebugTab = ({ onExportLogs, onClearLogs, onRefresh, flows }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold mb-4">🔧 Debug Tools</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Data Management</h4>
        <div className="space-y-3">
          <button
            onClick={onRefresh}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh Data
          </button>
          <button
            onClick={onExportLogs}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Export All Logs
          </button>
          <button
            onClick={onClearLogs}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Clear All Logs
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Debug Information</h4>
        <div className="space-y-2 text-sm">
          <div><strong>Environment:</strong> Development</div>
          <div><strong>Total Flows:</strong> {flows.length}</div>
          <div><strong>Storage:</strong> localStorage</div>
          <div><strong>Last Updated:</strong> {new Date().toLocaleString()}</div>
        </div>
      </div>
    </div>

    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <h4 className="font-semibold mb-2 text-yellow-800">Development Mode Only</h4>
      <p className="text-sm text-yellow-700">
        This debug dashboard is only available in development mode. OAuth logging and monitoring 
        helps identify and resolve authentication issues during development.
      </p>
    </div>
  </div>
);

export default OAuthDebugDashboard;