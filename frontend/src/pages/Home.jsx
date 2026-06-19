import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        setMovies(await api(`/movies${search ? `?search=${encodeURIComponent(search)}` : ''}`));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [search]);

  return (
    <section>
      <div className="hero">
        <div>
          <p className="eyebrow">Now showing</p>
          <h1>Book movie tickets in minutes.</h1>
          <p className="hero-copy">Pick a film, choose a show, reserve your seats, and get your confirmation instantly.</p>
        </div>
        <div className="search-box">
          <Search size={19} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, genre, language" />
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      {loading && <div className="muted">Loading movies...</div>}

      <div className="movie-grid">
        {movies.map((movie) => (
          <Link className="movie-card" key={movie._id} to={`/movies/${movie._id}`}>
            <img src={movie.posterUrl} alt={movie.title} />
            <div>
              <h2>{movie.title}</h2>
              <p>{movie.genre} · {movie.language}</p>
              <span>{movie.rating.toFixed(1)} / 10</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
