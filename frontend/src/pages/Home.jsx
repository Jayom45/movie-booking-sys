import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronRight, ChevronLeft, Clock, MapPin, Play, Search, Star, Ticket, TrendingUp, Clapperboard } from 'lucide-react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { ALLOWED_GENRES, getValidGenres } from '../utils.js';

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function RatingBadge({ rating }) {
  return (
    <span className="rating-badge">
      <Star size={11} fill="currentColor" />
      {rating.toFixed(1)}
    </span>
  );
}

function MoviePoster({ movie, index }) {
  return (
    <motion.article
      className="poster-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Link to={`/movies/${movie._id}`}>
        <div className="poster-frame">
          <img src={movie.posterUrl} alt={movie.title} loading="lazy" />
          <RatingBadge rating={movie.rating} />
          <div className="poster-overlay">
            <button className="quick-book">
              <Ticket size={13} />
              Book Now
            </button>
          </div>
        </div>
        <div className="poster-info">
          <h3>{movie.title}</h3>
          <div className="poster-meta">
            <div className="poster-genres">
              {getValidGenres(movie.genre).slice(0, 3).map((g) => (
                <span key={g} className="poster-tag">{g}</span>
              ))}
            </div>
            <div className="poster-lang">{movie.language}</div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function SectionTag({ children, color }) {
  return <span className={`section-tag section-tag--${color}`}>{children}</span>;
}

function MovieRail({ title, kicker, movies, accent, icon: Icon }) {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const amount = direction === 'left' ? -600 : 600;
      rowRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (movies.length === 0) return null;
  return (
    <motion.section
      className="movie-rail"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45 }}
    >
      <div className="rail-heading">
        <div className="rail-heading-left">
          {Icon && <Icon size={18} className={`rail-icon rail-icon--${accent}`} />}
          <div>
            <p className="eyebrow">{kicker}</p>
            <h2 className="rail-title">{title}</h2>
          </div>
        </div>
        <div className="rail-nav">
          <button className="rail-nav-btn" onClick={() => scroll('left')} aria-label="Scroll left">
            <ChevronLeft size={20} />
          </button>
          <button className="rail-nav-btn" onClick={() => scroll('right')} aria-label="Scroll right">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="poster-row" ref={rowRef}>
        {movies.map((movie, index) => (
          <MoviePoster movie={movie} index={index} key={`${title}-${movie._id}`} />
        ))}
      </div>
    </motion.section>
  );
}

function SkeletonRail() {
  return (
    <div className="movie-rail">
      <div className="rail-heading">
        <div className="skeleton" style={{ width: 160, height: 28, borderRadius: 8 }} />
      </div>
      <div className="poster-row">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="poster-card skeleton-card" key={i}>
            <div className="poster-frame skeleton" />
            <span className="skeleton skeleton-line" />
            <span className="skeleton skeleton-line short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeCity, setActiveCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        const movieQuery = search ? `?search=${encodeURIComponent(search)}` : '';
        const showQuery = activeCity ? `?city=${encodeURIComponent(activeCity)}` : '';
        const [movieData, showData, cityData] = await Promise.all([
          api(`/movies${movieQuery}`),
          api(`/shows${showQuery}`),
          api('/shows/meta/cities')
        ]);
        setMovies(movieData);
        setShows(showData);
        setCities(cityData);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [search, activeCity]);

  // 5. Home Page Filters - Hardcoded to strictly allowed genres
  const genres = ['All', ...ALLOWED_GENRES];

  const filteredMovies = useMemo(() => {
    if (activeFilter === 'All') return movies;
    return movies.filter((m) => getValidGenres(m.genre).includes(activeFilter));
  }, [activeFilter, movies]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const releasedMovies = filteredMovies.filter(m => new Date(m.releaseDate) <= today);
  const upcomingMovies = filteredMovies.filter(m => new Date(m.releaseDate) > today);

  const featured = [...releasedMovies].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || releasedMovies[0];

  const nowShowing = releasedMovies;

  // Fix 2: Trending logic (top 5 by rating descending, released only)
  const trending = useMemo(() => {
    return [...releasedMovies]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
  }, [releasedMovies]);

  // Fix 3: Coming Soon logic (future release dates only, sort asc)
  const comingSoon = useMemo(() => {
    return [...upcomingMovies]
      .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
  }, [upcomingMovies]);

  const spotlightShows = shows.slice(0, 6);

  return (
    <section className="home-page">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        className="home-hero"
        style={{ position: 'relative', overflow: 'hidden', paddingTop: '140px', paddingBottom: '80px', borderBottom: '1px solid var(--color-border)' }}
      >
        {/* ambient orbs from Lovable */}
        <div className="pointer-events-none animate-orb" style={{ position: 'absolute', top: '-128px', left: '-128px', height: '480px', width: '480px', borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.6 0.22 254 / 0.35), transparent 70%)' }} />
        <div className="pointer-events-none animate-orb" style={{ position: 'absolute', top: '80px', right: '0', height: '520px', width: '520px', borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.78 0.13 232 / 0.3), transparent 70%)' }} />
        <div className="pointer-events-none" style={{ position: 'absolute', bottom: '0', left: '33%', height: '400px', width: '400px', borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.86 0.17 92 / 0.18), transparent 70%)' }} />

        <div style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '56px', alignItems: 'center', maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Content side */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '999px', fontSize: '0.75rem', color: 'var(--muted)' }}>
              <Clapperboard size={14} style={{ color: 'var(--gold)' }} />
              Featured Release
            </div>

            <h1 style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: '900', lineHeight: 1.05, letterSpacing: '-0.03em', marginTop: '24px', marginBottom: '24px' }}>
              <span className="text-gradient-blue">Experience</span><br/>
              {featured?.title || 'Your premium cinema night starts here.'}
            </h1>

            <p style={{ fontSize: '1.125rem', color: 'var(--muted)', maxWidth: '36rem', lineHeight: 1.6 }}>
              {featured?.description
                ? featured.description.slice(0, 160) + (featured.description.length > 160 ? '…' : '')
                : 'Explore cinematic releases, premium screens, and instant seat booking.'}
            </p>

            {featured && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '32px', flexWrap: 'wrap' }}>
                <span className="glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Star size={14} fill="currentColor" className="text-gradient-gold" />
                  <span className="text-gradient-gold">{featured.rating.toFixed(1)} / 10</span>
                </span>
                <span className="glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {Array.isArray(featured.genre) ? featured.genre.join(', ') : featured.genre}
                </span>
                <span className="glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <Clock size={14} />
                  {featured.durationMinutes} min
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '40px' }}>
              {featured && (
                <Link to={`/movies/${featured._id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--gradient-blue)', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '0.95rem' }} className="glow-blue hover:brightness-110 transition">
                  <Ticket size={18} />
                  Book Tickets
                </Link>
              )}
              <Link to="/cinemas" className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '0.95rem' }}>
                <Play size={16} />
                All Cinemas
              </Link>
            </div>
          </motion.div>

          {/* Poster side */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'relative', width: '100%', maxWidth: '380px', margin: '0 auto' }}
            >
              <div className="glass-strong" style={{ borderRadius: '24px', padding: '8px', boxShadow: 'var(--shadow-card)' }}>
                <img 
                  src={featured.posterUrl} 
                  alt={featured.title} 
                  style={{ width: '100%', height: 'auto', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '16px', display: 'block' }}
                />
              </div>
              <div className="glow-blue" style={{ position: 'absolute', inset: 0, zIndex: -1, borderRadius: '24px', opacity: 0.5 }} aria-hidden="true" />
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Discovery bar ─────────────────────────────────── */}
      <div className="discovery-bar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movies, genres, languages…"
          />
        </div>
        <div className="chip-row">
          <button className={!activeCity ? 'chip active' : 'chip'} onClick={() => setActiveCity('')}>
            All Cities
          </button>
          {cities.map((city) => (
            <button
              className={activeCity === city ? 'chip active' : 'chip'}
              key={city}
              onClick={() => setActiveCity(city)}
            >
              <MapPin size={13} />
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* ── Genre filter ───────────────────────────────────── */}
      <div className="chip-row genre-row">
        {genres.map((filter) => (
          <button
            className={activeFilter === filter ? 'chip active' : 'chip'}
            key={filter}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {error && <div className="alert">{error}</div>}

      {/* ── Movie rails ───────────────────────────────────── */}
      {loading ? (
        <>
          <SkeletonRail />
          <SkeletonRail />
        </>
      ) : filteredMovies.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={34} />
          <h2>No movies found</h2>
          <p>Try another city, genre, or search term.</p>
        </div>
      ) : (
        <>
          <MovieRail
            title="Now Showing"
            kicker="In theatres now"
            movies={nowShowing}
            accent="gold"
            icon={Clapperboard}
          />
          <MovieRail
            title="Trending This Week"
            kicker="Audience favourites"
            movies={trending}
            accent="red"
            icon={TrendingUp}
          />
          <MovieRail
            title="Coming Soon"
            kicker="Mark your calendar"
            movies={comingSoon}
            accent="cyan"
            icon={CalendarDays}
          />
        </>
      )}

      {/* ── Showtimes section ──────────────────────────────── */}
      {spotlightShows.length > 0 && (
        <motion.section
          className="showtimes-section"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
        >
          <div className="rail-heading">
            <div className="rail-heading-left">
              <Clock size={18} className="rail-icon rail-icon--cyan" />
              <div>
                <p className="eyebrow">Quick booking</p>
                <h2 className="rail-title">Showtimes Near You</h2>
              </div>
            </div>
            <Link className="text-link" to="/cinemas">View all</Link>
          </div>

          <div className="showtime-grid">
            {spotlightShows.map((show) => (
              <Link className="showtime-tile" key={show._id} to={`/movies/${show.movie._id}`}>
                <div className="showtime-tile-poster">
                  <img src={show.movie.posterUrl} alt={show.movie.title} />
                </div>
                <div className="showtime-tile-body">
                  <strong className="showtime-tile-title">{show.movie.title}</strong>
                  <span className="showtime-tile-theater">{show.theater}</span>
                  <span className="showtime-tile-city">{show.city}</span>
                  <div className="showtime-tile-row">
                    <span className="showtime-tile-time">{formatTime(show.showTime)}</span>
                    <span className="showtime-tile-price">Rs {show.price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>
      )}
    </section>
  );
}
