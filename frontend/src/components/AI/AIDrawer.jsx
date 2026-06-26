import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { api } from '../../api';
import ChatMessage from './ChatMessage';
import PromptSuggestions from './PromptSuggestions';
import TypingIndicator from './TypingIndicator';

export default function AIDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    reply: "Hi! I'm your CineAI Concierge. What kind of movie are you looking for today?"
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', reply: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await api('/ai/concierge', {
        method: 'POST',
        body: JSON.stringify({ prompt: text.trim() })
      });
      // Push the entire data object
      setMessages(prev => [...prev, { role: 'assistant', ...data }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        reply: "I'm having trouble reaching the AI service right now. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="ai-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="ai-drawer glass-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="ai-drawer-header">
              <div>
                <h2>🎬 CineAI Concierge</h2>
                <p>Your personal movie assistant</p>
              </div>
              <button className="icon-btn" onClick={onClose}><X size={20} /></button>
            </div>

            <div className="ai-drawer-messages">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            <div className="ai-drawer-input-area">
              {messages.length === 1 && (
                <PromptSuggestions onSelect={handleSend} />
              )}
              <div className="ai-input-wrapper">
                <input
                  type="text"
                  placeholder="Ask me anything about movies..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <button
                  className="ai-send-btn"
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isLoading}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
