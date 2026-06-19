import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import Admin from './pages/Admin.jsx';
import Cinemas from './pages/Cinemas.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import MovieDetails from './pages/MovieDetails.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Offers from './pages/Offers.jsx';
import Register from './pages/Register.jsx';
import { api, clearSession, getSession, saveSession } from './api.js';

function RequireAuth({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ user, children }) {
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
}

// Persist the selected city for the session
function getStoredCity() {
  return sessionStorage.getItem('cinebook-city') || '';
}
function storeCity(city) {
  sessionStorage.setItem('cinebook-city', city);
}

export default function App() {
  const [session, setSession] = useState(() => getSession());
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(getStoredCity);
  const navigate = useNavigate();

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  // Fetch cities once on app mount
  useEffect(() => {
    api('/shows/meta/cities').then(setCities).catch(() => {});
  }, []);

  function handleCityChange(city) {
    setSelectedCity(city);
    storeCity(city);
  }

  const auth = useMemo(
    () => ({
      user: session?.user || null,
      login(nextSession) {
        setSession(nextSession);
        saveSession(nextSession);
        navigate('/');
      },
      logout() {
        clearSession();
        setSession(null);
        navigate('/login');
      }
    }),
    [navigate, session]
  );

  return (
    <>
      <Nav
        user={auth.user}
        onLogout={auth.logout}
        cities={cities}
        selectedCity={selectedCity}
        onCityChange={handleCityChange}
      />
      <main className="app-shell">
        <AnimatePresence mode="wait">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <Routes>
              <Route path="/" element={<Home selectedCity={selectedCity} />} />
              <Route path="/cinemas" element={<Cinemas selectedCity={selectedCity} />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/movies/:id" element={<MovieDetails user={auth.user} />} />
              <Route path="/login" element={<Login onLogin={auth.login} />} />
              <Route path="/register" element={<Register onLogin={auth.login} />} />
              <Route
                path="/bookings"
                element={
                  <RequireAuth user={auth.user}>
                    <MyBookings />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAdmin user={auth.user}>
                    <Admin />
                  </RequireAdmin>
                }
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
