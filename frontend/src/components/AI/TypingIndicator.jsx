import React from 'react';
import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <div className="ai-message ai-message-assistant">
      <div className="ai-typing-indicator">
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.4, delay: 0 }}
        >●</motion.span>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }}
        >●</motion.span>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }}
        >●</motion.span>
      </div>
    </div>
  );
}
