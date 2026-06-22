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
  Ticket,
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
              <span className="stat-value">{stats[key] ?? 0}</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Revenue Analytics ────────────────────────────────────────────────────────
function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api(`/admin/analytics?timeRange=${timeRange}`)
      .then(setAnalytics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [timeRange]);

  if (error) return <div className="alert">{error}</div>;

  return (
    <div className="analytics-container">
      <div className="analytics-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Revenue & Performance</h3>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', cursor: 'pointer' }}
        >
          <option value="all">All Time</option>
          <option value="30">Last 30 Days</option>
          <option value="7">Last 7 Days</option>
        </select>
      </div>

      <div className="stat-cards" style={{ marginBottom: '24px' }}>
        {/* Total Revenue */}
        <motion.div className="stat-card glass-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80' }}>
            <span style={{ fontWeight: 'bold' }}>₹</span>
          </div>
          <div className="stat-card-body">
            <span className="stat-label">Total Revenue</span>
            {loading ? <div className="skeleton skeleton-stat" /> : <span className="stat-value">Rs {analytics?.cards?.totalRevenue?.toLocaleString()}</span>}
          </div>
        </motion.div>
        
        {/* Total Bookings */}
        <motion.div className="stat-card glass-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa' }}>
            <BookOpen size={20} />
          </div>
          <div className="stat-card-body">
            <span className="stat-label">Total Bookings</span>
            {loading ? <div className="skeleton skeleton-stat" /> : <span className="stat-value">{analytics?.cards?.totalBookings?.toLocaleString()}</span>}
          </div>
        </motion.div>

        {/* Tickets Sold */}
        <motion.div className="stat-card glass-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(250, 204, 21, 0.1)', color: '#facc15' }}>
            <Ticket size={20} />
          </div>
          <div className="stat-card-body">
            <span className="stat-label">Tickets Sold</span>
            {loading ? <div className="skeleton skeleton-stat" /> : <span className="stat-value">{analytics?.cards?.totalTicketsSold?.toLocaleString()}</span>}
          </div>
        </motion.div>

        {/* Cancellation Rate */}
        <motion.div className="stat-card glass-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171' }}>
            <XCircle size={20} />
          </div>
          <div className="stat-card-body">
            <span className="stat-label">Cancellation Rate</span>
            {loading ? <div className="skeleton skeleton-stat" /> : <span className="stat-value">{analytics?.cards?.cancellationRate}%</span>}
          </div>
        </motion.div>
      </div>

      {/* Insights */}
      <div className="insights-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <motion.div className="glass-panel" style={{ padding: '20px' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <p className="eyebrow" style={{ color: 'var(--gold)' }}>Top Revenue Movie</p>
          {loading ? <div className="skeleton skeleton-title" /> : <h4 style={{ margin: '8px 0 0', fontSize: '1.2rem' }}>{analytics?.insights?.topRevenueMovie}</h4>}
        </motion.div>

        <motion.div className="glass-panel" style={{ padding: '20px' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
          <p className="eyebrow" style={{ color: '#60a5fa' }}>Most Popular Movie</p>
          {loading ? <div className="skeleton skeleton-title" /> : <h4 style={{ margin: '8px 0 0', fontSize: '1.2rem' }}>{analytics?.insights?.mostPopularMovie}</h4>}
        </motion.div>

        <motion.div className="glass-panel" style={{ padding: '20px' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <p className="eyebrow" style={{ color: '#c084fc' }}>Most Active Theatre</p>
          {loading ? <div className="skeleton skeleton-title" /> : <h4 style={{ margin: '8px 0 0', fontSize: '1.2rem' }}>{analytics?.insights?.mostActiveTheatre}</h4>}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Add Movie form ───────────────────────────────────────────────────────────────
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
  { key: 'pricePremium', label: 'Premium Price (Rs)', type: 'number' },
  { key: 'priceGold', label: 'Gold Price (Rs)', type: 'number' },
  { key: 'priceSilver', label: 'Silver Price (Rs)', type: 'number' },
  { key: 'totalSeats', label: 'Total Seats', type: 'number' }
];

function ShowEditModal({ show, onSave, onClose }) {
  const [form, setForm] = useState({
    theater: show.theater,
    city: show.city,
    screen: show.screen,
    showTime: toDatetimeLocal(show.showTime),
    pricePremium: show.prices?.premium || 350,
    priceGold: show.prices?.gold || 250,
    priceSilver: show.prices?.silver || 180,
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
                <th>Prices (P/G/S)</th>
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
                    <td>Rs {show.prices?.premium}/{show.prices?.gold}/{show.prices?.silver}</td>
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

// ─── Add Show form — city / theatre data ─────────────────────────────────────
const CITY_THEATRES = {
  'Mumbai City': ['Metro Cinema', 'PVR Phoenix', 'INOX Nariman Point'],
  'Mumbai Suburban': ['PVR Andheri', 'Cinepolis Andheri', 'INOX Malad'],
  'Navi Mumbai': ['Seawoods Grand Central', 'Inorbit Vashi', 'Nexus Mall'],
  'Thane': ['Viviana Mall', 'Korum Mall', 'Cinepolis Thane'],
};
const CITIES = Object.keys(CITY_THEATRES);

const TIME_SLOTS = [
  { label: '10:00 AM', value: '10:00' },
  { label: '01:00 PM', value: '13:00' },
  { label: '04:00 PM', value: '16:00' },
  { label: '07:00 PM', value: '19:00' },
  { label: '10:00 PM', value: '22:00' },
];

const emptyShowBulk = {
  movie: '',
  city: '',
  theater: '',
  screen: '',
  date: '',
  selectedTimes: [],
  pricePremium: 350,
  priceGold: 250,
  priceSilver: 180,
  totalSeats: 40,
};

function AddShowForm({ movies, shows, setShows }) {
  const [form, setForm] = useState(emptyShowBulk);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { created, duplicates }
  const [error, setError] = useState('');

  // When city changes, reset theatre
  function handleCityChange(city) {
    setForm((prev) => ({ ...prev, city, theater: '' }));
  }

  function toggleTime(val) {
    setForm((prev) => ({
      ...prev,
      selectedTimes: prev.selectedTimes.includes(val)
        ? prev.selectedTimes.filter((t) => t !== val)
        : [...prev.selectedTimes, val],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setResult(null);
    setError('');

    if (form.selectedTimes.length === 0) {
      setError('Please select at least one showtime slot.');
      return;
    }
    if (!form.date) {
      setError('Please select a date.');
      return;
    }

    // Build ISO datetime strings for each selected slot
    const showTimes = form.selectedTimes.map((t) => {
      const [hh, mm] = t.split(':');
      return `${form.date}T${hh.padStart(2, '0')}:${mm}:00`;
    });

    try {
      setSaving(true);
      const data = await api('/shows/bulk', {
        method: 'POST',
        body: JSON.stringify({
          movie:       form.movie,
          theater:     form.theater,
          city:        form.city,
          screen:      form.screen,
          showTimes,
          pricePremium: Number(form.pricePremium),
          priceGold:    Number(form.priceGold),
          priceSilver:  Number(form.priceSilver),
          totalSeats:   Number(form.totalSeats),
        }),
      });

      // Prepend newly created shows to the table
      if (data.created?.length) {
        setShows((prev) => [...data.created, ...prev]);
      }

      setResult(data);
      if (data.created?.length > 0) {
        // Reset form on success (but keep movie selected for convenience)
        setForm((prev) => ({ ...emptyShowBulk, movie: prev.movie, city: prev.city, theater: prev.theater }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const theatresForCity = form.city ? (CITY_THEATRES[form.city] || []) : [];

  return (
    <motion.div
      className="admin-form glass-panel"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
    >
      <span className="premium-label"><Settings size={14} /> Scheduling</span>
      <h2>Add Show</h2>

      <form onSubmit={submit} style={{ display: 'contents' }}>
        {/* ── Movie Information ── */}
        <div className="show-form-section">
          <p className="show-form-section-title"><Film size={13} /> Movie Information</p>
          <label>
            Movie
            <select
              value={form.movie}
              onChange={(e) => setForm({ ...form, movie: e.target.value })}
              required
            >
              <option value="">Select a movie…</option>
              {movies.filter((m) => m.isActive).map((m) => (
                <option key={m._id} value={m._id}>{m.title}</option>
              ))}
            </select>
          </label>
        </div>

        {/* ── Location ── */}
        <div className="show-form-section">
          <p className="show-form-section-title"><Settings size={13} /> Location</p>
          <div className="show-form-row">
            <label>
              City
              <select
                value={form.city}
                onChange={(e) => handleCityChange(e.target.value)}
                required
              >
                <option value="">Select city…</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              Theatre
              <select
                value={form.theater}
                onChange={(e) => setForm({ ...form, theater: e.target.value })}
                required
                disabled={!form.city}
              >
                <option value="">{form.city ? 'Select theatre…' : 'Select city first'}</option>
                {theatresForCity.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>
              Screen
              <input
                type="text"
                placeholder="e.g. Screen 1"
                value={form.screen}
                onChange={(e) => setForm({ ...form, screen: e.target.value })}
                required
              />
            </label>
          </div>
        </div>

        {/* ── Schedule ── */}
        <div className="show-form-section">
          <p className="show-form-section-title"><CalendarClock size={13} /> Schedule</p>
          <label style={{ maxWidth: '220px' }}>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              min={new Date().toISOString().slice(0, 10)}
            />
          </label>
          <div className="show-timeslots-wrap">
            <p style={{ margin: '10px 0 8px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Time Slots</p>
            <div className="show-timeslots-grid">
              {TIME_SLOTS.map(({ label, value }) => (
                <label
                  key={value}
                  className={`timeslot-chip ${form.selectedTimes.includes(value) ? 'timeslot-chip--active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={form.selectedTimes.includes(value)}
                    onChange={() => toggleTime(value)}
                    style={{ display: 'none' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pricing ── */}
        <div className="show-form-section">
          <p className="show-form-section-title"><Ticket size={13} /> Pricing &amp; Capacity</p>
          <div className="show-form-row">
            <label>
              Premium (Rs)
              <input type="number" min={0} value={form.pricePremium} onChange={(e) => setForm({ ...form, pricePremium: e.target.value })} required />
            </label>
            <label>
              Gold (Rs)
              <input type="number" min={0} value={form.priceGold} onChange={(e) => setForm({ ...form, priceGold: e.target.value })} required />
            </label>
            <label>
              Silver (Rs)
              <input type="number" min={0} value={form.priceSilver} onChange={(e) => setForm({ ...form, priceSilver: e.target.value })} required />
            </label>
            <label>
              Total Seats
              <input type="number" min={1} value={form.totalSeats} onChange={(e) => setForm({ ...form, totalSeats: e.target.value })} required />
            </label>
          </div>
        </div>

        {/* ── Feedback ── */}
        {result && (
          <div className="show-bulk-result">
            {result.created?.length > 0 && (
              <div className="show-bulk-success">
                <CheckCircle2 size={15} />
                <span>{result.created.length} show{result.created.length > 1 ? 's' : ''} created successfully.</span>
              </div>
            )}
            {result.duplicates?.length > 0 && (
              <div className="show-bulk-warn">
                <XCircle size={15} />
                <span>{result.duplicates.length} slot{result.duplicates.length > 1 ? 's' : ''} skipped — duplicate already exists.</span>
              </div>
            )}
          </div>
        )}
        {error && <div className="alert">{error}</div>}

        <button
          type="submit"
          className="button primary"
          disabled={saving}
          style={{ marginTop: '4px', alignSelf: 'flex-start' }}
        >
          <Plus size={17} />
          {saving
            ? 'Creating…'
            : form.selectedTimes.length > 1
            ? `Create ${form.selectedTimes.length} Shows`
            : 'Create Show'
          }
        </button>
      </form>
    </motion.div>
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

      <section className="admin-section">
        <div className="admin-section-label">
          <p className="eyebrow">Platform overview</p>
        </div>
        <OverviewCards stats={stats} loading={statsLoading} />
      </section>

      {/* ── Revenue & Analytics ── */}
      <section className="admin-section">
        <div className="admin-section-label">
          <p className="eyebrow">Analytics</p>
        </div>
        <AdminAnalytics />
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
