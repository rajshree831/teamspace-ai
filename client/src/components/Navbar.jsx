import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">TeamSpace AI</Link>

        <div className="navbar-links">
          <Link to="/dashboard" className="navbar-link">Dashboard</Link>
          <Link to="/teams" className="navbar-link">My Teams</Link>
        </div>

        <div className="navbar-right">
          <span className="navbar-user">{user?.name}</span>
          <button onClick={handleLogout} className="btn btn-secondary navbar-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;