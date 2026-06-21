import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Clapperboard, Loader2, LogOut, MapPin, Search, Ticket, UserPlus, X, User } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarLetters = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div style={{ position: 'relative' }} ref={wrapRef}>
      <button 
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 12px 4px 4px', borderRadius: '999px', cursor: 'pointer', color: 'white' }}
        className="glass"
      >
        <div className="glow-blue" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gradient-blue)', display: 'grid', placeItems: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
          {avatarLetters}
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user.name.split(' ')[0]}</span>
      </button>

      {open && (
        <div className="glass-strong" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: '180px', borderRadius: '16px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 100, boxShadow: 'var(--shadow-card)' }}>
          <Link to="/profile" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--foreground)', textDecoration: 'none' }}>
            <User size={14} /> Profile
          </Link>
          <Link to="/bookings" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--foreground)', textDecoration: 'none' }}>
            <Ticket size={14} /> My Bookings
          </Link>
          <Link to="/squads" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--foreground)', textDecoration: 'none' }}>
            <Clapperboard size={14} /> My Squads
          </Link>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
          <button onClick={() => { setOpen(false); onLogout(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

function NavSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Debounced search
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await api(`/movies?search=${encodeURIComponent(query.trim())}`);
        setResults(data.slice(0, 8));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(movie) {
    setQuery('');
    setResults([]);
    setOpen(false);
    setFocused(false);
    inputRef.current?.blur();
    navigate(`/movies/${movie._id}`);
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  }

  const showDropdown = open && focused && query.trim().length > 0;

  return (
    <div className="nav-search-wrap" ref={wrapRef}>
      <div className={`nav-search-box${focused ? ' focused' : ''}`}>
        {loading ? (
          <Loader2 size={15} className="spin" />
        ) : (
          <Search size={15} />
        )}
        <input
          ref={inputRef}
          type="text"
          className="nav-search-input"
          placeholder="Search movies…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          aria-label="Search movies"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {query && (
          <button className="nav-search-clear" onClick={handleClear} tabIndex={-1} aria-label="Clear search">
            <X size={13} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="nav-search-dropdown" role="listbox">
          {results.length === 0 ? (
            <div className="nav-search-empty">
              <Search size={18} />
              <span>No results for "{query}"</span>
            </div>
          ) : (
            <>
              <div className="nav-search-label">Movies</div>
              {results.map((movie) => (
                <button
                  key={movie._id}
                  className="nav-search-result"
                  role="option"
                  onClick={() => handleSelect(movie)}
                >
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="nav-search-poster"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="nav-search-meta">
                    <strong>{movie.title}</strong>
                    <span>{movie.genre} · {movie.language}</span>
                  </div>
                  <span className="nav-search-rating">★ {movie.rating?.toFixed(1)}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Nav({ user, onLogout, cities, selectedCity, onCityChange }) {
  return (
    <div className="topbar-wrapper">
      <motion.header className="topbar" initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }}>
        <Link className="brand" to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-blue)] glow-blue" style={{ background: 'var(--gradient-blue)', borderRadius: '12px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ticket size={18} style={{ color: 'white' }} />
          </div>
          <span style={{ fontSize: '1.125rem', fontWeight: 'bold', letterSpacing: '-0.02em' }}>
            Cine<span className="text-gradient-gold">Book</span>
          </span>
        </Link>

      <nav>
        <NavLink to="/movies">Movies</NavLink>
        <NavLink to="/cinemas">Cinemas</NavLink>
        <NavLink to="/offers">Offers</NavLink>
        <NavLink to="/squads" style={{ display: 'flex', alignItems: 'center' }}>
          CineSquad
          <span style={{ fontSize: '0.65rem', background: 'var(--gradient-gold)', color: '#000', padding: '2px 6px', borderRadius: '8px', marginLeft: '6px', fontWeight: 'bold' }}>NEW</span>
        </NavLink>
        {user && <NavLink to="/bookings">My Bookings</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
      </nav>

      <div className="auth-area">
        <NavSearch />

        {/* City selector */}
        {cities.length > 0 && (
          <div className="city-select-wrap">
            <MapPin size={14} className="city-select-icon" />
            <select
              className="city-select"
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              aria-label="Select city"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {user ? (
          <UserDropdown user={user} onLogout={onLogout} />
        ) : (
          <>
            <Link className="button ghost" to="/login">
              <Ticket size={17} />
              Login
            </Link>
            <Link className="button primary" to="/register">
              <UserPlus size={17} />
              Register
            </Link>
          </>
        )}
      </div>
    </motion.header>
    </div>
  );
}
