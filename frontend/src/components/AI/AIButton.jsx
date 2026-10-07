import React, { lazy, Suspense, useState } from 'react';
import { motion } from 'framer-motion';

// The drawer (and the markdown renderer it uses) is only downloaded when the chat is first opened
const loadDrawer = () => import('./AIDrawer');
const AIDrawer = lazy(loadDrawer);

export default function AIButton({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  // Stay mounted after the first open so the close animation still plays
  const [hasOpened, setHasOpened] = useState(false);

  function open() {
    setHasOpened(true);
    setIsOpen(true);
  }

  if (!user) return null;

  return (
    <>
      <motion.button
        className="ai-floating-btn"
        onClick={open}
        onMouseEnter={() => loadDrawer().catch(() => {})}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="ai-btn-glow"></div>
        <span className="ai-btn-icon">✨</span>
      </motion.button>
      
      {hasOpened && (
        <Suspense fallback={null}>
          <AIDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
