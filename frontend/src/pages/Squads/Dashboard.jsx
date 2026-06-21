import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Clock, Send, Sparkles, User, Users, Clapperboard, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { api } from '../../api.js';

const SLOTS = ['Fri-Morning', 'Fri-Afternoon', 'Fri-Evening', 'Sat-Morning', 'Sat-Afternoon', 'Sat-Evening', 'Sun-Morning', 'Sun-Afternoon', 'Sun-Evening'];

export default function SquadDashboard({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [squad, setSquad] = useState(null);
  const [members, setMembers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const [myAvailability, setMyAvailability] = useState([]);
  const [myVote, setMyVote] = useState('');
  const [updating, setUpdating] = useState(false);

  const [recommendation, setRecommendation] = useState(null);
  const [generating, setGenerating] = useState(false);

  const initRef = useRef(false);

  useEffect(() => {
    async function load(isPolling = false) {
      try {
        const [{ squad, members }, allMovies] = await Promise.all([
          api(`/squads/${id}`),
          api('/movies')
        ]);
        setSquad(squad);
        setMembers(members);
        setMovies(allMovies);
        
        if (!initRef.current) {
          const me = members.find(m => m.email === user.email);
          if (me) {
            setMyAvailability(me.availability || []);
            setMyVote(me.movieVote?._id || '');
          }
          initRef.current = true;
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (!isPolling) setLoading(false);
      }
    }
    load();
    const interval = setInterval(() => load(true), 5000); // Polling every 5 seconds
    return () => clearInterval(interval);
  }, [id, user]);

  const isHost = squad?.hostId?._id === user?.id;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      setInviting(true);
      await api(`/squads/${id}/invite`, { method: 'POST', body: JSON.stringify({ emails: [inviteEmail] }) });
      setInviteEmail('');
      const { members: newMembers } = await api(`/squads/${id}`);
      setMembers(newMembers);
    } catch (err) {
      console.error(err);
      alert('Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateAvailability = async () => {
    try {
      setUpdating(true);
      await api(`/squads/${id}/availability`, { 
        method: 'PUT', 
        body: JSON.stringify({ 
          availability: myAvailability, 
          movieVote: myVote || null 
        }) 
      });
      const { members: newMembers } = await api(`/squads/${id}`);
      setMembers(newMembers);
    } catch (err) {
      console.error(err);
      alert('Failed to save');
    } finally {
      setUpdating(false);
    }
  };

  const generateRecommendation = async () => {
    try {
      setGenerating(true);
      const res = await api(`/squads/${id}/recommendations`);
      setRecommendation(res);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to generate recommendation');
    } finally {
      setGenerating(false);
    }
  };

  const aggregatedVotes = useMemo(() => {
    const counts = {};
    members.forEach(m => {
      if (m.movieVote && m.movieVote._id) {
        counts[m.movieVote.title] = (counts[m.movieVote.title] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]);
  }, [members]);

  const aggregatedAvailability = useMemo(() => {
    const counts = {};
    SLOTS.forEach(s => counts[s] = 0);
    members.forEach(m => {
      if (m.availability) {
        m.availability.forEach(slot => {
          if (counts[slot] !== undefined) counts[slot]++;
        });
      }
    });
    return counts;
  }, [members]);

  const acceptedMembers = members.filter(m => m.status === 'accepted');
  const totalAccepted = acceptedMembers.length;
  const availCount = acceptedMembers.filter(m => m.availability?.length > 0).length;
  const voteCount = acceptedMembers.filter(m => m.movieVote).length;
  
  const availPct = totalAccepted > 0 ? (availCount / totalAccepted) * 100 : 0;
  const votePct = totalAccepted > 0 ? (voteCount / totalAccepted) * 100 : 0;
  
  const meetsThreshold = totalAccepted >= 2 && availPct >= 60 && votePct >= 60;
  const missingNames = acceptedMembers
    .filter(m => !(m.availability?.length > 0) || !m.movieVote)
    .map(m => m.userId?.name?.split(' ')[0] || m.email.split('@')[0]);
    
  let missingStr = '';
  if (missingNames.length > 0) {
    if (missingNames.length === 1) missingStr = `Waiting for ${missingNames[0]}`;
    else if (missingNames.length === 2) missingStr = `Waiting for ${missingNames[0]} and ${missingNames[1]}`;
    else missingStr = `Waiting for ${missingNames[0]}, ${missingNames[1]} and ${missingNames.length - 2} others`;
  }

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;
  if (!squad) return <div style={{ padding: '100px', textAlign: 'center' }}>Squad not found.</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link to="/squads/dashboard" style={{ color: 'var(--gold)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '12px', display: 'inline-block' }}>&larr; Back to My Squads</Link>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{squad.name}</h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>
          <User size={16} style={{ verticalAlign: '-3px', marginRight: '4px' }} /> Host: {squad.hostId.name} &bull; City: {squad.city}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        
        {/* LEFT COLUMN: Members & Invites */}
        <div style={{ display: 'grid', gap: '32px', alignContent: 'start' }}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} /> Squad Members ({members.length})
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {members.map(m => (
                <div key={m.email} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: m.status === 'accepted' ? 'var(--gradient-blue)' : 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {m.userId?.name ? m.userId.name[0].toUpperCase() : m.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{m.userId?.name || m.email}</div>
                        <div style={{ fontSize: '0.8rem', color: m.status === 'accepted' ? 'var(--green)' : 'var(--muted)' }}>{m.status}</div>
                      </div>
                    </div>
                  </div>
                  {/* Detailed Status */}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', marginLeft: '44px' }}>
                    <div style={{ color: m.availability?.length > 0 ? 'var(--green)' : 'var(--muted)' }}>
                      {m.availability?.length > 0 ? 'Availability Submitted' : 'Availability Not Submitted'}
                    </div>
                    <div style={{ color: m.movieVote ? 'var(--gold)' : 'var(--muted)' }}>
                      {m.movieVote ? 'Voted' : 'Not Voted'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isHost && (
              <form onSubmit={handleInvite} style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <input 
                  type="email" 
                  placeholder="friend@example.com" 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
                <button type="submit" className="button primary" disabled={inviting}>
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clapperboard size={20} /> Movie Votes
            </h3>
            {aggregatedVotes.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No votes cast yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {aggregatedVotes.map(([title, count]) => (
                  <div key={title} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                    <span>{title}</span>
                    <strong style={{ color: 'var(--gold)' }}>{count} vote{count !== 1 ? 's' : ''}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Availability & Recommendation */}
        <div style={{ display: 'grid', gap: '32px', alignContent: 'start' }}>
          
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={20} /> Your Availability & Vote
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
              {SLOTS.map(slot => {
                const selected = myAvailability.includes(slot);
                const count = aggregatedAvailability[slot];
                return (
                  <button 
                    key={slot}
                    onClick={() => {
                      if (myAvailability.includes(slot)) setMyAvailability(myAvailability.filter(s => s !== slot));
                      else setMyAvailability([...myAvailability, slot]);
                    }}
                    style={{ 
                      padding: '12px 8px', 
                      borderRadius: '8px', 
                      border: selected ? '1px solid var(--green)' : '1px solid rgba(255,255,255,0.1)',
                      background: selected ? 'rgba(98, 240, 183, 0.1)' : 'rgba(255,255,255,0.03)',
                      color: selected ? 'var(--green)' : 'var(--muted)',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{slot.replace('-', ' ')}</div>
                    {count > 0 && <div style={{ fontSize: '0.7rem', marginTop: '4px', color: 'var(--foreground)' }}>{count} available</div>}
                  </button>
                )
              })}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--muted)' }}>Vote for a Movie</label>
              <select 
                value={myVote} 
                onChange={e => setMyVote(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              >
                <option value="" style={{ color: 'black' }}>No preference</option>
                {movies.map(m => <option key={m._id} value={m._id} style={{ color: 'black' }}>{m.title}</option>)}
              </select>
            </div>

            <button onClick={handleUpdateAvailability} disabled={updating} className="button primary" style={{ width: '100%', padding: '14px' }}>
              {updating ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>

          {/* Recommendation Section */}
          {isHost && (
            <div className="glass-panel" style={{ padding: '32px', background: 'linear-gradient(180deg, rgba(255,215,0,0.05), transparent)' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)' }}>
                <Sparkles size={20} /> Smart Recommendation
              </h3>
              
              {!recommendation && (
                <>
                  <div style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--muted)' }}>Availability:</span>
                      <span style={{ color: availPct >= 60 ? 'var(--green)' : 'var(--red)' }}>{availCount} / {totalAccepted} submitted</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ color: 'var(--muted)' }}>Voting:</span>
                      <span style={{ color: votePct >= 60 ? 'var(--gold)' : 'var(--red)' }}>{voteCount} / {totalAccepted} voted</span>
                    </div>
                    {!meetsThreshold && missingStr && (
                      <div style={{ color: 'var(--red)', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '16px', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>
                        <AlertTriangle size={16} /> {missingStr}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="button primary" style={{ flex: 2 }} onClick={generateRecommendation} disabled={generating || (!meetsThreshold && totalAccepted < 2)}>
                      {generating ? 'Calculating...' : 'Generate Plan'}
                    </button>
                    {!meetsThreshold && totalAccepted >= 2 && (
                      <button className="button ghost" style={{ flex: 1, padding: '10px', fontSize: '0.8rem', color: 'var(--muted)' }} onClick={generateRecommendation}>
                        Override
                      </button>
                    )}
                  </div>
                </>
              )}

              {recommendation && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid var(--line)', marginBottom: '20px' }}>
                    <h4 style={{ color: 'var(--green)', marginBottom: '12px' }}>Top Pick: {recommendation.topSlot.replace('-', ' ')}</h4>
                    {recommendation.shows.length > 0 ? (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {recommendation.shows.map((show, idx) => (
                          <div key={show._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{show.movie.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{show.theater.name} &bull; {new Date(show.showTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                            <Link to={`/movies/${show.movie._id}?showId=${show._id}`} className="button primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                              Proceed
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--red)', fontSize: '0.9rem' }}>No shows found for the winning movie/slot. Try again later.</p>
                    )}
                  </div>
                  <button className="button ghost" style={{ width: '100%' }} onClick={() => setRecommendation(null)}>
                    Discard Plan
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
