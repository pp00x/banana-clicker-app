import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BananaParticleProps {
  x?: number;
  y?: number;
}

const BananaParticle = ({ x, y }: BananaParticleProps) => {
  const [randomValues, setRandomValues] = useState({
    x: 0,
    rotate: 0,
    duration: 0,
    scale: 1,
    emoji: '🍌',
  });

  useEffect(() => {
    setRandomValues({
      x: Math.random(),
      rotate: Math.random(),
      duration: Math.random(),
      scale: 0.5 + Math.random() * 0.5,
      emoji: Math.random() > 0.9 ? '✨' : '🍌',
    });
  }, []);

  const style = {
    '--x': randomValues.x,
    '--rotate': randomValues.rotate,
    '--duration': randomValues.duration,
    '--random-x': `calc(${randomValues.x} * 2 - 1)`,
    '--random-rotate': randomValues.rotate,
    '--random-duration': randomValues.duration,
  } as React.CSSProperties;

  return (
    <motion.div
      className="banana-rain absolute pointer-events-none text-2xl"
      style={{
        ...style,
        left: x,
        top: y,
        transform: 'scale(var(--scale))',
      }}
      initial={{ opacity: 1, y: 0 }}
      animate={{
        opacity: 0,
        y: '100vh',
        x: `calc(100px * ${randomValues.x * 2 - 1})`,
        rotate: `${randomValues.rotate * 360}deg`,
      }}
      transition={{
        duration: 2 + randomValues.duration * 2,
        ease: 'easeIn',
      }}
    >
      {randomValues.emoji}
    </motion.div>
  );
};

export default BananaParticle;