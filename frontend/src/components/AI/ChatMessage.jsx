import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  // Custom link renderer to use React Router Link for internal links
  const components = {
    a: ({ node, ...props }) => {
      const isInternal = props.href?.startsWith('/');
      if (isInternal) {
        return <Link to={props.href} className="ai-book-link">{props.children}</Link>;
      }
      return <a target="_blank" rel="noopener noreferrer" className="ai-external-link" {...props} />;
    }
  };

  return (
    <motion.div
      className={`ai-message ${isUser ? 'ai-message-user' : 'ai-message-assistant'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="ai-message-bubble">
        {isUser ? (
          <p>{message.text}</p>
        ) : (
          <ReactMarkdown components={components}>{message.text}</ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}
