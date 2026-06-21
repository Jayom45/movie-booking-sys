import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, User, CalendarDays, Ticket, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Profile({ session, setSession }) {
  const { user } = session;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [city, setCity] = useState(user.city || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBookings() {
      try {
        const data = await api('/bookings/mine');
        setBookings(data);
      } catch (err) {
        console.error('Failed to load bookings', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  const totalBookings = bookings.length;
  const totalTickets = bookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0);
  const totalSpent = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  
  const today = new Date();
  const activeBookings = bookings.filter(b => b.status !== 'cancelled' && new Date(b.show?.showTime) > today).length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ name, city })
      });
      // res contains { user, token }
      setSession(res);
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  const memberSince = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short' })
    : '2024';

  const avatarLetters = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="spin text-gradient-blue" />
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '96px', paddingTop: '120px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
        
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--cyan)' }}>Account</p>
        <h1 style={{ marginTop: '12px', fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: '900', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Welcome back, <span className="text-gradient-gold">{user.name.split(' ')[0]}.</span>
        </h1>

        <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* User Card */}
          <div className="glass-strong" style={{ borderRadius: '24px', padding: '28px' }}>
            {editing ? (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Edit Profile</h3>
                {error && <div style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</div>}
                
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Full Name
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    required
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '8px', color: 'white', outline: 'none' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                  City
                  <input 
                    type="text" 
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                    placeholder="E.g. Mumbai, New York..."
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '8px', color: 'white', outline: 'none' }}
                  />
                </label>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={() => { setEditing(false); setName(user.name); setCity(user.city || ''); }} style={{ padding: '10px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', flex: 1, fontSize: '0.9rem' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="glow-blue" style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--gradient-blue)', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1, fontSize: '0.9rem' }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="glow-blue" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gradient-blue)', display: 'grid', placeItems: 'center', fontSize: '1.25rem', fontWeight: '900', color: 'white' }}>
                      {avatarLetters}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>{user.name}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '4px 0 0 0' }}>CineBook Member · Since {memberSince}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditing(true)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', padding: '6px 16px', fontSize: '0.75rem', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Edit
                  </button>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><Mail size={16} /> {user.email}</p>
                  {user.city && <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><MapPin size={16} /> {user.city}</p>}
                </div>

                <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div className="glass" style={{ borderRadius: '16px', padding: '16px 12px' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }} className="text-gradient-gold">{totalBookings}</p>
                    <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginTop: '8px', marginBottom: 0 }}>Bookings</p>
                  </div>
                  <div className="glass" style={{ borderRadius: '16px', padding: '16px 12px' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }} className="text-gradient-blue">{totalTickets}</p>
                    <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginTop: '8px', marginBottom: 0 }}>Tickets</p>
                  </div>
                  <div className="glass" style={{ borderRadius: '16px', padding: '16px 12px' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>Rs {totalSpent}</p>
                    <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginTop: '8px', marginBottom: 0 }}>Spent</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Stats Breakdown */}
          <div className="glass-strong" style={{ borderRadius: '24px', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 20px 0' }}>Activity Overview</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="glass" style={{ borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(98, 240, 183, 0.1)', color: '#62f0b7', display: 'grid', placeItems: 'center' }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '600', margin: 0, fontSize: '0.95rem' }}>Active Bookings</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '4px 0 0 0' }}>Upcoming movies</p>
                  </div>
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{activeBookings}</span>
              </div>

              <div className="glass" style={{ borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255, 61, 85, 0.1)', color: '#ff3d55', display: 'grid', placeItems: 'center' }}>
                    <XCircle size={18} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '600', margin: 0, fontSize: '0.95rem' }}>Cancelled Bookings</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '4px 0 0 0' }}>Refunded tickets</p>
                  </div>
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{cancelledBookings}</span>
              </div>
            </div>
          </div>
        </div>

        {/* History Preview */}
        <section style={{ marginTop: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--gold)' }}>Recent Activity</p>
              <h2 style={{ marginTop: '12px', fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: '900', letterSpacing: '-0.02em', margin: 0 }}>Latest Bookings.</h2>
            </div>
            <Link to="/bookings" style={{ fontSize: '0.85rem', color: 'var(--muted)', textDecoration: 'none' }}>View all →</Link>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentBookings.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No recent bookings found.</p>
            ) : (
              recentBookings.map((b) => (
                <div key={b._id} className="glass" style={{ borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center' }}>
                      <Ticket size={20} className="text-gradient-gold" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 'bold', margin: 0 }}>{b.show?.movie?.title || 'Unknown Movie'}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '4px 0 0 0' }}>
                        {new Date(b.show?.showTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {b.show?.theater} · {b.seats.length} Tickets
                      </p>
                    </div>
                  </div>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Rs {b.totalAmount}</span>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
