import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import Landing from './pages/Landing.jsx';
import AIButton from './components/AI/AIButton.jsx';

// Every page except the landing page is loaded on demand, so the first visit only
// downloads what it needs. The main booking pages are prefetched once the browser is idle.
const loadHome = () => import('./pages/Home.jsx');
const loadMovieDetails = () => import('./pages/MovieDetails.jsx');
const loadCheckout = () => import('./pages/Checkout.jsx');
const loadMyBookings = () => import('./pages/MyBookings.jsx');

const Home = lazy(loadHome);
const MovieDetails = lazy(loadMovieDetails);
const Checkout = lazy(loadCheckout);
const MyBookings = lazy(loadMyBookings);
const Admin = lazy(() => import('./pages/Admin.jsx'));
const Cinemas = lazy(() => import('./pages/Cinemas.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Offers = lazy(() => import('./pages/Offers.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const SquadLanding = lazy(() => import('./pages/Squads/Landing.jsx'));
const SquadCreate = lazy(() => import('./pages/Squads/Create.jsx'));
const SquadDashboard = lazy(() => import('./pages/Squads/Dashboard.jsx'));
const SquadList = lazy(() => import('./pages/Squads/SquadList.jsx'));

function prefetchBookingPages() {
  [loadHome, loadMovieDetails, loadCheckout, loadMyBookings].forEach((load) => load().catch(() => {}));
}

function PageFallback() {
  return (
    <div className="detail-skeleton">
      <div className="skeleton panel-skeleton" />
    </div>
  );
}
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

  // Warm the cache for the booking flow without competing with the first render
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetchBookingPages, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(prefetchBookingPages, 2000);
    return () => clearTimeout(id);
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
            <Suspense fallback={<PageFallback />}>
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
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <AIButton user={auth.user} />
    </>
  );
}
