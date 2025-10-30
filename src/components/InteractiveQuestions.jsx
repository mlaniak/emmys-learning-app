import React, { useState, useRef, useEffect } from 'react';
import { TouchButton } from './ResponsiveLayout';
import { getDeviceType, getTouchCapabilities } from '../utils/responsiveUtils';

const InteractiveQuestions = ({ question, onAnswer, playSound, triggerHaptic }) => {
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop',
    touchCapabilities: {},
  });

  useEffect(() => {
    setDeviceInfo({
      type: getDeviceType(),
      touchCapabilities: getTouchCapabilities(),
    });
  }, []);
  const [draggedItem, setDraggedItem] = useState(null);
  const [droppedItems, setDroppedItems] = useState({});
  const [drawingPath, setDrawingPath] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  // Drag and Drop Question Component
  const DragDropQuestion = ({ question, options, correct, onAnswer }) => {
    const handleDragStart = (e, item) => {
      setDraggedItem(item);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropZone) => {
      e.preventDefault();
      if (draggedItem) {
        setDroppedItems(prev => ({
          ...prev,
          [dropZone]: draggedItem
        }));
        
        // Check if answer is correct
        const isCorrect = draggedItem === correct;
        onAnswer(draggedItem, correct, [question], `Great job! ${draggedItem} ${isCorrect ? 'is correct!' : 'is not quite right. Try again!'}`);
        
        setDraggedItem(null);
      }
    };

    const isMobile = deviceInfo.type === 'mobile' || deviceInfo.type === 'ios' || deviceInfo.type === 'android';

    return (
      <div className="card-mobile max-w-2xl mx-auto">
        <h3 className={`font-bold mb-6 text-center text-gray-800 ${
          isMobile ? 'text-lg sm:text-xl' : 'text-xl md:text-2xl'
        }`}>{question}</h3>
        
        {/* Draggable Items - Mobile optimized */}
        <div className={`flex justify-center gap-3 mb-6 ${isMobile ? 'flex-wrap' : ''}`}>
          {options.map((option, index) => (
            <div
              key={index}
              draggable={!isMobile} // Disable drag on mobile, use touch instead
              onDragStart={(e) => !isMobile && handleDragStart(e, option)}
              onClick={() => isMobile && handleMobileDrop(option)} // Mobile tap to select
              className={`border-2 border-blue-300 rounded-lg p-3 transition-all duration-200 ${
                isMobile 
                  ? 'bg-blue-100 active:bg-blue-200 min-h-touch cursor-pointer active:scale-95 transform' 
                  : 'bg-blue-100 cursor-move hover:bg-blue-200'
              } ${draggedItem === option ? 'opacity-50' : ''}`}
            >
              {option}
            </div>
          ))}
        </div>
        
        {/* Drop Zone - Mobile optimized */}
        <div
          onDragOver={!isMobile ? handleDragOver : undefined}
          onDrop={!isMobile ? (e) => handleDrop(e, 'answer') : undefined}
          className={`border-4 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 transition-all duration-200 ${
            isMobile ? 'p-6 min-h-[80px]' : 'p-8 min-h-[100px]'
          } flex items-center justify-center`}
        >
          {droppedItems.answer ? (
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3">
              {droppedItems.answer}
            </div>
          ) : (
            <p className="text-gray-500">
              {isMobile ? 'Tap an option above' : 'Drop your answer here'}
            </p>
          )}
        </div>
        
        {/* Mobile instructions */}
        {isMobile && (
          <div className="text-center text-xs text-gray-400 mt-3">
            Tap an option to select it
          </div>
        )}
      </div>
    );

    // Mobile tap handler for drag-drop
    const handleMobileDrop = (option) => {
      setDroppedItems(prev => ({
        ...prev,
        answer: option
      }));
      
      // Haptic feedback
      if (deviceInfo.touchCapabilities.supportsHaptics) {
        navigator.vibrate(10);
      }
      
      // Check if answer is correct
      const isCorrect = option === correct;
      onAnswer(option, correct, [question], `Great job! ${option} ${isCorrect ? 'is correct!' : 'is not quite right. Try again!'}`);
      
      setDraggedItem(null);
    };
  };

  // Drawing Question Component
  const DrawingQuestion = ({ question, onAnswer }) => {
    const startDrawing = (e) => {
      setIsDrawing(true);
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      triggerHaptic('light');
    };

    const draw = (e) => {
      if (!isDrawing) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      setIsDrawing(false);
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      playSound('click');
    };

    const submitDrawing = () => {
      // For now, always consider drawing as correct
      onAnswer('drawing', 'drawing', [question], 'Great drawing! You completed the task!');
      playSound('correct');
    };

    // Touch drawing handlers for mobile
    const startTouchDrawing = (e) => {
      e.preventDefault();
      setIsDrawing(true);
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      if (deviceInfo.touchCapabilities.supportsHaptics) {
        navigator.vibrate(10);
      }
    };

    const touchDraw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopTouchDrawing = (e) => {
      e.preventDefault();
      setIsDrawing(false);
    };

    const isMobile = deviceInfo.type === 'mobile' || deviceInfo.type === 'ios' || deviceInfo.type === 'android';

    return (
      <div className="card-mobile max-w-2xl mx-auto">
        <h3 className={`font-bold mb-6 text-center text-gray-800 ${
          isMobile ? 'text-lg sm:text-xl' : 'text-xl md:text-2xl'
        }`}>{question}</h3>
        
        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            width={isMobile ? 300 : 400}
            height={isMobile ? 225 : 300}
            // Mouse events for desktop
            onMouseDown={!isMobile ? startDrawing : undefined}
            onMouseMove={!isMobile ? draw : undefined}
            onMouseUp={!isMobile ? stopDrawing : undefined}
            onMouseLeave={!isMobile ? stopDrawing : undefined}
            // Touch events for mobile
            onTouchStart={isMobile ? startTouchDrawing : undefined}
            onTouchMove={isMobile ? touchDraw : undefined}
            onTouchEnd={isMobile ? stopTouchDrawing : undefined}
            className="border-2 border-gray-300 rounded-lg bg-white"
            style={{ 
              touchAction: 'none',
              cursor: isMobile ? 'default' : 'crosshair',
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>
        
        <div className={`flex gap-3 ${isMobile ? 'flex-col sm:flex-row' : 'justify-center'}`}>
          <TouchButton
            onClick={clearCanvas}
            variant="danger"
            size={isMobile ? 'large' : 'medium'}
            className={isMobile ? 'flex-1' : ''}
          >
            Clear
          </TouchButton>
          <TouchButton
            onClick={submitDrawing}
            variant="success"
            size={isMobile ? 'large' : 'medium'}
            className={isMobile ? 'flex-1' : ''}
          >
            Submit Drawing
          </TouchButton>
        </div>
        
        {/* Mobile instructions */}
        {isMobile && (
          <div className="text-center text-xs text-gray-400 mt-3">
            Use your finger to draw on the canvas
          </div>
        )}
      </div>
    );
  };

  // Audio Question Component
  const AudioQuestion = ({ question, audioText, options, correct, onAnswer }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const playAudio = () => {
      if ('speechSynthesis' in window) {
        setIsPlaying(true);
        const utterance = new SpeechSynthesisUtterance(audioText || question);
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        utterance.onend = () => setIsPlaying(false);
        speechSynthesis.speak(utterance);
        playSound('click');
      }
    };

    const isMobile = deviceInfo.type === 'mobile' || deviceInfo.type === 'ios' || deviceInfo.type === 'android';

    return (
      <div className="card-mobile max-w-2xl mx-auto">
        <h3 className={`font-bold mb-6 text-center text-gray-800 ${
          isMobile ? 'text-lg sm:text-xl' : 'text-xl md:text-2xl'
        }`}>{question}</h3>
        
        <div className="flex justify-center mb-8">
          <TouchButton
            onClick={playAudio}
            disabled={isPlaying}
            variant={isPlaying ? 'secondary' : 'primary'}
            size="large"
            className={`${isPlaying ? 'cursor-not-allowed opacity-75' : 'hover:scale-105'} transition-all duration-200`}
          >
            {isPlaying ? '🔊 Playing...' : '🔊 Listen'}
          </TouchButton>
        </div>
        
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {options.map((option, index) => (
            <TouchButton
              key={index}
              onClick={() => {
                // Haptic feedback
                if (deviceInfo.touchCapabilities.supportsHaptics) {
                  navigator.vibrate(10);
                }
                onAnswer(option, correct, [question], `You chose ${option}. ${option === correct ? 'Correct!' : 'Try again!'}`);
              }}
              variant="outline"
              size={isMobile ? 'large' : 'medium'}
              className="bg-purple-50 border-purple-300 text-purple-800 hover:bg-purple-100"
            >
              {option}
            </TouchButton>
          ))}
        </div>
      </div>
    );
  };

  // Render appropriate question type
  const renderQuestion = () => {
    switch (question.type) {
      case 'drag-and-drop':
        return (
          <DragDropQuestion
            question={question.question}
            options={question.options}
            correct={question.correct}
            onAnswer={onAnswer}
          />
        );
      case 'drawing':
        return (
          <DrawingQuestion
            question={question.question}
            onAnswer={onAnswer}
          />
        );
      case 'audio':
        return (
          <AudioQuestion
            question={question.question}
            audioText={question.audioText}
            options={question.options}
            correct={question.correct}
            onAnswer={onAnswer}
          />
        );
      default:
        // Default multiple choice - Mobile optimized
        const isMobile = deviceInfo.type === 'mobile' || deviceInfo.type === 'ios' || deviceInfo.type === 'android';
        
        return (
          <div className="card-mobile max-w-2xl mx-auto">
            <h3 className={`font-bold mb-6 text-center text-gray-800 ${
              isMobile ? 'text-lg sm:text-xl' : 'text-xl md:text-2xl'
            }`}>{question.question}</h3>
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {question.options.map((option, index) => (
                <TouchButton
                  key={index}
                  onClick={() => {
                    // Haptic feedback
                    if (deviceInfo.touchCapabilities.supportsHaptics) {
                      navigator.vibrate(10);
                    }
                    onAnswer(option, question.correct, [question], question.explanation);
                  }}
                  variant="outline"
                  size={isMobile ? 'large' : 'medium'}
                  className="bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100 text-left"
                >
                  {option}
                </TouchButton>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="interactive-question">
      {renderQuestion()}
    </div>
  );
};

export default InteractiveQuestions;