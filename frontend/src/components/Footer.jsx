import { Link, useLocation } from 'react-router-dom';
import { Ticket, Instagram, Twitter, Youtube, Facebook } from 'lucide-react';

export default function Footer() {
  const location = useLocation();
  const hiddenRoutes = ['/admin', '/login', '/register', '/checkout'];
  
  // Hide footer on specific routes
  if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  return (
    <footer className="global-footer">
      <div className="footer-content">
        <div className="footer-grid">
          {/* Column 1: Brand */}
          <div className="footer-col brand-col">
            <Link to="/" className="footer-logo">
              <Ticket className="text-cyan" size={24} />
              <span>CineBook</span>
            </Link>
            <p className="footer-desc">
              Premium movie ticket booking platform for cinema lovers.
            </p>
            <div className="social-icons">
              <a href="#" aria-label="Instagram"><Instagram size={16} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={16} /></a>
              <a href="#" aria-label="YouTube"><Youtube size={16} /></a>
              <a href="#" aria-label="Facebook"><Facebook size={16} /></a>
            </div>
          </div>

          {/* Column 2: Explore */}
          <div className="footer-col">
            <h3 className="footer-heading">Explore</h3>
            <ul className="footer-links">
              <li><Link to="/">Movies</Link></li>
              <li><Link to="/offers">Offers</Link></li>
              <li><Link to="/bookings">My Bookings</Link></li>
              <li><Link to="/profile">Profile</Link></li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="footer-col">
            <h3 className="footer-heading">Support</h3>
            <ul className="footer-links">
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">FAQs</a></li>
              <li><a href="#">Refund Policy</a></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="footer-col">
            <h3 className="footer-heading">Legal</h3>
            <ul className="footer-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookies</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; 2026 CineBook. All rights reserved.</p>
          <p>Built for movie lovers.</p>
        </div>
      </div>
    </footer>
  );
}
