import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AIDrawer from './AIDrawer';

export default function AIButton({ user }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <motion.button
        className="ai-floating-btn"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="ai-btn-glow"></div>
        <span className="ai-btn-icon">✨</span>
      </motion.button>
      
      <AIDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
