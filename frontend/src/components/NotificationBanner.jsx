import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { api } from '../api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function NotificationBanner() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api('/notifications')
      .then(data => setNotifications(data.filter(n => !n.read)))
      .catch(console.error);
  }, []);

  const dismiss = async (id) => {
    try {
      await api(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div 
            key={n._id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ padding: '16px 20px', background: 'linear-gradient(90deg, rgba(59,130,246,0.15), rgba(98,240,183,0.1))', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div style={{ display: 'flex', gap: '16px' }}>
              <Bell size={20} style={{ color: 'var(--blue)', marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--foreground)' }}>{n.title}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: '1.4' }}>{n.message}</p>
                {n.link && (
                  <Link to={n.link} style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.8rem', color: 'var(--blue)', fontWeight: 'bold', textDecoration: 'none' }}>
                    View Details &rarr;
                  </Link>
                )}
              </div>
            </div>
            <button onClick={() => dismiss(n._id)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
