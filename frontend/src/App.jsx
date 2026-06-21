import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import Admin from './pages/Admin.jsx';
import Cinemas from './pages/Cinemas.jsx';
import Home from './pages/Home.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import MovieDetails from './pages/MovieDetails.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Checkout from './pages/Checkout.jsx';
import Offers from './pages/Offers.jsx';
import Profile from './pages/Profile.jsx';
import Register from './pages/Register.jsx';
import SquadLanding from './pages/Squads/Landing.jsx';
import SquadCreate from './pages/Squads/Create.jsx';
import SquadDashboard from './pages/Squads/Dashboard.jsx';
import SquadList from './pages/Squads/SquadList.jsx';
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
              <Route path="/" element={<Landing user={auth.user} />} />
              <Route path="/movies" element={<Home selectedCity={selectedCity} />} />
              <Route path="/cinemas" element={<Cinemas selectedCity={selectedCity} />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/movies/:id" element={<MovieDetails user={auth.user} />} />
              <Route path="/login" element={<Login onLogin={auth.login} />} />
              <Route path="/register" element={<Register onLogin={auth.login} />} />
              <Route
                path="/profile"
                element={
                  <RequireAuth user={auth.user}>
                    <Profile session={session} setSession={setSession} />
                  </RequireAuth>
                }
              />
              <Route
                path="/bookings"
                element={
                  <RequireAuth user={auth.user}>
                    <MyBookings user={auth.user} />
                  </RequireAuth>
                }
              />
              <Route path="/squads" element={<SquadLanding user={auth.user} />} />
              <Route
                path="/squads/create"
                element={
                  <RequireAuth user={auth.user}>
                    <SquadCreate cities={cities} />
                  </RequireAuth>
                }
              />
              <Route
                path="/squads/dashboard"
                element={
                  <RequireAuth user={auth.user}>
                    <SquadList />
                  </RequireAuth>
                }
              />
              <Route
                path="/squads/:id"
                element={
                  <RequireAuth user={auth.user}>
                    <SquadDashboard user={auth.user} />
                  </RequireAuth>
                }
              />
              <Route
                path="/checkout"
                element={
                  <RequireAuth user={auth.user}>
                    <Checkout />
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
      <Footer />
    </>
  );
}
