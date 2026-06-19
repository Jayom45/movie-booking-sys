import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import Admin from './pages/Admin.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import MovieDetails from './pages/MovieDetails.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Register from './pages/Register.jsx';
import { clearSession, getSession, saveSession } from './api.js';

function RequireAuth({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ user, children }) {
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
}

export default function App() {
  const [session, setSession] = useState(() => getSession());
  const navigate = useNavigate();

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

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
      <Nav user={auth.user} onLogout={auth.logout} />
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Home />} />
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
      </main>
    </>
  );
}
