import React, { useState } from 'react';
import TouchButton, { TouchIconButton, TouchToggleButton, TouchButtonGroup, TouchFloatingActionButton } from './TouchButton';
import TouchDrawingCanvas, { TouchSketchPad } from './TouchDrawingCanvas';
import TouchGestureRecognizer, { TouchGestureTrainer } from './TouchGestureRecognizer';
import TouchContextMenu, { TouchQuickActions } from './TouchContextMenu';
import { getDeviceType, getTouchCapabilities } from '../utils/responsiveUtils';

/**
 * TouchInteractionDemo - Comprehensive demonstration of touch interaction features
 * 
 * This component showcases all the touch interaction capabilities implemented
 * for task 7 of the app enhancements specification.
 */
const TouchInteractionDemo = () => {
  const [demoSection, setDemoSection] = useState('buttons');
  const [recognizedGestures, setRecognizedGestures] = useState([]);
  const [drawingData, setDrawingData] = useState(null);
  const [toggleStates, setToggleStates] = useState({
    haptic: true,
    sound: false,
    animations: true
  });

  const deviceInfo = {
    type: getDeviceType(),
    touchCapabilities: getTouchCapabilities()
  };

  const isMobile = deviceInfo.type === 'mobile' || deviceInfo.type === 'ios' || deviceInfo.type === 'android';

  // Demo sections
  const demoSections = [
    { id: 'buttons', label: 'Touch Buttons', icon: '🔘' },
    { id: 'gestures', label: 'Gesture Recognition', icon: '👋' },
    { id: 'drawing', label: 'Drawing Canvas', icon: '🎨' },
    { id: 'context', label: 'Context Menus', icon: '📋' },
    { id: 'interactions', label: 'Advanced Interactions', icon: '⚡' }
  ];

  // Context menu items for demo
  const contextMenuItems = [
    {
      id: 'copy',
      label: 'Copy',
      icon: '📋',
      action: () => alert('Copy action triggered!')
    },
    {
      id: 'paste',
      label: 'Paste',
      icon: '📄',
      action: () => alert('Paste action triggered!')
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: '🗑️',
      action: () => alert('Delete action triggered!'),
      separator: true
    },
    {
      id: 'more',
      label: 'More Options',
      icon: '⋯',
      submenu: [
        {
          id: 'share',
          label: 'Share',
          icon: '📤',
          action: () => alert('Share action triggered!')
        },
        {
          id: 'export',
          label: 'Export',
          icon: '💾',
          action: () => alert('Export action triggered!')
        }
      ]
    }
  ];

  // Quick actions for demo
  const quickActions = [
    {
      id: 'like',
      icon: '❤️',
      label: 'Like',
      action: () => alert('Liked!')
    },
    {
      id: 'share',
      icon: '📤',
      label: 'Share',
      action: () => alert('Shared!')
    },
    {
      id: 'bookmark',
      icon: '🔖',
      label: 'Bookmark',
      action: () => alert('Bookmarked!')
    },
    {
      id: 'comment',
      icon: '💬',
      label: 'Comment',
      action: () => alert('Comment added!')
    }
  ];

  const handleGestureRecognized = (gesture) => {
    setRecognizedGestures(prev => [
      ...prev.slice(-4), // Keep last 5 gestures
      { ...gesture, timestamp: Date.now() }
    ]);
  };

  const renderButtonDemo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Basic Touch Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <TouchButton variant="primary" onClick={() => alert('Primary clicked!')}>
            Primary Button
          </TouchButton>
          <TouchButton variant="secondary" onClick={() => alert('Secondary clicked!')}>
            Secondary Button
          </TouchButton>
          <TouchButton variant="success" onClick={() => alert('Success clicked!')}>
            Success Button
          </TouchButton>
          <TouchButton variant="danger" onClick={() => alert('Danger clicked!')}>
            Danger Button
          </TouchButton>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Button Sizes</h3>
        <div className="flex flex-wrap items-center gap-3">
          <TouchButton size="small" onClick={() => alert('Small clicked!')}>
            Small
          </TouchButton>
          <TouchButton size="medium" onClick={() => alert('Medium clicked!')}>
            Medium
          </TouchButton>
          <TouchButton size="large" onClick={() => alert('Large clicked!')}>
            Large
          </TouchButton>
          <TouchButton size="xlarge" onClick={() => alert('XLarge clicked!')}>
            Extra Large
          </TouchButton>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Icon Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <TouchIconButton 
            icon="❤️" 
            label="Like" 
            onClick={() => alert('Liked!')}
          />
          <TouchIconButton 
            icon="📤" 
            label="Share" 
            variant="secondary"
            onClick={() => alert('Shared!')}
          />
          <TouchIconButton 
            icon="🔖" 
            label="Bookmark" 
            variant="outline"
            onClick={() => alert('Bookmarked!')}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Toggle Buttons</h3>
        <div className="space-y-3">
          {Object.entries(toggleStates).map(([key, value]) => (
            <TouchToggleButton
              key={key}
              checked={value}
              onChange={(checked) => setToggleStates(prev => ({ ...prev, [key]: checked }))}
              onLabel={`${key.charAt(0).toUpperCase() + key.slice(1)} On`}
              offLabel={`${key.charAt(0).toUpperCase() + key.slice(1)} Off`}
              onIcon="✓"
              offIcon="✗"
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Button Groups</h3>
        <TouchButtonGroup
          buttons={[
            { children: 'Option 1', onClick: () => alert('Option 1') },
            { children: 'Option 2', onClick: () => alert('Option 2') },
            { children: 'Option 3', onClick: () => alert('Option 3') }
          ]}
          spacing="normal"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Context Menu Button</h3>
        <TouchButton
          contextMenuItems={contextMenuItems}
          onLongPress={() => console.log('Long press detected')}
        >
          Long Press for Menu
        </TouchButton>
        <p className="text-sm text-gray-600 mt-2">
          {isMobile ? 'Long press' : 'Right click'} this button to see the context menu
        </p>
      </div>
    </div>
  );

  const renderGestureDemo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Gesture Recognition Area</h3>
        <TouchGestureRecognizer
          gestures={['tap', 'swipe', 'pinch', 'circle', 'zigzag']}
          onGestureRecognized={handleGestureRecognized}
          showVisualFeedback={true}
          learningMode={true}
          className="border-2 border-dashed border-gray-300 rounded-lg min-h-64 flex items-center justify-center bg-gray-50"
        >
          <div className="text-center text-gray-600">
            <div className="text-4xl mb-2">✋</div>
            <div className="font-medium">Try different gestures here</div>
            <div className="text-sm mt-1">
              Tap, swipe, pinch, draw circles or zigzags
            </div>
          </div>
        </TouchGestureRecognizer>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Recognized Gestures</h3>
        <div className="bg-white rounded-lg border p-4 min-h-32">
          {recognizedGestures.length === 0 ? (
            <div className="text-gray-500 text-center">No gestures recognized yet</div>
          ) : (
            <div className="space-y-2">
              {recognizedGestures.map((gesture, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {gesture.type === 'tap' && '👆'}
                      {gesture.type === 'swipe' && '👉'}
                      {gesture.type === 'pinch' && '🤏'}
                      {gesture.type === 'circle' && '⭕'}
                      {gesture.type === 'zigzag' && '〰️'}
                    </span>
                    <span className="font-medium">{gesture.type}</span>
                    {gesture.direction && (
                      <span className="text-sm text-gray-600">({gesture.direction})</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round(gesture.confidence * 100)}% confidence
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Gesture Trainer</h3>
        <TouchGestureTrainer
          targetGesture="circle"
          onGestureCompleted={(gesture) => alert(`Great! You drew a circle with ${Math.round(gesture.confidence * 100)}% accuracy!`)}
          onProgress={(score, attempts) => console.log(`Attempt ${attempts}: ${score}% accuracy`)}
        />
      </div>
    </div>
  );

  const renderDrawingDemo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Full Drawing Canvas</h3>
        <TouchDrawingCanvas
          width={600}
          height={400}
          onDrawingChange={setDrawingData}
          onDrawingComplete={(data) => console.log('Drawing completed:', data)}
          tools={['pen', 'eraser', 'highlighter']}
          colors={['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Simple Sketch Pad</h3>
        <TouchSketchPad
          width={300}
          height={200}
          onSketchComplete={(data) => console.log('Sketch completed:', data)}
        />
      </div>
    </div>
  );

  const renderContextDemo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Context Menu</h3>
        <TouchContextMenu
          menuItems={contextMenuItems}
          trigger="longpress"
          className="p-6 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium">Long press for context menu</div>
            <div className="text-sm text-gray-600 mt-1">
              Try long pressing this area
            </div>
          </div>
        </TouchContextMenu>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
        <TouchQuickActions
          actions={quickActions}
          layout="radial"
          className="p-6 bg-green-50 rounded-lg border-2 border-dashed border-green-300"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-medium">Long press for quick actions</div>
            <div className="text-sm text-gray-600 mt-1">
              Actions will appear in a radial menu
            </div>
          </div>
        </TouchQuickActions>
      </div>
    </div>
  );

  const renderInteractionsDemo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Multi-touch Interactions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg border">
            <h4 className="font-medium mb-2">Pinch to Zoom</h4>
            <div className="text-sm text-gray-600">
              Use two fingers to pinch and zoom on touch devices
            </div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border">
            <h4 className="font-medium mb-2">Rotation Gestures</h4>
            <div className="text-sm text-gray-600">
              Rotate with two fingers to trigger rotation events
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Haptic Feedback Patterns</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { type: 'tap', label: 'Tap', pattern: 'Light tap' },
            { type: 'success', label: 'Success', pattern: 'Triple light' },
            { type: 'error', label: 'Error', pattern: 'Triple heavy' },
            { type: 'longPress', label: 'Long Press', pattern: 'Pulsing' },
            { type: 'selection', label: 'Selection', pattern: 'Single medium' },
            { type: 'contextMenu', label: 'Context Menu', pattern: 'Complex pattern' }
          ].map(({ type, label, pattern }) => (
            <TouchButton
              key={type}
              size="small"
              variant="outline"
              onClick={() => {
                // Trigger specific haptic pattern
                if ('vibrate' in navigator) {
                  const patterns = {
                    tap: [10],
                    success: [10, 10, 10],
                    error: [50, 50, 50],
                    longPress: [20, 10, 20],
                    selection: [8],
                    contextMenu: [30, 20, 30]
                  };
                  navigator.vibrate(patterns[type] || [10]);
                }
              }}
            >
              <div className="text-center">
                <div className="text-xs font-medium">{label}</div>
                <div className="text-xs text-gray-500">{pattern}</div>
              </div>
            </TouchButton>
          ))}
        </div>
        {!deviceInfo.touchCapabilities.supportsHaptics && (
          <p className="text-sm text-gray-500 mt-2">
            Haptic feedback not supported on this device
          </p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Device Information</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Device Type:</strong> {deviceInfo.type}
            </div>
            <div>
              <strong>Touch Support:</strong> {deviceInfo.touchCapabilities.hasTouch ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Haptic Support:</strong> {deviceInfo.touchCapabilities.supportsHaptics ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Pointer Events:</strong> {deviceInfo.touchCapabilities.supportsPointerEvents ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="touch-interaction-demo max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Touch Interaction Demo</h1>
        <p className="text-gray-600">
          Comprehensive demonstration of enhanced touch interaction features
        </p>
      </div>

      {/* Section Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {demoSections.map(section => (
            <TouchButton
              key={section.id}
              variant={demoSection === section.id ? 'primary' : 'outline'}
              size="small"
              onClick={() => setDemoSection(section.id)}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </TouchButton>
          ))}
        </div>
      </div>

      {/* Demo Content */}
      <div className="demo-content">
        {demoSection === 'buttons' && renderButtonDemo()}
        {demoSection === 'gestures' && renderGestureDemo()}
        {demoSection === 'drawing' && renderDrawingDemo()}
        {demoSection === 'context' && renderContextDemo()}
        {demoSection === 'interactions' && renderInteractionsDemo()}
      </div>

      {/* Floating Action Button */}
      <TouchFloatingActionButton
        icon="🏠"
        label="Home"
        position="bottom-right"
        contextMenuItems={[
          {
            label: 'Go to Home',
            action: () => alert('Going home!')
          },
          {
            label: 'Settings',
            action: () => alert('Opening settings!')
          }
        ]}
        onClick={() => alert('FAB clicked!')}
      />

      {/* Mobile Instructions */}
      {isMobile && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium mb-2">📱 Mobile Instructions</h3>
          <ul className="text-sm space-y-1">
            <li>• Tap buttons for immediate actions</li>
            <li>• Long press for context menus and options</li>
            <li>• Use gestures in the recognition area</li>
            <li>• Draw on the canvas with your finger</li>
            <li>• Try pinch and rotation gestures</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TouchInteractionDemo;