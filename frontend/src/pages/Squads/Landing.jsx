import { motion } from 'framer-motion';
import { Clapperboard, Calendar, Users, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SquadLanding({ user }) {
  return (
    <div className="squad-landing">
      <section className="squad-hero" style={{ textAlign: 'center', padding: '100px 20px 60px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glow-gold" style={{ width: '64px', height: '64px', margin: '0 auto 24px', borderRadius: '20px', background: 'var(--gradient-gold)', display: 'grid', placeItems: 'center' }}>
            <Clapperboard size={32} style={{ color: '#000' }} />
          </div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '20px', fontWeight: '900' }}>
            Plan movie nights without the <span className="text-gradient-red">WhatsApp chaos.</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--muted)', maxWidth: '600px', margin: '0 auto 40px' }}>
            Invite friends, vote on movies, find common availability, and let CineSquad suggest the perfect showtime.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            {user ? (
              <Link to="/squads/create" className="button primary" style={{ padding: '16px 32px', fontSize: '1.2rem' }}>
                Start a Squad <ArrowRight size={20} />
              </Link>
            ) : (
              <Link to="/login" className="button primary" style={{ padding: '16px 32px', fontSize: '1.2rem' }}>
                Login to Start <ArrowRight size={20} />
              </Link>
            )}
            {user && (
              <Link to="/squads/dashboard" className="button glass" style={{ padding: '16px 32px', fontSize: '1.2rem' }}>
                My Squads
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      <section style={{ maxWidth: '1000px', margin: '0 auto 100px', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <Users size={32} style={{ color: 'var(--gold)', margin: '0 auto 16px' }} />
          <h3>1. Invite Friends</h3>
          <p style={{ color: 'var(--muted)', marginTop: '8px' }}>Send invites via email. They don't even need an account to get started.</p>
        </div>
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <Star size={32} style={{ color: 'var(--red)', margin: '0 auto 16px' }} />
          <h3>2. Vote on Movies</h3>
          <p style={{ color: 'var(--muted)', marginTop: '8px' }}>Everyone picks what they want to watch from current blockbusters.</p>
        </div>
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <Calendar size={32} style={{ color: '#38bdf8', margin: '0 auto 16px' }} />
          <h3>3. Find the Time</h3>
          <p style={{ color: 'var(--muted)', marginTop: '8px' }}>Select free slots and let our matching engine find the perfect showtime.</p>
        </div>
      </section>
    </div>
  );
}
