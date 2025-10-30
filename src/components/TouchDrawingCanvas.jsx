import React, { useRef, useEffect, useState, useCallback } from 'react';
import touchInteractionManager from '../utils/touchInteractionManager';
import TouchButton from './TouchButton';
import { getDeviceType, getTouchCapabilities } from '../utils/responsiveUtils';

/**
 * TouchDrawingCanvas - Advanced drawing canvas with touch support
 * 
 * Features:
 * - Multi-touch drawing support
 * - Pressure sensitivity (where supported)
 * - Gesture recognition for zoom/pan
 * - Drawing tools and colors
 * - Undo/redo functionality
 * - Touch-optimized UI
 */
const TouchDrawingCanvas = ({
  width = 600,
  height = 400,
  backgroundColor = '#ffffff',
  onDrawingChange,
  onDrawingComplete,
  tools = ['pen', 'eraser', 'highlighter'],
  colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
  initialTool = 'pen',
  initialColor = '#000000',
  initialLineWidth = 3,
  className = '',
  ...props
}) => {
  const canvasRef = useRef(null);
  const [currentTool, setCurrentTool] = useState(initialTool);
  const [currentColor, setCurrentColor] = useState(initialColor);
  const [currentLineWidth, setCurrentLineWidth] = useState(initialLineWidth);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop',
    touchCapabilities: {}
  });

  // Drawing state
  const drawingState = useRef({
    paths: [],
    currentPath: null,
    lastPoint: null
  });

  useEffect(() => {
    setDeviceInfo({
      type: getDeviceType(),
      touchCapabilities: getTouchCapabilities()
    });
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Set initial canvas properties
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Save initial state
    saveToHistory();
  }, [width, height, backgroundColor]);

  // Save current canvas state to history
  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    
    setDrawingHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(imageData);
      return newHistory;
    });
    
    setHistoryStep(prev => prev + 1);
  }, [historyStep]);

  // Undo last action
  const undo = useCallback(() => {
    if (historyStep > 0) {
      setHistoryStep(prev => prev - 1);
      restoreFromHistory(historyStep - 1);
    }
  }, [historyStep]);

  // Redo last undone action
  const redo = useCallback(() => {
    if (historyStep < drawingHistory.length - 1) {
      setHistoryStep(prev => prev + 1);
      restoreFromHistory(historyStep + 1);
    }
  }, [historyStep, drawingHistory.length]);

  // Restore canvas from history
  const restoreFromHistory = useCallback((step) => {
    if (!canvasRef.current || !drawingHistory[step]) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    
    img.src = drawingHistory[step];
  }, [drawingHistory]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawingState.current.paths = [];
    drawingState.current.currentPath = null;
    
    saveToHistory();
    
    if (onDrawingChange) {
      onDrawingChange(canvas.toDataURL());
    }
  }, [backgroundColor, onDrawingChange, saveToHistory]);

  // Get drawing context with current tool settings
  const getDrawingContext = useCallback(() => {
    if (!canvasRef.current) return null;
    
    const ctx = canvasRef.current.getContext('2d');
    
    // Set tool properties
    switch (currentTool) {
      case 'pen':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentLineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        break;
        
      case 'eraser':
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = currentLineWidth * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        break;
        
      case 'highlighter':
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentLineWidth * 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.3;
        break;
        
      default:
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentLineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
    
    return ctx;
  }, [currentTool, currentColor, currentLineWidth]);

  // Start drawing
  const startDrawing = useCallback((x, y, pressure = 1) => {
    const ctx = getDrawingContext();
    if (!ctx) return;
    
    setIsDrawing(true);
    
    drawingState.current.currentPath = {
      tool: currentTool,
      color: currentColor,
      lineWidth: currentLineWidth * pressure,
      points: [{ x, y, pressure }]
    };
    
    drawingState.current.lastPoint = { x, y };
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    if (onDrawingChange) {
      onDrawingChange(canvasRef.current.toDataURL());
    }
  }, [currentTool, currentColor, currentLineWidth, getDrawingContext, onDrawingChange]);

  // Continue drawing
  const continueDrawing = useCallback((x, y, pressure = 1) => {
    if (!isDrawing) return;
    
    const ctx = getDrawingContext();
    if (!ctx || !drawingState.current.lastPoint) return;
    
    // Add point to current path
    if (drawingState.current.currentPath) {
      drawingState.current.currentPath.points.push({ x, y, pressure });
    }
    
    // Draw smooth line using quadratic curves
    const lastPoint = drawingState.current.lastPoint;
    const midX = (lastPoint.x + x) / 2;
    const midY = (lastPoint.y + y) / 2;
    
    ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
    ctx.stroke();
    
    drawingState.current.lastPoint = { x, y };
    
    if (onDrawingChange) {
      onDrawingChange(canvasRef.current.toDataURL());
    }
  }, [isDrawing, getDrawingContext, onDrawingChange]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    const ctx = getDrawingContext();
    if (ctx) {
      ctx.closePath();
      ctx.globalAlpha = 1; // Reset alpha for highlighter
    }
    
    // Save current path to history
    if (drawingState.current.currentPath) {
      drawingState.current.paths.push(drawingState.current.currentPath);
      drawingState.current.currentPath = null;
    }
    
    drawingState.current.lastPoint = null;
    
    saveToHistory();
    
    if (onDrawingComplete) {
      onDrawingComplete(canvasRef.current.toDataURL());
    }
  }, [isDrawing, getDrawingContext, saveToHistory, onDrawingComplete]);

  // Set up touch drawing support
  useEffect(() => {
    if (!canvasRef.current) return;

    const cleanup = touchInteractionManager.addDrawingSupport(canvasRef.current, {
      strokeStyle: currentColor,
      lineWidth: currentLineWidth,
      onDrawStart: ({ x, y }) => startDrawing(x, y),
      onDraw: ({ x, y }) => continueDrawing(x, y),
      onDrawEnd: () => stopDrawing()
    });

    return cleanup;
  }, [currentColor, currentLineWidth, startDrawing, continueDrawing, stopDrawing]);

  // Tool selection buttons
  const toolButtons = tools.map(tool => ({
    key: tool,
    children: getToolIcon(tool),
    onClick: () => setCurrentTool(tool),
    variant: currentTool === tool ? 'primary' : 'secondary',
    size: 'medium',
    hapticType: 'selection'
  }));

  // Color selection buttons
  const colorButtons = colors.map(color => ({
    key: color,
    children: <div className="w-6 h-6 rounded-full border-2 border-gray-300" style={{ backgroundColor: color }} />,
    onClick: () => setCurrentColor(color),
    variant: currentColor === color ? 'primary' : 'ghost',
    size: 'medium',
    hapticType: 'selection'
  }));

  // Action buttons
  const actionButtons = [
    {
      key: 'undo',
      children: '↶',
      onClick: undo,
      disabled: historyStep <= 0,
      variant: 'secondary',
      hapticType: 'tap'
    },
    {
      key: 'redo',
      children: '↷',
      onClick: redo,
      disabled: historyStep >= drawingHistory.length - 1,
      variant: 'secondary',
      hapticType: 'tap'
    },
    {
      key: 'clear',
      children: '🗑️',
      onClick: clearCanvas,
      variant: 'danger',
      hapticType: 'error',
      contextMenuItems: [
        {
          label: 'Clear Canvas',
          action: clearCanvas
        }
      ]
    }
  ];

  function getToolIcon(tool) {
    const icons = {
      pen: '✏️',
      eraser: '🧽',
      highlighter: '🖍️'
    };
    return icons[tool] || '✏️';
  }

  const isMobile = deviceInfo.type === 'mobile' || deviceInfo.type === 'ios' || deviceInfo.type === 'android';

  return (
    <div className={`touch-drawing-canvas ${className}`} {...props}>
      {/* Canvas */}
      <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block touch-none"
          style={{
            width: '100%',
            height: 'auto',
            maxWidth: `${width}px`,
            maxHeight: `${height}px`
          }}
        />
        
        {/* Drawing indicator */}
        {isDrawing && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
            Drawing...
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-4">
        {/* Tools */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2 flex items-center">Tools:</span>
          {toolButtons.map(button => (
            <TouchButton key={button.key} {...button} />
          ))}
        </div>

        {/* Colors */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2 flex items-center">Colors:</span>
          {colorButtons.map(button => (
            <TouchButton key={button.key} {...button} />
          ))}
        </div>

        {/* Line Width */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={currentLineWidth}
            onChange={(e) => setCurrentLineWidth(parseInt(e.target.value))}
            className="flex-1 max-w-32"
            style={{ minHeight: isMobile ? '44px' : 'auto' }}
          />
          <span className="text-sm text-gray-600 w-8">{currentLineWidth}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {actionButtons.map(button => (
            <TouchButton key={button.key} {...button} />
          ))}
        </div>
      </div>

      {/* Mobile-specific instructions */}
      {isMobile && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-1">Touch Instructions:</p>
          <ul className="text-xs space-y-1">
            <li>• Tap and drag to draw</li>
            <li>• Long press tools/colors for options</li>
            <li>• Long press clear button to confirm</li>
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * TouchSketchPad - Simplified drawing component for quick sketches
 */
export const TouchSketchPad = ({
  width = 300,
  height = 200,
  onSketchComplete,
  className = '',
  ...props
}) => {
  return (
    <TouchDrawingCanvas
      width={width}
      height={height}
      tools={['pen', 'eraser']}
      colors={['#000000', '#ff0000', '#0000ff']}
      onDrawingComplete={onSketchComplete}
      className={`touch-sketch-pad ${className}`}
      {...props}
    />
  );
};

export default TouchDrawingCanvas;