import { motion } from 'framer-motion';
import { Armchair, Clock, MapPin, MonitorPlay, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

function formatDate(value) {
  return new Date(value).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Cinemas() {
  const [shows, setShows] = useState([]);
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const query = city ? `?city=${encodeURIComponent(city)}` : '';
        const [showData, cityData] = await Promise.all([api(`/shows${query}`), api('/shows/meta/cities')]);
        setShows(showData);
        setCities(cityData);
        setError('');
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, [city]);

  const cinemaGroups = useMemo(() => {
    const filtered = shows.filter((show) => `${show.theater} ${show.city}`.toLowerCase().includes(search.toLowerCase()));
    return filtered.reduce((groups, show) => {
      const key = `${show.theater}-${show.city}`;
      if (!groups[key]) groups[key] = { theater: show.theater, city: show.city, shows: [] };
      groups[key].shows.push(show);
      return groups;
    }, {});
  }, [search, shows]);

  const cinemas = Object.values(cinemaGroups);

  return (
    <section>
      <div className="page-hero compact-hero">
        <p className="eyebrow">Premium screens</p>
        <h1>Cinemas built for the big screen.</h1>
        <p>Find IMAX-style screens, recliner seats, and instant booking across your favorite theaters.</p>
      </div>

      <div className="discovery-bar">
        <div className="search-box">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cinema or city" />
        </div>
        <div className="chip-row">
          <button className={!city ? 'chip active' : 'chip'} onClick={() => setCity('')}>All cities</button>
          {cities.map((item) => (
            <button className={city === item ? 'chip active' : 'chip'} key={item} onClick={() => setCity(item)}>
              <MapPin size={14} /> {item}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      {cinemas.length === 0 && !error ? (
        <div className="empty-state"><MonitorPlay size={34} /><h2>No cinemas found</h2><p>Try changing your city or search.</p></div>
      ) : (
        <div className="cinema-list">
          {cinemas.map((cinema, index) => (
            <motion.article className="cinema-card" key={`${cinema.theater}-${cinema.city}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <div className="cinema-head">
                <div>
                  <span className="premium-label"><Sparkles size={14} /> Premium</span>
                  <h2>{cinema.theater}</h2>
                  <p><MapPin size={15} /> {cinema.city}</p>
                </div>
                <span><MonitorPlay size={16} /> {cinema.shows.length} shows</span>
              </div>
              <div className="amenity-row">
                <span><Armchair size={15} /> Recliner seats</span>
                <span><Clock size={15} /> Instant booking</span>
              </div>
              <div className="cinema-shows">
                {cinema.shows.slice(0, 5).map((show) => (
                  <Link className="time-pill" key={show._id} to={`/movies/${show.movie._id}`}>
                    {formatTime(show.showTime)}
                    <small>{show.movie.title} | {formatDate(show.showTime)}</small>
                  </Link>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
