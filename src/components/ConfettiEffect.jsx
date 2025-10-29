/**
 * Confetti Effect Component
 * 
 * Renders animated confetti particles for celebrations
 * in Emmy's Learning Adventure.
 */

import React, { useEffect, useState } from 'react';

const ConfettiEffect = ({ 
  active = false, 
  duration = 3000, 
  particleCount = 50,
  colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
  onComplete = () => {}
}) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    // Generate confetti particles
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: Math.random() * 100,
      animationDelay: Math.random() * 2,
      size: Math.random() * 6 + 4,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
      rotation: Math.random() * 360
    }));

    setParticles(newParticles);

    // Clean up after duration
    const timer = setTimeout(() => {
      setParticles([]);
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [active, duration, particleCount, colors, onComplete]);

  if (!active || particles.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50"
      style={{ overflow: 'hidden' }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="confetti-particle absolute"
          style={{
            left: `${particle.left}%`,
            top: '-10px',
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            borderRadius: particle.shape === 'circle' ? '50%' : '0',
            animationDelay: `${particle.animationDelay}s`,
            transform: `rotate(${particle.rotation}deg)`
          }}
        />
      ))}
    </div>
  );
};

export default ConfettiEffect;