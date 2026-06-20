import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronRight, Clock, MapPin, Play, Search, Star, Ticket, TrendingUp, Clapperboard } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const filters = ['All', 'Thriller', 'Action Comedy', 'Sci-Fi', 'English', 'Hindi'];

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
          <div className="poster-tags">
            <span className="poster-tag">{movie.genre}</span>
            <span className="poster-dot">·</span>
            <span className="poster-lang">{movie.language}</span>
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
        <ChevronRight size={20} className="rail-chevron" />
      </div>
      <div className="poster-row">
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

  const filteredMovies = useMemo(() => {
    if (activeFilter === 'All') return movies;
    return movies.filter((m) => m.genre === activeFilter || m.language === activeFilter);
  }, [activeFilter, movies]);

  const featured = filteredMovies[0] || movies[0];
  const trending = [...filteredMovies].sort((a, b) => b.rating - a.rating);
  const comingSoon = [...filteredMovies].reverse();
  const spotlightShows = shows.slice(0, 6);

  return (
    <section className="home-page">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        className="home-hero"
        style={{ '--hero-image': `url(${featured?.posterUrl || ''})` }}
      >
        {/* Layered backdrop */}
        <div className="hero-bg" aria-hidden="true" />

        {/* Content side */}
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-eyebrow">
            <Clapperboard size={14} />
            Featured
          </div>

          <h1 className="hero-title">
            {featured?.title || 'Your premium cinema night starts here.'}
          </h1>

          <p className="hero-desc">
            {featured?.description
              ? featured.description.slice(0, 160) + (featured.description.length > 160 ? '…' : '')
              : 'Explore cinematic releases, premium screens, and instant seat booking.'}
          </p>

          {featured && (
            <div className="hero-meta">
              <span className="hero-meta-chip">
                <Star size={13} fill="currentColor" style={{ color: 'var(--gold)' }} />
                {featured.rating.toFixed(1)} / 10
              </span>
              <span className="hero-meta-chip">{featured.genre}</span>
              <span className="hero-meta-chip">
                <Clock size={13} />
                {featured.durationMinutes} min
              </span>
            </div>
          )}

          <div className="hero-actions">
            {featured && (
              <Link className="hero-btn-primary" to={`/movies/${featured._id}`}>
                <Ticket size={18} />
                Book Tickets
              </Link>
            )}
            <Link className="hero-btn-secondary" to="/cinemas">
              <Play size={16} />
              All Cinemas
            </Link>
          </div>
        </motion.div>

        {/* Poster side */}
        {featured && (
          <motion.div
            className="hero-poster-wrap"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <img className="hero-poster" src={featured.posterUrl} alt={featured.title} />
            <div className="hero-poster-glow" aria-hidden="true" />
          </motion.div>
        )}
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
        {filters.map((filter) => (
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
            movies={filteredMovies}
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
