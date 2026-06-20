import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clapperboard,
  EyeOff,
  Film,
  MonitorPlay,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const ALLOWED_GENRES = [
  'Action', 'Comedy', 'Drama', 'Fantasy', 'Horror', 
  'Romance', 'Science Fiction', 'Sports', 'Thriller'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(value) {
  return new Date(value).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtDateTime(value) {
  return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function toDatetimeLocal(value) {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Confirmation dialog ──────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <motion.div
        className="modal-box confirm-box"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
      >
        <XCircle size={32} className="confirm-icon" />
        <h3>Are you sure?</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="button primary danger-btn" onClick={onConfirm}>Yes, delete</button>
          <button className="button glass" onClick={onCancel}>Cancel</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Overview stat cards ──────────────────────────────────────────────────────
const statMeta = [
  { key: 'movies', label: 'Total Movies', Icon: Film },
  { key: 'shows', label: 'Total Shows', Icon: CalendarClock },
  { key: 'users', label: 'Total Users', Icon: Users },
  { key: 'bookings', label: 'Total Bookings', Icon: BookOpen }
];

function OverviewCards({ stats, loading }) {
  return (
    <div className="stat-cards">
      {statMeta.map(({ key, label, Icon }, i) => (
        <motion.div
          className="stat-card glass-panel"
          key={key}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="stat-icon-wrap">
            <Icon size={20} />
          </div>
          <div className="stat-card-body">
            <span className="stat-label">{label}</span>
            {loading ? (
              <div className="skeleton skeleton-stat" />
            ) : (
              <strong className="stat-value">{stats[key] ?? '—'}</strong>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Movie edit modal ─────────────────────────────────────────────────────────
const movieFields = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'description', label: 'Description', type: 'text' },
  { key: 'genre', label: 'Genre', type: 'multiselect' },
  { key: 'language', label: 'Language', type: 'text' },
  { key: 'durationMinutes', label: 'Duration (mins)', type: 'number' },
  { key: 'posterUrl', label: 'Poster URL', type: 'text' },
  { key: 'trailerUrl', label: 'Trailer URL', type: 'text' },
  { key: 'releaseDate', label: 'Release Date', type: 'date' }
];

function MovieEditModal({ movie, onSave, onClose }) {
  const [form, setForm] = useState({
    title: movie.title,
    description: movie.description,
    genre: Array.isArray(movie.genre) ? movie.genre : [],
    language: movie.language,
    durationMinutes: movie.durationMinutes,
    posterUrl: movie.posterUrl,
    trailerUrl: movie.trailerUrl || '',
    releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().slice(0, 10) : ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const updated = await api(`/movies/${movie._id}`, { method: 'PUT', body: JSON.stringify(form) });
      onSave(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow"><Pencil size={13} /> Edit Movie</p>
            <h3>{movie.title}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSave} className="modal-form">
          {movieFields.map(({ key, label, type }) => (
            <div key={key}>
              {type === 'multiselect' ? (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '8px' }}>{label}</label>
                  <div className="genre-grid">
                    {ALLOWED_GENRES.map(g => (
                      <label key={g} className="genre-checkbox">
                        <input
                          type="checkbox"
                          checked={form[key].includes(g)}
                          onChange={(e) => {
                            if (e.target.checked) setForm({ ...form, [key]: [...form[key], g] });
                            else setForm({ ...form, [key]: form[key].filter(x => x !== g) });
                          }}
                        /> {g}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <label>
                  {label}
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                  />
                </label>
              )}
            </div>
          ))}
          {error && <div className="alert">{error}</div>}
          <div className="modal-actions">
            <button className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" className="button glass" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Show edit modal ──────────────────────────────────────────────────────────
const showEditFields = [
  { key: 'theater', label: 'Theatre', type: 'text' },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'screen', label: 'Screen', type: 'text' },
  { key: 'showTime', label: 'Show Time', type: 'datetime-local' },
  { key: 'price', label: 'Price (Rs)', type: 'number' },
  { key: 'totalSeats', label: 'Total Seats', type: 'number' }
];

function ShowEditModal({ show, onSave, onClose }) {
  const [form, setForm] = useState({
    theater: show.theater,
    city: show.city,
    screen: show.screen,
    showTime: toDatetimeLocal(show.showTime),
    price: show.price,
    totalSeats: show.totalSeats
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const updated = await api(`/shows/${show._id}`, { method: 'PUT', body: JSON.stringify(form) });
      onSave(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const movieTitle = show.movie?.title || 'Unknown Movie';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow"><Settings size={13} /> Edit Show</p>
            <h3>{movieTitle}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSave} className="modal-form">
          {showEditFields.map(({ key, label, type }) => (
            <label key={key}>
              {label}
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required
              />
            </label>
          ))}
          {error && <div className="alert">{error}</div>}
          <div className="modal-actions">
            <button className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" className="button glass" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Movie Management Section ─────────────────────────────────────────────────
function MovieManagement({ movies, setMovies, loading }) {
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return movies.filter(
      (m) => m.title.toLowerCase().includes(q) || m.genre.toLowerCase().includes(q) || m.language.toLowerCase().includes(q)
    );
  }, [movies, search]);

  function handleEdited(updated) {
    setMovies((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
    setEditTarget(null);
  }

  async function handleDelete(id) {
    try {
      setBusy(id);
      await api(`/movies/${id}`, { method: 'DELETE' });
      setMovies((prev) => prev.map((m) => (m._id === id ? { ...m, isActive: false } : m)));
    } finally {
      setBusy('');
      setDeleteTarget(null);
    }
  }

  async function handleToggle(movie) {
    try {
      setBusy(movie._id);
      const updated = await api(`/movies/${movie._id}/toggle`, { method: 'PATCH' });
      setMovies((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="mgmt-section glass-panel">
      <div className="mgmt-header">
        <div>
          <span className="premium-label"><MonitorPlay size={14} /> Catalog</span>
          <h2>Movie Management</h2>
        </div>
        <div className="mgmt-search">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movies…" />
        </div>
      </div>

      {loading ? (
        <div className="mgmt-skeleton">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton mgmt-row-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '160px' }}>
          <Film size={28} /><h2>No movies found</h2>
        </div>
      ) : (
        <div className="mgmt-table-wrap">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Poster</th>
                <th>Title</th>
                <th>Genre</th>
                <th>Language</th>
                <th>Rating</th>
                <th>Reviews</th>
                <th>Release</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((movie) => (
                <tr key={movie._id} className={movie.isActive ? '' : 'row-inactive'}>
                  <td>
                    <img className="mgmt-poster" src={movie.posterUrl} alt={movie.title} />
                  </td>
                  <td><strong>{movie.title}</strong></td>
                  <td><span className="mgmt-badge">{movie.genre}</span></td>
                  <td>{movie.language}</td>
                  <td>
                    <span className="mgmt-rating">{movie.rating.toFixed(1)}</span>
                  </td>
                  <td>{movie.reviewCount ?? 0}</td>
                  <td>{fmt(movie.releaseDate)}</td>
                  <td>
                    {movie.isActive
                      ? <span className="status-pill active"><CheckCircle2 size={12} /> Active</span>
                      : <span className="status-pill inactive"><EyeOff size={12} /> Hidden</span>
                    }
                  </td>
                  <td>
                    <div className="action-group">
                      <button
                        className="tbl-btn edit"
                        title="Edit"
                        onClick={() => setEditTarget(movie)}
                        disabled={busy === movie._id}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={`tbl-btn toggle ${movie.isActive ? '' : 'restore'}`}
                        title={movie.isActive ? 'Hide' : 'Restore'}
                        onClick={() => handleToggle(movie)}
                        disabled={busy === movie._id}
                      >
                        {movie.isActive ? <EyeOff size={14} /> : <CheckCircle2 size={14} />}
                      </button>
                      <button
                        className="tbl-btn del"
                        title="Delete"
                        onClick={() => setDeleteTarget(movie._id)}
                        disabled={busy === movie._id}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {editTarget && (
          <MovieEditModal
            key="movie-edit"
            movie={editTarget}
            onSave={handleEdited}
            onClose={() => setEditTarget(null)}
          />
        )}
        {deleteTarget && (
          <ConfirmDialog
            key="movie-delete"
            message="This will hide the movie from all listings. Are you sure?"
            onConfirm={() => handleDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Show Management Section ──────────────────────────────────────────────────
function ShowManagement({ shows, setShows, loading }) {
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return shows.filter(
      (s) =>
        (s.movie?.title || '').toLowerCase().includes(q) ||
        s.theater.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
    );
  }, [shows, search]);

  function handleEdited(updated) {
    setShows((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    setEditTarget(null);
  }

  async function handleDelete(id) {
    try {
      setBusy(id);
      await api(`/shows/${id}`, { method: 'DELETE' });
      setShows((prev) => prev.filter((s) => s._id !== id));
    } finally {
      setBusy('');
      setDeleteTarget(null);
    }
  }

  return (
    <div className="mgmt-section glass-panel">
      <div className="mgmt-header">
        <div>
          <span className="premium-label"><Settings size={14} /> Scheduling</span>
          <h2>Show Management</h2>
        </div>
        <div className="mgmt-search">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shows…" />
        </div>
      </div>

      {loading ? (
        <div className="mgmt-skeleton">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton mgmt-row-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '160px' }}>
          <CalendarClock size={28} /><h2>No shows found</h2>
        </div>
      ) : (
        <div className="mgmt-table-wrap">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Theatre</th>
                <th>City</th>
                <th>Screen</th>
                <th>Show Time</th>
                <th>Price</th>
                <th>Total</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((show) => {
                const available = show.totalSeats - (show.bookedSeats?.length || 0);
                return (
                  <tr key={show._id}>
                    <td><strong>{show.movie?.title || '—'}</strong></td>
                    <td>{show.theater}</td>
                    <td><span className="mgmt-badge">{show.city}</span></td>
                    <td>{show.screen}</td>
                    <td>{fmtDateTime(show.showTime)}</td>
                    <td>Rs {show.price}</td>
                    <td>{show.totalSeats}</td>
                    <td>
                      <span className={`mgmt-seats ${available === 0 ? 'seats-full' : ''}`}>
                        {available}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          className="tbl-btn edit"
                          title="Edit"
                          onClick={() => setEditTarget(show)}
                          disabled={busy === show._id}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="tbl-btn del"
                          title="Delete"
                          onClick={() => setDeleteTarget(show._id)}
                          disabled={busy === show._id}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {editTarget && (
          <ShowEditModal
            key="show-edit"
            show={editTarget}
            onSave={handleEdited}
            onClose={() => setEditTarget(null)}
          />
        )}
        {deleteTarget && (
          <ConfirmDialog
            key="show-delete"
            message="This will permanently delete the show. Existing bookings will not be affected."
            onConfirm={() => handleDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Add Movie form ───────────────────────────────────────────────────────────
const emptyMovie = {
  title: '', description: '', genre: [], language: '',
  durationMinutes: 120, rating: 7, posterUrl: '', trailerUrl: '', releaseDate: ''
};

const movieLabelMap = {
  title: 'Title',
  description: 'Description',
  genre: 'Genre',
  language: 'Language',
  durationMinutes: 'Duration (min)',
  rating: 'Rating (0–10)',
  posterUrl: 'Poster URL',
  releaseDate: 'Release Date'
};

function AddMovieForm({ movies, setMovies }) {
  const [form, setForm] = useState(emptyMovie);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const created = await api('/movies', { method: 'POST', body: JSON.stringify(form) });
      setMovies((prev) => [created, ...prev]);
      setForm(emptyMovie);
      setMessage('Movie added successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.form className="admin-form glass-panel" onSubmit={submit} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <span className="premium-label"><MonitorPlay size={14} /> Catalog</span>
      <h2>Add Movie</h2>
      {Object.keys(emptyMovie).map((key) => (
        <div key={key}>
          {key === 'genre' ? (
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>{movieLabelMap[key]}</label>
              <div className="genre-grid">
                {ALLOWED_GENRES.map(g => (
                  <label key={g} className="genre-checkbox">
                    <input
                      type="checkbox"
                      checked={form[key].includes(g)}
                      onChange={(e) => {
                        if (e.target.checked) setForm({ ...form, [key]: [...form[key], g] });
                        else setForm({ ...form, [key]: form[key].filter(x => x !== g) });
                      }}
                    /> {g}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <label>
              {movieLabelMap[key] || key}
              <input
                type={key === 'releaseDate' ? 'date' : ['durationMinutes', 'rating'].includes(key) ? 'number' : 'text'}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required
              />
            </label>
          )}
        </div>
      ))}
      {message && <div className="success">{message}</div>}
      {error && <div className="alert">{error}</div>}
      <button className="button primary" disabled={saving}><Plus size={17} /> {saving ? 'Adding…' : 'Add Movie'}</button>
    </motion.form>
  );
}

// ─── Add Show form ────────────────────────────────────────────────────────────
const emptyShow = { movie: '', theater: '', city: '', screen: '', showTime: '', price: 250, totalSeats: 40 };

const showLabelMap = {
  theater: 'Theatre',
  city: 'City',
  screen: 'Screen',
  showTime: 'Show Time',
  price: 'Price (Rs)',
  totalSeats: 'Total Seats'
};

function AddShowForm({ movies, shows, setShows }) {
  const [form, setForm] = useState(emptyShow);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const created = await api('/shows', { method: 'POST', body: JSON.stringify(form) });
      setShows((prev) => [created, ...prev]);
      setForm(emptyShow);
      setMessage('Show added successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.form className="admin-form glass-panel" onSubmit={submit} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
      <span className="premium-label"><Settings size={14} /> Scheduling</span>
      <h2>Add Show</h2>
      <label>
        Movie
        <select value={form.movie} onChange={(e) => setForm({ ...form, movie: e.target.value })} required>
          <option value="">Select movie</option>
          {movies.filter((m) => m.isActive).map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
        </select>
      </label>
      {Object.keys(emptyShow).filter((k) => k !== 'movie').map((key) => (
        <label key={key}>
          {showLabelMap[key] || key}
          <input
            type={key === 'showTime' ? 'datetime-local' : ['price', 'totalSeats'].includes(key) ? 'number' : 'text'}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            required
          />
        </label>
      ))}
      {message && <div className="success">{message}</div>}
      {error && <div className="alert">{error}</div>}
      <button className="button primary" disabled={saving}><Plus size={17} /> {saving ? 'Adding…' : 'Add Show'}</button>
    </motion.form>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const [stats, setStats] = useState({});
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [showsLoading, setShowsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load all three in parallel
    Promise.all([
      api('/admin/stats'),
      api('/movies/admin/all'),
      api('/shows/admin/all')
    ])
      .then(([statsData, moviesData, showsData]) => {
        setStats(statsData);
        setMovies(moviesData);
        setShows(showsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setStatsLoading(false);
        setMoviesLoading(false);
        setShowsLoading(false);
      });
  }, []);

  return (
    <section className="admin-page">
      {/* ── Hero ── */}
      <div className="page-hero compact-hero">
        <p className="eyebrow"><Clapperboard size={14} /> Studio control</p>
        <h1>Admin Console</h1>
        <p>Manage your catalog, schedule shows, and monitor your platform — all in one place.</p>
      </div>

      {error && <div className="alert">{error}</div>}

      {/* ── Overview cards ── */}
      <section className="admin-section">
        <div className="admin-section-label">
          <p className="eyebrow">Platform overview</p>
        </div>
        <OverviewCards stats={stats} loading={statsLoading} />
      </section>

      {/* ── Add forms ── */}
      <section className="admin-section">
        <div className="admin-section-label">
          <p className="eyebrow">Create new</p>
        </div>
        <div className="admin-grid">
          <AddMovieForm movies={movies} setMovies={setMovies} />
          <AddShowForm movies={movies} shows={shows} setShows={setShows} />
        </div>
      </section>

      {/* ── Movie management ── */}
      <section className="admin-section">
        <div className="admin-section-label">
          <p className="eyebrow">Manage existing</p>
        </div>
        <MovieManagement movies={movies} setMovies={setMovies} loading={moviesLoading} />
      </section>

      {/* ── Show management ── */}
      <section className="admin-section">
        <ShowManagement shows={shows} setShows={setShows} loading={showsLoading} />
      </section>
    </section>
  );
}
