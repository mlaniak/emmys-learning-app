import React, { useState } from 'react';
import textToSpeech from '../utils/textToSpeech';

const TTSIconButton = ({
  text,
  mode = 'generic',
  className = '',
  title = 'Listen',
  ariaLabel = 'Listen'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = () => {
    if (!text) return;

    if (textToSpeech.getIsPlaying()) {
      textToSpeech.stop();
      setIsPlaying(false);
      return;
    }

    const onStart = () => setIsPlaying(true);
    const onEnd = () => setIsPlaying(false);

    if (mode === 'word') {
      textToSpeech.speakWord(text, { onStart, onEnd });
    } else if (mode === 'question') {
      textToSpeech.speakQuestion(text, { onStart, onEnd });
    } else {
      textToSpeech.speak(text, { onStart, onEnd });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      title={isPlaying ? 'Stop' : title}
      aria-label={isPlaying ? 'Stop' : ariaLabel}
    >
      {isPlaying ? '⏹' : '🔊'}
    </button>
  );
};

export default TTSIconButton;


