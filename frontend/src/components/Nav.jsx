import { motion } from 'framer-motion';
import { Clapperboard, LogOut, MapPin, Search, Ticket, UserPlus } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

export default function Nav({ user, onLogout }) {
  return (
    <motion.header className="topbar" initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }}>
      <Link className="brand" to="/">
        <Clapperboard size={24} />
        <span>CineBook</span>
      </Link>

      <nav>
        <NavLink to="/">Movies</NavLink>
        <NavLink to="/cinemas">Cinemas</NavLink>
        <NavLink to="/offers">Offers</NavLink>
        {user && <NavLink to="/bookings">My Bookings</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
      </nav>

      <div className="auth-area">
        <span className="nav-search"><Search size={15} /> Search</span>
        {user ? (
          <>
            <span className="city-pill"><MapPin size={15} /> Mumbai</span>
            <span className="user-pill">{user.name}</span>
            <button className="icon-button" onClick={onLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </>
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
  );
}
