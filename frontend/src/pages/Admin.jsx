import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api.js';

const emptyMovie = {
  title: '',
  description: '',
  genre: '',
  language: '',
  durationMinutes: 120,
  rating: 7,
  posterUrl: '',
  releaseDate: ''
};

const emptyShow = {
  movie: '',
  theater: '',
  city: '',
  screen: '',
  showTime: '',
  price: 250,
  totalSeats: 40
};

export default function Admin() {
  const [movies, setMovies] = useState([]);
  const [movieForm, setMovieForm] = useState(emptyMovie);
  const [showForm, setShowForm] = useState(emptyShow);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadMovies() {
    setMovies(await api('/movies'));
  }

  useEffect(() => {
    loadMovies().catch((err) => setError(err.message));
  }, []);

  async function addMovie(event) {
    event.preventDefault();
    try {
      setError('');
      await api('/movies', { method: 'POST', body: JSON.stringify(movieForm) });
      setMovieForm(emptyMovie);
      setMessage('Movie added');
      await loadMovies();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addShow(event) {
    event.preventDefault();
    try {
      setError('');
      await api('/shows', { method: 'POST', body: JSON.stringify(showForm) });
      setShowForm(emptyShow);
      setMessage('Show added');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h1>Admin</h1>
      {message && <div className="success">{message}</div>}
      {error && <div className="alert">{error}</div>}

      <div className="admin-grid">
        <form className="admin-form" onSubmit={addMovie}>
          <h2>Add Movie</h2>
          {Object.keys(emptyMovie).map((key) => (
            <label key={key}>
              {key}
              <input
                type={key === 'releaseDate' ? 'date' : ['durationMinutes', 'rating'].includes(key) ? 'number' : 'text'}
                value={movieForm[key]}
                onChange={(event) => setMovieForm({ ...movieForm, [key]: event.target.value })}
                required
              />
            </label>
          ))}
          <button className="button primary"><Plus size={17} /> Add Movie</button>
        </form>

        <form className="admin-form" onSubmit={addShow}>
          <h2>Add Show</h2>
          <label>
            movie
            <select value={showForm.movie} onChange={(event) => setShowForm({ ...showForm, movie: event.target.value })} required>
              <option value="">Select movie</option>
              {movies.map((movie) => <option key={movie._id} value={movie._id}>{movie.title}</option>)}
            </select>
          </label>
          {Object.keys(emptyShow).filter((key) => key !== 'movie').map((key) => (
            <label key={key}>
              {key}
              <input
                type={key === 'showTime' ? 'datetime-local' : ['price', 'totalSeats'].includes(key) ? 'number' : 'text'}
                value={showForm[key]}
                onChange={(event) => setShowForm({ ...showForm, [key]: event.target.value })}
                required
              />
            </label>
          ))}
          <button className="button primary"><Plus size={17} /> Add Show</button>
        </form>
      </div>
    </section>
  );
}
