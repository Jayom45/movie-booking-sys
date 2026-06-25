import React from 'react';
import { motion } from 'framer-motion';

export default function PromptSuggestions({ onSelect }) {
  const suggestions = [
    { label: "Recommend an action movie", icon: "🏎" },
    { label: "Date night", icon: "❤️" },
    { label: "Family movie", icon: "👨‍👩‍👧" },
    { label: "Cheapest tickets", icon: "🎟" },
    { label: "Movies near me", icon: "📍" },
    { label: "Highest rated", icon: "⭐" },
    { label: "Weekend plans", icon: "🍿" }
  ];

  return (
    <div className="ai-suggestions">
      {suggestions.map((s, i) => (
        <motion.button
          key={i}
          className="ai-suggestion-chip"
          onClick={() => onSelect(s.label)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <span>{s.icon}</span>
          {s.label}
        </motion.button>
      ))}
    </div>
  );
}
