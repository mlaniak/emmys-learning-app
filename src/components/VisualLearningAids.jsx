import React, { useState, useEffect } from 'react';

// Animated Number Line Component
export const AnimatedNumberLine = ({ 
  start = 0, 
  end = 10, 
  highlight = [], 
  currentValue = null,
  showLabels = true 
}) => {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 3);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="relative">
        {/* Number Line */}
        <div className="flex items-center justify-between mb-4">
          {numbers.map((num, index) => (
            <div key={num} className="flex flex-col items-center">
              {/* Tick Mark */}
              <div className={`w-1 h-6 mb-2 ${
                highlight.includes(num) ? 'bg-red-500' : 'bg-gray-400'
              }`}></div>
              
              {/* Number */}
              <div className={`text-lg font-bold ${
                highlight.includes(num) ? 'text-red-600' : 'text-gray-700'
              } ${currentValue === num ? 'animate-pulse' : ''}`}>
                {num}
              </div>
              
              {/* Label */}
              {showLabels && (
                <div className="text-xs text-gray-500 mt-1">
                  {num === 0 ? 'Start' : num === end ? 'End' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Connecting Line */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-300"></div>
        
        {/* Highlighted segments */}
        {highlight.map((num, index) => (
          <div
            key={index}
            className="absolute top-3 h-0.5 bg-red-500 animate-pulse"
            style={{
              left: `${(num - start) / (end - start) * 100}%`,
              width: `${100 / (end - start)}%`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

// Interactive Place Value Chart
export const PlaceValueChart = ({ 
  number, 
  showAnimation = true,
  highlightPlace = null 
}) => {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (showAnimation) {
      const interval = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % 4);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [showAnimation]);

  const digits = number.toString().split('').reverse();
  const places = ['Ones', 'Tens', 'Hundreds', 'Thousands'];

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-bold text-center mb-4">Place Value Chart</h3>
      
      <div className="flex justify-center space-x-2">
        {digits.map((digit, index) => {
          const place = places[index];
          const isHighlighted = highlightPlace === place;
          
          return (
            <div
              key={index}
              className={`text-center p-4 rounded-lg border-2 transition-all ${
                isHighlighted 
                  ? 'border-blue-500 bg-blue-50 animate-pulse' 
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="text-sm text-gray-600 mb-2">{place}</div>
              <div className={`text-3xl font-bold ${
                isHighlighted ? 'text-blue-600' : 'text-gray-800'
              }`}>
                {digit}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {digit} × {Math.pow(10, index)}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="text-center mt-4 text-gray-600">
        Total: {number.toLocaleString()}
      </div>
    </div>
  );
};

// Animated Fraction Visualizer
export const FractionVisualizer = ({ 
  numerator, 
  denominator, 
  showAnimation = true 
}) => {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (showAnimation) {
      const interval = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % 3);
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [showAnimation]);

  const filledSections = Math.floor((numerator / denominator) * 8);
  const sections = Array.from({ length: 8 }, (_, i) => i < filledSections);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-bold text-center mb-4">Fraction Visualizer</h3>
      
      <div className="flex justify-center items-center space-x-4 mb-4">
        {/* Visual Representation */}
        <div className="grid grid-cols-4 gap-1">
          {sections.map((filled, index) => (
            <div
              key={index}
              className={`w-8 h-8 border-2 rounded transition-all duration-500 ${
                filled 
                  ? 'bg-blue-500 border-blue-600' 
                  : 'bg-gray-200 border-gray-300'
              } ${animationStep === 0 && filled ? 'animate-bounce' : ''}`}
            ></div>
          ))}
        </div>
        
        {/* Fraction Display */}
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600">
            {numerator}
          </div>
          <div className="border-t-2 border-gray-400"></div>
          <div className="text-4xl font-bold text-blue-600">
            {denominator}
          </div>
        </div>
      </div>
      
      <div className="text-center text-gray-600">
        {numerator} out of {denominator} parts are filled
      </div>
    </div>
  );
};

// Interactive Periodic Table (Simplified)
export const PeriodicTable = ({ 
  elements = [], 
  highlightElement = null,
  showAnimation = true 
}) => {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (showAnimation) {
      const interval = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % 4);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showAnimation]);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-bold text-center mb-4">Periodic Table</h3>
      
      <div className="grid grid-cols-8 gap-1 max-w-md mx-auto">
        {elements.map((element, index) => {
          const isHighlighted = highlightElement === element.symbol;
          
          return (
            <div
              key={element.symbol}
              className={`text-center p-2 rounded border transition-all ${
                isHighlighted 
                  ? 'bg-yellow-200 border-yellow-400 animate-pulse' 
                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
              }`}
            >
              <div className="text-xs font-bold">{element.symbol}</div>
              <div className="text-xs text-gray-600">{element.number}</div>
            </div>
          );
        })}
      </div>
      
      {highlightElement && (
        <div className="mt-4 text-center">
          <div className="text-lg font-bold text-yellow-600">
            {elements.find(e => e.symbol === highlightElement)?.name}
          </div>
          <div className="text-sm text-gray-600">
            {elements.find(e => e.symbol === highlightElement)?.description}
          </div>
        </div>
      )}
    </div>
  );
};

// Animated Weather Chart
export const WeatherChart = ({ 
  data = [], 
  showAnimation = true 
}) => {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (showAnimation) {
      const interval = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % 3);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [showAnimation]);

  const maxTemp = Math.max(...data.map(d => d.temperature));

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-bold text-center mb-4">Weekly Weather</h3>
      
      <div className="flex items-end justify-between h-48 space-x-2">
        {data.map((day, index) => {
          const height = (day.temperature / maxTemp) * 100;
          
          return (
            <div key={day.day} className="flex flex-col items-center flex-1">
              {/* Temperature Bar */}
              <div className="relative w-full flex flex-col justify-end h-32">
                <div
                  className={`w-full rounded-t transition-all duration-1000 ${
                    day.temperature > 20 ? 'bg-red-400' : 
                    day.temperature > 10 ? 'bg-yellow-400' : 'bg-blue-400'
                  } ${animationStep === 0 ? 'animate-pulse' : ''}`}
                  style={{ height: `${height}%` }}
                ></div>
                
                {/* Temperature Label */}
                <div className="text-xs font-bold mt-1">
                  {day.temperature}°
                </div>
              </div>
              
              {/* Day Label */}
              <div className="text-xs text-gray-600 mt-2">{day.day}</div>
              
              {/* Weather Icon */}
              <div className="text-lg mt-1">{day.icon}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Interactive Timeline
export const InteractiveTimeline = ({ 
  events = [], 
  highlightEvent = null,
  showAnimation = true 
}) => {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (showAnimation) {
      const interval = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % 3);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [showAnimation]);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-bold text-center mb-4">Timeline</h3>
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-300"></div>
        
        {events.map((event, index) => {
          const isHighlighted = highlightEvent === event.id;
          
          return (
            <div key={event.id} className="relative flex items-center mb-6">
              {/* Timeline Dot */}
              <div className={`absolute left-6 w-4 h-4 rounded-full border-2 ${
                isHighlighted 
                  ? 'bg-blue-500 border-blue-600 animate-pulse' 
                  : 'bg-white border-gray-400'
              }`}></div>
              
              {/* Event Content */}
              <div className={`ml-12 p-4 rounded-lg border transition-all ${
                isHighlighted 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{event.icon}</div>
                  <div>
                    <div className="font-bold text-gray-800">{event.title}</div>
                    <div className="text-sm text-gray-600">{event.date}</div>
                    <div className="text-sm text-gray-700 mt-1">{event.description}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default {
  AnimatedNumberLine,
  PlaceValueChart,
  FractionVisualizer,
  PeriodicTable,
  WeatherChart,
  InteractiveTimeline
};
