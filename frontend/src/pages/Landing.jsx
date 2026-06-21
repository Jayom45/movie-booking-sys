import { motion } from 'framer-motion';
import { Play, Ticket, Sparkles, Smartphone, Download, MapPin, Zap, Shield, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Landing() {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api('/movies').then(data => {
      // Sort by rating or just take first 6
      const sorted = data.sort((a, b) => b.rating - a.rating).slice(0, 6);
      setTrendingMovies(sorted);
    }).catch(err => console.error(err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/movies');
    }
  };

  return (
    <div className="landing-page">
      {/* ── Section 1: Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-bg"></div>
        <div className="landing-hero-content">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="landing-hero-title"
          >
            The premium way to book <br />
            <span className="text-gradient-gold">movie tickets.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="landing-hero-subtitle"
          >
            Discover the latest blockbusters, select your favorite seats, and experience cinema like never before.
          </motion.p>
          
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="landing-search-bar"
            onSubmit={handleSearch}
          >
            <Search size={20} className="landing-search-icon" />
            <input 
              type="text" 
              placeholder="Search for movies, cinemas, or genres..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="button primary">Search</button>
          </motion.form>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="landing-hero-ctas"
          >
            <Link to="/movies" className="button primary" style={{ padding: '14px 28px', fontSize: '1.1rem' }}>
              <Play size={18} /> Browse Movies
            </Link>
            <Link to="/cinemas" className="button glass" style={{ padding: '14px 28px', fontSize: '1.1rem' }}>
              <MapPin size={18} /> View Cinemas
            </Link>
          </motion.div>
        </div>

        {/* Floating Posters */}
        <div className="landing-hero-visuals">
          {trendingMovies.slice(0, 3).map((movie, i) => (
            <motion.div 
              key={movie._id}
              initial={{ opacity: 0, y: 40, rotate: i === 0 ? -10 : i === 2 ? 10 : 0 }}
              animate={{ opacity: 1, y: i === 1 ? -20 : 0, rotate: i === 0 ? -6 : i === 2 ? 6 : 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: "easeOut" }}
              className={`landing-floating-poster pos-${i}`}
            >
              <div className="poster-glow" />
              <img src={movie.posterUrl} alt={movie.title} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Section 2: Trending ── */}
      <section className="landing-section">
        <div className="section-header">
          <h2 className="section-title">Trending Now</h2>
          <p className="section-subtitle">The most anticipated movies playing right now.</p>
        </div>
        <div className="landing-movie-grid">
          {trendingMovies.map((movie, i) => (
            <motion.div 
              key={movie._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="landing-movie-card"
            >
              <Link to={`/movies/${movie._id}`}>
                <div className="landing-movie-poster">
                  <img src={movie.posterUrl} alt={movie.title} />
                  <div className="landing-movie-overlay">
                    <span className="button primary"><Ticket size={14} /> Book</span>
                  </div>
                </div>
                <div className="landing-movie-info">
                  <h3>{movie.title}</h3>
                  <p>{movie.genre} · {movie.language}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/movies" className="button glass">View All Movies</Link>
        </div>
      </section>

      {/* ── Section 3: Premium Experience ── */}
      <section className="landing-section premium-bg">
        <div className="section-header text-center">
          <h2 className="section-title">The Premium Experience</h2>
          <p className="section-subtitle">Upgrade your movie night with our world-class cinema formats.</p>
        </div>
        <div className="premium-feature-grid">
          {[
            { title: 'IMAX', desc: 'Immersive cinematic scale and breathtaking audio.', icon: Sparkles },
            { title: 'Recliner Seats', desc: 'Ultimate comfort for the best viewing experience.', icon: Ticket },
            { title: 'Digital Tickets', desc: 'Skip the box office line with instant QR tickets.', icon: Smartphone }
          ].map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="premium-feature-card glass-panel"
            >
              <div className="premium-feature-icon">
                <feat.icon size={24} />
              </div>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Why CineBook ── */}
      <section className="landing-section">
        <div className="section-header text-center">
          <h2 className="section-title">Why Choose CineBook</h2>
        </div>
        <div className="benefits-grid">
          {[
            { title: 'Instant Booking', icon: Zap },
            { title: 'QR Ticket Generation', icon: Smartphone },
            { title: 'Email Delivery', icon: Download },
            { title: 'Secure Payments', icon: Shield },
            { title: 'PDF Downloads', icon: Ticket },
            { title: 'Movie Offers', icon: Sparkles }
          ].map((benefit, i) => (
            <div key={i} className="benefit-item">
              <div className="benefit-icon"><benefit.icon size={20} /></div>
              <span>{benefit.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 5: App CTA ── */}
      <section className="landing-section">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="app-cta-card glass-panel"
        >
          <div className="app-cta-content">
            <h2>Your next movie night is one click away.</h2>
            <p>Join thousands of cinema lovers booking tickets seamlessly.</p>
            <Link to="/register" className="button primary" style={{ marginTop: '20px', padding: '14px 32px', fontSize: '1.1rem' }}>
              Create Free Account
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
