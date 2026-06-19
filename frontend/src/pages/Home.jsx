import { motion } from 'framer-motion';
import { CalendarDays, ChevronRight, MapPin, Play, Search, Star, Ticket } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const filters = ['All', 'Thriller', 'Action Comedy', 'Sci-Fi', 'English', 'Hindi'];

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MoviePoster({ movie, index }) {
  return (
    <motion.article className="poster-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link to={`/movies/${movie._id}`}>
        <div className="poster-frame">
          <img src={movie.posterUrl} alt={movie.title} />
          <div className="poster-overlay">
            <span><Star size={14} /> {movie.rating.toFixed(1)}</span>
            <button className="quick-book"><Ticket size={15} /> Book</button>
          </div>
        </div>
        <h3>{movie.title}</h3>
        <p>{movie.genre} | {movie.language}</p>
      </Link>
    </motion.article>
  );
}

function MovieRail({ title, kicker, movies }) {
  if (movies.length === 0) return null;
  return (
    <section className="cinema-rail">
      <div className="rail-heading">
        <div>
          <p className="eyebrow">{kicker}</p>
          <h2>{title}</h2>
        </div>
        <ChevronRight size={24} />
      </div>
      <div className="poster-row">
        {movies.map((movie, index) => <MoviePoster movie={movie} index={index} key={`${title}-${movie._id}`} />)}
      </div>
    </section>
  );
}

function SkeletonRail() {
  return (
    <div className="poster-row">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="poster-card skeleton-card" key={index}>
          <div className="poster-frame skeleton" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line short" />
        </div>
      ))}
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
    return movies.filter((movie) => movie.genre === activeFilter || movie.language === activeFilter);
  }, [activeFilter, movies]);

  const featured = filteredMovies[0] || movies[0];
  const trending = [...filteredMovies].sort((a, b) => b.rating - a.rating);
  const comingSoon = [...filteredMovies].reverse();
  const spotlightShows = shows.slice(0, 5);

  return (
    <section className="home-page">
      <section className="spotlight" style={{ '--hero-image': `url(${featured?.posterUrl || ''})` }}>
        <motion.div className="spotlight-content" initial={{ opacity: 0, x: -32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <p className="eyebrow">CineBook Spotlight</p>
          <h1>{featured?.title || 'Your premium movie night starts here.'}</h1>
          <p>{featured?.description || 'Explore cinematic releases, premium screens, and instant seat booking.'}</p>
          <div className="spotlight-meta">
            {featured && <span><Star size={16} /> {featured.rating.toFixed(1)} / 10</span>}
            {featured && <span>{featured.genre}</span>}
            {featured && <span>{featured.durationMinutes} mins</span>}
          </div>
          <div className="hero-actions">
            {featured && <Link className="button primary" to={`/movies/${featured._id}`}><Ticket size={17} /> Book Now</Link>}
            <Link className="button glass" to="/cinemas"><Play size={17} /> Explore Cinemas</Link>
          </div>
        </motion.div>
        {featured && (
          <motion.img className="spotlight-poster" src={featured.posterUrl} alt={featured.title} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65 }} />
        )}
      </section>

      <section className="discovery-bar">
        <div className="search-box">
          <Search size={19} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search movies, genres, languages" />
        </div>
        <div className="chip-row">
          <button className={!activeCity ? 'chip active' : 'chip'} onClick={() => setActiveCity('')}>All cities</button>
          {cities.map((city) => (
            <button className={activeCity === city ? 'chip active' : 'chip'} key={city} onClick={() => setActiveCity(city)}>
              <MapPin size={14} /> {city}
            </button>
          ))}
        </div>
      </section>

      <div className="chip-row genre-row">
        {filters.map((filter) => (
          <button className={activeFilter === filter ? 'chip active' : 'chip'} key={filter} onClick={() => setActiveFilter(filter)}>
            {filter}
          </button>
        ))}
      </div>

      {error && <div className="alert">{error}</div>}
      {loading ? (
        <SkeletonRail />
      ) : filteredMovies.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={34} />
          <h2>No movies found</h2>
          <p>Try another city, genre, or search term.</p>
        </div>
      ) : (
        <>
          <MovieRail title="Now Showing" kicker="In theaters" movies={filteredMovies} />
          <MovieRail title="Trending This Week" kicker="Audience favorites" movies={trending} />
          <MovieRail title="Coming Soon" kicker="Watchlist picks" movies={comingSoon} />
        </>
      )}

      <section className="cinema-rail">
        <div className="rail-heading">
          <div>
            <p className="eyebrow">Quick booking</p>
            <h2>Premium showtimes near you</h2>
          </div>
          <Link className="text-link" to="/cinemas">All cinemas</Link>
        </div>
        <div className="showtime-row">
          {spotlightShows.map((show) => (
            <Link className="showtime-card" key={show._id} to={`/movies/${show.movie._id}`}>
              <strong>{show.movie.title}</strong>
              <span>{show.theater}, {show.city}</span>
              <small>{formatTime(show.showTime)} | Rs {show.price}</small>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
