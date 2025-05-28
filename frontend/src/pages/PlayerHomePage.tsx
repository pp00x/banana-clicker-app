import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import BananaParticle from '../components/common/BananaParticle';

const PlayerHomePage = () => {
  const { user } = useAuth();
  const { emitBananaClick, isConnected } = useSocket();
  const { showNotification } = useNotification();
  
  const [clickCount, setClickCount] = useState(0);
  const [bananaAnimation, setBananaAnimation] = useState('');
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [showCombo, setShowCombo] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  
  const bananaRef = useRef<HTMLDivElement>(null);
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Corrected type
  
  // Banana spring animation
  const [{ scale }, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 10 },
  }));

  // Reset combo if not clicked within 2 seconds
  useEffect(() => {
    if (comboTimeoutRef.current) {
      clearTimeout(comboTimeoutRef.current);
    }
    
    if (comboMultiplier > 1) {
      comboTimeoutRef.current = setTimeout(() => {
        setComboMultiplier(1);
        setShowCombo(false);
      }, 2000);
    }
    
    return () => {
      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current);
      }
    };
  }, [comboMultiplier, lastClickTime]);

  const handleBananaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isConnected) {
      showNotification({
        title: 'Connection Error',
        message: 'You are not connected to the server',
        type: 'error',
      });
      return;
    }
    
    // Get click position relative to the banana
    if (bananaRef.current) {
      const rect = bananaRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setClickPosition({ x, y });
    }
    
    // Generate particles
    const newParticles: { id: number; x: number; y: number }[] = []; // Explicitly typed
    for (let i = 0; i < 5; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: e.clientX,
        y: e.clientY,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    
    // Remove particles after animation completes
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 3000);
    
    // Check for combo
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;
    
    if (timeSinceLastClick < 500 && lastClickTime !== 0) {
      // Increase combo up to a maximum of 10x
      setComboMultiplier((prev) => Math.min(prev + 1, 10));
      setShowCombo(true);
    } else {
      setComboMultiplier(1);
      setShowCombo(false);
    }
    
    setLastClickTime(now);
    
    // Banana click animation
    setBananaAnimation('banana-click');
    api.start({ scale: 0.8 });
    setTimeout(() => {
      api.start({ scale: 1 });
      setBananaAnimation('');
    }, 150);
    
    // Emit click event
    emitBananaClick();
    
    // Increment local click counter
    setClickCount((prev) => prev + 1);
  };

  const getBananaSize = () => {
    // Calculate banana size based on count
    const baseSize = 200;
    const maxSizeIncrease = 100;
    const bananaCount = user?.bananaCount || 0;
    
    // Logarithmic scaling to prevent the banana from getting too big
    const sizeIncrease = Math.min(
      Math.log10(bananaCount + 1) * 30,
      maxSizeIncrease
    );
    
    return baseSize + sizeIncrease;
  };

  const bananaSize = getBananaSize();
  const bananaEmoji = '🍌';

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center banana-cursor">
      {/* Stats Section */}
      <div className="absolute top-0 left-0 right-0 flex justify-center">
        <div className="bg-white/90 backdrop-blur-md rounded-b-2xl shadow-xl px-8 py-4 w-full max-w-md">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-yellow-800">
                Welcome, {user?.displayName || 'Player'}!
              </h2>
              <p className="text-yellow-700">
                This session: <span className="font-bold">{clickCount}</span> clicks
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-yellow-600">Your total</p>
              <p className="text-3xl font-bold text-yellow-800">
                {user?.bananaCount || 0}
              </p>
              <p className="text-xs text-yellow-600">bananas</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Banana Button */}
      <div className="flex flex-col items-center justify-center mt-16">
        <div
          ref={bananaRef}
          className={`relative group cursor-pointer ${bananaAnimation}`}
          onClick={handleBananaClick}
        >
          {/* Banana glow effect */}
          <div className="absolute -inset-8 rounded-full bg-yellow-400 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30"></div>
          
          {/* Banana shadow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black/20 rounded-full blur-md transition-all duration-300 group-hover:w-44"></div>
          
          {/* Animated banana */}
          <animated.div
            style={{ scale }}
            className="banana-float relative non-selectable"
          >
            <span style={{ fontSize: `${bananaSize}px` }} className="non-selectable">{bananaEmoji}</span>
          </animated.div>
          
          {/* Click ripple effect */}
          <AnimatePresence>
            {bananaAnimation && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute rounded-full bg-yellow-300 -z-10"
                style={{
                  width: 50,
                  height: 50,
                  left: clickPosition.x - 25,
                  top: clickPosition.y - 25,
                }}
              />
            )}
          </AnimatePresence>
        </div>
        
        {/* Combo indicator */}
        <AnimatePresence>
          {showCombo && comboMultiplier > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full shadow-lg"
            >
              <span className="text-white font-bold text-2xl">
                {comboMultiplier}x COMBO!
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="mt-16 text-center">
          <h2 className="text-4xl font-bold text-gradient mb-2">
            Keep clicking!
          </h2>
          <p className="text-lg text-gray-700 max-w-md mx-auto">
            Click the banana to increase your score. The more you click, the bigger it gets!
          </p>
        </div>
      </div>
      
      {/* Button to trigger special effects */}
      <div className="mt-8">
        <Button
          variant="accent"
          onClick={() => {
            for (let i = 0; i < 20; i++) {
              setTimeout(() => {
                setParticles((prev) => [
                  ...prev,
                  {
                    id: Date.now() + i,
                    x: Math.random() * window.innerWidth,
                    y: -50,
                  },
                ]);
              }, i * 100);
            }
            
            showNotification({
              title: 'Banana Rain!',
              message: 'You triggered a special effect!',
              type: 'success',
            });
          }}
          className="px-8 py-4"
        >
          Trigger Banana Rain!
        </Button>
      </div>
      
      {/* Connection status */}
      <div className="absolute bottom-4 right-4">
        <div className={`flex items-center space-x-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      {/* Banana particles */}
      {particles.map((particle) => (
        <BananaParticle key={particle.id} x={particle.x} y={particle.y} />
      ))}
    </div>
  );
};

export default PlayerHomePage;