import React, { useRef, useEffect, useState } from 'react';
import touchInteractionManager from '../utils/touchInteractionManager';
import { getDeviceType, getTouchCapabilities } from '../utils/responsiveUtils';

/**
 * TouchGestureRecognizer - Advanced gesture recognition component
 * 
 * Features:
 * - Multi-touch gesture recognition
 * - Customizable gesture patterns
 * - Visual feedback for gestures
 * - Educational gesture learning
 * - Accessibility support
 */
const TouchGestureRecognizer = ({
  children,
  gestures = ['tap', 'swipe', 'pinch', 'rotate'],
  onGestureRecognized,
  onGestureStart,
  onGestureEnd,
  showVisualFeedback = true,
  learningMode = false,
  className = '',
  ...props
}) => {
  const containerRef = useRef(null);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [gestureProgress, setGestureProgress] = useState(0);
  const [recognizedGestures, setRecognizedGestures] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop',
    touchCapabilities: {}
  });

  // Gesture state tracking
  const gestureState = useRef({
    startTime: 0,
    touches: [],
    initialDistance: 0,
    initialAngle: 0,
    currentDistance: 0,
    currentAngle: 0,
    path: [],
    velocity: { x: 0, y: 0 }
  });

  useEffect(() => {
    setDeviceInfo({
      type: getDeviceType(),
      touchCapabilities: getTouchCapabilities()
    });
  }, []);

  // Gesture recognition logic
  const recognizeGesture = (touchData) => {
    const { touches, deltaTime, path } = touchData;
    
    // Single touch gestures
    if (touches.length === 1) {
      return recognizeSingleTouchGesture(touchData);
    }
    
    // Multi-touch gestures
    if (touches.length === 2) {
      return recognizeMultiTouchGesture(touchData);
    }
    
    return null;
  };

  const recognizeSingleTouchGesture = (touchData) => {
    const { deltaX, deltaY, deltaTime, velocity, path } = touchData;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Tap gesture
    if (distance < 10 && deltaTime < 200) {
      return { type: 'tap', confidence: 0.9 };
    }
    
    // Swipe gesture
    if (distance > 50 && deltaTime < 500) {
      const direction = getSwipeDirection(deltaX, deltaY);
      const speed = distance / deltaTime;
      return { 
        type: 'swipe', 
        direction, 
        speed,
        confidence: Math.min(speed / 2, 0.9) 
      };
    }
    
    // Circle gesture
    if (path.length > 10) {
      const circleConfidence = detectCircleGesture(path);
      if (circleConfidence > 0.7) {
        return { type: 'circle', confidence: circleConfidence };
      }
    }
    
    // Zigzag gesture
    const zigzagConfidence = detectZigzagGesture(path);
    if (zigzagConfidence > 0.6) {
      return { type: 'zigzag', confidence: zigzagConfidence };
    }
    
    return null;
  };

  const recognizeMultiTouchGesture = (touchData) => {
    const { touches } = touchData;
    const state = gestureState.current;
    
    if (touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const currentAngle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );
      
      // Pinch gesture
      if (state.initialDistance > 0) {
        const scaleChange = currentDistance / state.initialDistance;
        if (Math.abs(scaleChange - 1) > 0.1) {
          return {
            type: 'pinch',
            scale: scaleChange,
            confidence: Math.min(Math.abs(scaleChange - 1) * 2, 0.9)
          };
        }
      }
      
      // Rotate gesture
      if (state.initialAngle !== 0) {
        const angleChange = currentAngle - state.initialAngle;
        if (Math.abs(angleChange) > 0.2) {
          return {
            type: 'rotate',
            angle: angleChange,
            confidence: Math.min(Math.abs(angleChange), 0.9)
          };
        }
      }
      
      state.currentDistance = currentDistance;
      state.currentAngle = currentAngle;
    }
    
    return null;
  };

  const getSwipeDirection = (deltaX, deltaY) => {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  };

  const detectCircleGesture = (path) => {
    if (path.length < 20) return 0;
    
    // Calculate center point
    const centerX = path.reduce((sum, p) => sum + p.x, 0) / path.length;
    const centerY = path.reduce((sum, p) => sum + p.y, 0) / path.length;
    
    // Calculate average radius
    const avgRadius = path.reduce((sum, p) => {
      return sum + Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
    }, 0) / path.length;
    
    // Check how circular the path is
    let circularityScore = 0;
    path.forEach(point => {
      const distance = Math.sqrt(Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2));
      const deviation = Math.abs(distance - avgRadius) / avgRadius;
      circularityScore += Math.max(0, 1 - deviation);
    });
    
    return circularityScore / path.length;
  };

  const detectZigzagGesture = (path) => {
    if (path.length < 10) return 0;
    
    let directionChanges = 0;
    let lastDirection = null;
    
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];
      
      const dir1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const dir2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      
      const angleDiff = Math.abs(dir2 - dir1);
      
      if (angleDiff > Math.PI / 4) { // 45 degree threshold
        directionChanges++;
      }
    }
    
    return Math.min(directionChanges / (path.length / 5), 1);
  };

  // Set up touch gesture recognition
  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    
    const touchHandlers = {
      onTouchStart: (e, data) => {
        const state = gestureState.current;
        state.startTime = Date.now();
        state.touches = data.touches;
        state.path = [{ x: data.x, y: data.y, time: state.startTime }];
        
        if (data.touches.length === 2) {
          const touch1 = data.touches[0];
          const touch2 = data.touches[1];
          
          state.initialDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
          );
          
          state.initialAngle = Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
          );
        }
        
        if (onGestureStart) {
          onGestureStart(data);
        }
      },
      
      onTouchMove: (e, data) => {
        const state = gestureState.current;
        state.touches = data.touches;
        state.path.push({ x: data.x, y: data.y, time: Date.now() });
        
        // Update velocity
        if (state.path.length > 1) {
          const prev = state.path[state.path.length - 2];
          const curr = state.path[state.path.length - 1];
          const deltaTime = curr.time - prev.time;
          
          if (deltaTime > 0) {
            state.velocity = {
              x: (curr.x - prev.x) / deltaTime,
              y: (curr.y - prev.y) / deltaTime
            };
          }
        }
        
        // Try to recognize gesture in progress
        const gesture = recognizeGesture({
          ...data,
          path: state.path,
          velocity: state.velocity,
          deltaTime: Date.now() - state.startTime
        });
        
        if (gesture && gesture.confidence > 0.5) {
          setCurrentGesture(gesture);
          setGestureProgress(gesture.confidence);
        }
      },
      
      onTouchEnd: (e, data) => {
        const state = gestureState.current;
        const finalGesture = recognizeGesture({
          ...data,
          path: state.path,
          velocity: state.velocity,
          deltaTime: data.deltaTime
        });
        
        if (finalGesture && finalGesture.confidence > 0.6) {
          setRecognizedGestures(prev => [...prev, finalGesture]);
          
          if (onGestureRecognized) {
            onGestureRecognized(finalGesture);
          }
          
          // Haptic feedback based on gesture type
          const hapticType = getHapticTypeForGesture(finalGesture.type);
          touchInteractionManager.triggerHaptic(hapticType);
        }
        
        // Reset state
        setCurrentGesture(null);
        setGestureProgress(0);
        state.path = [];
        state.initialDistance = 0;
        state.initialAngle = 0;
        
        if (onGestureEnd) {
          onGestureEnd(finalGesture);
        }
      }
    };

    const cleanup = touchInteractionManager.addTouchSupport(element, touchHandlers);
    
    return cleanup;
  }, [onGestureRecognized, onGestureStart, onGestureEnd]);

  const getHapticTypeForGesture = (gestureType) => {
    const hapticMap = {
      tap: 'tap',
      swipe: 'swipe',
      pinch: 'pinch',
      rotate: 'pinch',
      circle: 'success',
      zigzag: 'selection'
    };
    
    return hapticMap[gestureType] || 'tap';
  };

  const getGestureIcon = (gestureType) => {
    const icons = {
      tap: '👆',
      swipe: '👉',
      pinch: '🤏',
      rotate: '🔄',
      circle: '⭕',
      zigzag: '〰️'
    };
    
    return icons[gestureType] || '✋';
  };

  const isMobile = deviceInfo.type === 'mobile' || deviceInfo.type === 'ios' || deviceInfo.type === 'android';

  return (
    <div
      ref={containerRef}
      className={`touch-gesture-recognizer relative ${className}`}
      style={{
        touchAction: 'none',
        userSelect: 'none'
      }}
      {...props}
    >
      {children}
      
      {/* Visual feedback overlay */}
      {showVisualFeedback && currentGesture && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="bg-black bg-opacity-50 text-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">
              {getGestureIcon(currentGesture.type)}
            </div>
            <div className="text-sm font-medium">
              {currentGesture.type.charAt(0).toUpperCase() + currentGesture.type.slice(1)}
            </div>
            <div className="w-16 h-2 bg-gray-300 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${gestureProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Learning mode panel */}
      {learningMode && isMobile && (
        <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-3 max-w-48">
          <h4 className="text-sm font-medium mb-2">Gesture Practice</h4>
          <div className="space-y-1 text-xs">
            {gestures.map(gesture => (
              <div key={gesture} className="flex items-center justify-between">
                <span>{getGestureIcon(gesture)} {gesture}</span>
                <span className={recognizedGestures.some(g => g.type === gesture) ? 'text-green-500' : 'text-gray-400'}>
                  {recognizedGestures.some(g => g.type === gesture) ? '✓' : '○'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * TouchGestureTrainer - Component for teaching gesture patterns
 */
export const TouchGestureTrainer = ({
  targetGesture,
  onGestureCompleted,
  onProgress,
  className = '',
  ...props
}) => {
  const [attempts, setAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const handleGestureRecognized = (gesture) => {
    setAttempts(prev => prev + 1);
    
    if (gesture.type === targetGesture) {
      const score = Math.round(gesture.confidence * 100);
      setBestScore(prev => Math.max(prev, score));
      
      if (onProgress) {
        onProgress(score, attempts + 1);
      }
      
      if (score >= 80 && onGestureCompleted) {
        onGestureCompleted(gesture);
      }
    }
  };

  return (
    <div className={`touch-gesture-trainer ${className}`} {...props}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium mb-2">Practice: {targetGesture}</h3>
        <div className="text-4xl mb-2">
          {/* Show target gesture icon */}
        </div>
        <div className="text-sm text-gray-600">
          Attempts: {attempts} | Best Score: {bestScore}%
        </div>
      </div>
      
      <TouchGestureRecognizer
        gestures={[targetGesture]}
        onGestureRecognized={handleGestureRecognized}
        showVisualFeedback={true}
        learningMode={false}
        className="border-2 border-dashed border-gray-300 rounded-lg min-h-48 flex items-center justify-center"
      >
        <div className="text-gray-500 text-center">
          <div className="text-2xl mb-2">✋</div>
          <div>Try the {targetGesture} gesture here</div>
        </div>
      </TouchGestureRecognizer>
    </div>
  );
};

export default TouchGestureRecognizer;