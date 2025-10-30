# Sound Files Directory

This directory contains audio files for Emmy's Learning Adventure.

## Current Implementation

The app currently uses Web Audio API to generate sounds programmatically. This provides:
- Consistent audio across all devices
- No loading delays
- Small bundle size
- No copyright concerns

## Sound Types

- **correct.mp3** - Played when student answers correctly
- **incorrect.mp3** - Played when student answers incorrectly  
- **complete.mp3** - Played when student completes an activity
- **click.mp3** - Played for button clicks and interactions
- **achievement.mp3** - Played when student unlocks an achievement
- **celebration.mp3** - Played for perfect scores and major milestones

## Future Enhancements

To add actual audio files:

1. Add .mp3 or .wav files to this directory
2. Update `src/utils/audioManager.js` sound definitions
3. Change sound type from 'generated' to 'file'
4. Add file URLs to the definitions

Example:
```javascript
correct: {
  type: 'file',
  url: '/sounds/correct.mp3'
}
```

## File Requirements

- Format: MP3 or WAV
- Duration: 0.5-2 seconds for feedback sounds
- Size: Keep under 50KB each for fast loading
- Quality: 44.1kHz, 16-bit minimum