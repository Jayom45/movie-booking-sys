import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clapperboard, Clock, ArrowRight, Bell, Check, X } from 'lucide-react';
import { api } from '../../api.js';

export default function SquadList() {
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await api('/squads');
        setSquads(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRespond = async (squadId, status) => {
    try {
      await api(`/squads/${squadId}/respond`, { method: 'POST', body: JSON.stringify({ status }) });
      setSquads(squads.map(s => s._id === squadId ? { ...s, myStatus: status } : s));
    } catch (err) {
      alert(err.message);
    }
  };

  const pendingInvites = squads.filter(s => s.myStatus === 'pending');
  const activeSquads = squads.filter(s => s.myStatus === 'accepted');

  return (
    <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>My Squads</h1>
          <p style={{ color: 'var(--muted)' }}>Manage your movie night plans and invitations.</p>
        </div>
        <Link to="/squads/create" className="button primary">
          Create Squad
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      ) : error ? (
        <div className="alert">{error}</div>
      ) : (
        <>
          {pendingInvites.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} /> Pending Invitations ({pendingInvites.length})
              </h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                {pendingInvites.map(squad => (
                  <motion.div key={squad._id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{squad.name}</h3>
                      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                        {squad.hostId.name} invited you to join &bull; {squad.city}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="button primary" style={{ padding: '8px 16px' }} onClick={() => handleRespond(squad._id, 'accepted')}>
                        <Check size={16} /> Accept
                      </button>
                      <button className="button ghost" style={{ padding: '8px 16px', color: 'var(--red)' }} onClick={() => handleRespond(squad._id, 'declined')}>
                        <X size={16} /> Decline
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clapperboard size={18} /> Active Squads ({activeSquads.length})
            </h2>
            
            {activeSquads.length === 0 ? (
              <div className="empty-state glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                <Clapperboard size={32} style={{ color: 'var(--muted)', margin: '0 auto 16px' }} />
                <h3>No active squads</h3>
                <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>You aren't part of any squads right now.</p>
                <Link to="/squads/create" className="button ghost">Start one</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {activeSquads.map(squad => (
                  <Link key={squad._id} to={`/squads/${squad._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <motion.div className="glass-panel" style={{ padding: '24px', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }} whileHover={{ y: -4 }}>
                      <div style={{ marginBottom: 'auto' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', color: 'var(--foreground)' }}>{squad.name}</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '16px' }}>Host: {squad.hostId.name} &bull; {squad.city}</p>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                          <span>{squad.acceptedCount} / {squad.memberCount} joined</span>
                          {squad.pendingCount > 0 && <span style={{ color: 'var(--gold)' }}>{squad.pendingCount} pending</span>}
                        </div>
                        <ArrowRight size={16} style={{ color: 'var(--blue)' }} />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
