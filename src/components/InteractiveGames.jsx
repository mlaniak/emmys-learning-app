import React, { useState, useRef, useEffect } from 'react';

// Drag and Drop Game Component
export const DragAndDropGame = ({ 
  question, 
  options, 
  correctAnswers, 
  onComplete, 
  subject = 'general',
  explanation = '' 
}) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropZones, setDropZones] = useState({});
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(null);

  const handleDragStart = (e, option) => {
    setDraggedItem(option);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropZoneId) => {
    e.preventDefault();
    const option = draggedItem;
    
    if (option) {
      setDropZones(prev => ({
        ...prev,
        [dropZoneId]: option
      }));
      
      // Check if correct
      const isCorrect = correctAnswers[dropZoneId] === option;
      if (isCorrect) {
        setScore(prev => prev + 1);
        setShowFeedback({ type: 'correct', message: 'Great job! 🎉' });
      } else {
        setShowFeedback({ type: 'incorrect', message: 'Try again! 💪' });
      }
      
      // Check if all zones are filled
      const newDropZones = { ...dropZones, [dropZoneId]: option };
      const allFilled = Object.keys(correctAnswers).every(zoneId => newDropZones[zoneId]);
      
      if (allFilled) {
        const totalCorrect = Object.keys(correctAnswers).filter(zoneId => 
          newDropZones[zoneId] === correctAnswers[zoneId]
        ).length;
        
        setCompleted(true);
        setTimeout(() => {
          onComplete(totalCorrect === Object.keys(correctAnswers).length);
        }, 1500);
      }
    }
    
    setDraggedItem(null);
    setTimeout(() => setShowFeedback(null), 2000);
  };

  const resetGame = () => {
    setDropZones({});
    setCompleted(false);
    setScore(0);
    setShowFeedback(null);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-purple-700 mb-2">{question}</h3>
        <p className="text-gray-600">Drag the items to the correct spots!</p>
      </div>

      {/* Drop Zones */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {Object.keys(correctAnswers).map((zoneId, index) => (
          <div
            key={zoneId}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, zoneId)}
            className={`min-h-24 border-2 border-dashed rounded-lg p-4 flex items-center justify-center transition-all ${
              dropZones[zoneId] 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-purple-400'
            }`}
          >
            {dropZones[zoneId] ? (
              <div className="text-center">
                <div className="text-2xl mb-1">{dropZones[zoneId].emoji}</div>
                <div className="text-sm font-medium">{dropZones[zoneId].text}</div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">Drop here</div>
            )}
          </div>
        ))}
      </div>

      {/* Draggable Options */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        {options.map((option, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, option)}
            className={`bg-gradient-to-r from-purple-400 to-pink-400 text-white p-3 rounded-lg cursor-move hover:scale-105 transition-transform ${
              Object.values(dropZones).some(zone => zone === option) ? 'opacity-50' : ''
            }`}
          >
            <div className="text-center">
              <div className="text-xl mb-1">{option.emoji}</div>
              <div className="text-sm font-medium">{option.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`text-center p-4 rounded-lg mb-4 ${
          showFeedback.type === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {showFeedback.message}
        </div>
      )}

      {/* Completion Message */}
      {completed && (
        <div className="text-center p-6 bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-lg">
          <div className="text-3xl mb-2">🎉</div>
          <h4 className="text-xl font-bold mb-2">Excellent Work!</h4>
          <p className="mb-4">You got {score} out of {Object.keys(correctAnswers).length} correct!</p>
          {explanation && <p className="text-sm opacity-90">{explanation}</p>}
        </div>
      )}

      {/* Reset Button */}
      <div className="text-center">
        <button
          onClick={resetGame}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Reset Game
        </button>
      </div>
    </div>
  );
};

// Matching Game Component
export const MatchingGame = ({ 
  question, 
  leftItems, 
  rightItems, 
  correctMatches, 
  onComplete,
  explanation = '' 
}) => {
  const [matches, setMatches] = useState({});
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(null);

  const handleLeftClick = (item) => {
    if (selectedLeft === item) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(item);
      setSelectedRight(null);
    }
  };

  const handleRightClick = (item) => {
    if (selectedRight === item) {
      setSelectedRight(null);
    } else if (selectedLeft) {
      // Check if this is a correct match
      const isCorrect = correctMatches[selectedLeft.id] === item.id;
      
      if (isCorrect) {
        setMatches(prev => ({
          ...prev,
          [selectedLeft.id]: item.id
        }));
        setScore(prev => prev + 1);
        setShowFeedback({ type: 'correct', message: 'Perfect match! ✨' });
      } else {
        setShowFeedback({ type: 'incorrect', message: 'Not quite right, try again! 🔄' });
      }
      
      setSelectedLeft(null);
      setSelectedRight(null);
      
      // Check if all matches are complete
      const newMatches = { ...matches, [selectedLeft.id]: item.id };
      const allMatched = Object.keys(correctMatches).every(leftId => newMatches[leftId]);
      
      if (allMatched) {
        setCompleted(true);
        setTimeout(() => {
          onComplete(true);
        }, 1500);
      }
      
      setTimeout(() => setShowFeedback(null), 2000);
    } else {
      setSelectedRight(item);
    }
  };

  const resetGame = () => {
    setMatches({});
    setSelectedLeft(null);
    setSelectedRight(null);
    setCompleted(false);
    setScore(0);
    setShowFeedback(null);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-purple-700 mb-2">{question}</h3>
        <p className="text-gray-600">Match the items on the left with the correct items on the right!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {/* Left Column */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-center text-blue-600">Column A</h4>
          {leftItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleLeftClick(item)}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedLeft === item
                  ? 'bg-blue-200 border-2 border-blue-400'
                  : matches[item.id]
                  ? 'bg-green-100 border-2 border-green-400'
                  : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{item.emoji}</div>
                <div className="font-medium">{item.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-center text-pink-600">Column B</h4>
          {rightItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleRightClick(item)}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedRight === item
                  ? 'bg-pink-200 border-2 border-pink-400'
                  : Object.values(matches).includes(item.id)
                  ? 'bg-green-100 border-2 border-green-400'
                  : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{item.emoji}</div>
                <div className="font-medium">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`text-center p-4 rounded-lg mb-4 ${
          showFeedback.type === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {showFeedback.message}
        </div>
      )}

      {/* Completion Message */}
      {completed && (
        <div className="text-center p-6 bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-lg">
          <div className="text-3xl mb-2">🎉</div>
          <h4 className="text-xl font-bold mb-2">All Matched!</h4>
          <p className="mb-4">You got {score} out of {Object.keys(correctMatches).length} matches correct!</p>
          {explanation && <p className="text-sm opacity-90">{explanation}</p>}
        </div>
      )}

      {/* Reset Button */}
      <div className="text-center">
        <button
          onClick={resetGame}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Reset Game
        </button>
      </div>
    </div>
  );
};

// Memory Game Component
export const MemoryGame = ({ 
  cards, 
  onComplete,
  explanation = '' 
}) => {
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleCardClick = (cardId) => {
    if (flippedCards.length >= 2 || flippedCards.includes(cardId) || matchedCards.includes(cardId)) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstCard, secondCard] = newFlippedCards;
      const firstCardData = cards.find(card => card.id === firstCard);
      const secondCardData = cards.find(card => card.id === secondCard);

      if (firstCardData.pair === secondCardData.pair) {
        // Match found
        setMatchedCards(prev => [...prev, firstCard, secondCard]);
        setFlippedCards([]);
        
        // Check if all cards are matched
        if (matchedCards.length + 2 === cards.length) {
          setCompleted(true);
          setTimeout(() => {
            onComplete(true);
          }, 1500);
        }
      } else {
        // No match, flip back after delay
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    setFlippedCards([]);
    setMatchedCards([]);
    setMoves(0);
    setCompleted(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-purple-700 mb-2">Memory Game</h3>
        <p className="text-gray-600">Find matching pairs!</p>
        <p className="text-sm text-gray-500">Moves: {moves}</p>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mb-6">
        {cards.map((card) => {
          const isFlipped = flippedCards.includes(card.id) || matchedCards.includes(card.id);
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square rounded-lg cursor-pointer transition-all duration-300 ${
                isFlipped ? 'bg-white shadow-lg' : 'bg-gradient-to-br from-purple-400 to-pink-400'
              } ${matchedCards.includes(card.id) ? 'opacity-75' : ''}`}
            >
              <div className="h-full flex items-center justify-center">
                {isFlipped ? (
                  <div className="text-center">
                    <div className="text-2xl mb-1">{card.emoji}</div>
                    <div className="text-xs font-medium">{card.text}</div>
                  </div>
                ) : (
                  <div className="text-white text-2xl">?</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completed && (
        <div className="text-center p-6 bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-lg">
          <div className="text-3xl mb-2">🎉</div>
          <h4 className="text-xl font-bold mb-2">Memory Master!</h4>
          <p className="mb-4">You completed the game in {moves} moves!</p>
          {explanation && <p className="text-sm opacity-90">{explanation}</p>}
        </div>
      )}

      {/* Reset Button */}
      <div className="text-center">
        <button
          onClick={resetGame}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Reset Game
        </button>
      </div>
    </div>
  );
};

export default { DragAndDropGame, MatchingGame, MemoryGame };
