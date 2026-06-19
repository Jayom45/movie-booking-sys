import { Film, LogOut, Ticket, UserPlus } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

export default function Nav({ user, onLogout }) {
  return (
    <header className="topbar">
      <Link className="brand" to="/">
        <Film size={24} />
        <span>CineBook</span>
      </Link>

      <nav>
        <NavLink to="/">Movies</NavLink>
        {user && <NavLink to="/bookings">My Bookings</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
      </nav>

      <div className="auth-area">
        {user ? (
          <>
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
    </header>
  );
}
