import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Users, Ticket, Tag } from 'lucide-react';

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
          <p>{message.reply}</p>
        ) : (
          <>
            <ReactMarkdown components={components}>{message.reply || ''}</ReactMarkdown>
            
            {message.recommendations && message.recommendations.length > 0 && (
              <div className="ai-recommendations-list">
                {message.recommendations.map((rec, idx) => (
                  <div key={idx} className="ai-rec-card">
                    {rec.poster && (
                      <div className="ai-rec-poster">
                        <img src={rec.poster} alt={rec.title} />
                      </div>
                    )}
                    <div className="ai-rec-details">
                      <h4 className="ai-rec-title">{rec.title}</h4>
                      <p className="ai-rec-genre">{rec.genre} &middot; ⭐ {rec.rating}</p>
                      <p className="ai-rec-venue">{rec.theatre} &middot; {rec.showtime}</p>
                      <p className="ai-rec-prices"><Ticket size={12} /> {rec.prices}</p>
                      
                      {rec.offer && (
                        <div className="ai-rec-offer">
                          <Tag size={12} /> {rec.offer}
                        </div>
                      )}
                      
                      <Link to={`/movies/${rec.movieId}`} className="ai-book-btn">
                        View Show
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {message.isGroup && (
              <div className="ai-group-prompt">
                <p>Planning with friends?</p>
                <Link to="/squads/create" className="ai-squad-btn">
                  <Users size={16} /> Create CineSquad
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
