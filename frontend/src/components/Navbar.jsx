import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Navbar({ page, setPage }) {
  const { user, logout } = useAuth();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast('Logged out.', 'info');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a
          href="#"
          className="navbar-logo"
          id="nav-logo"
          onClick={(e) => { e.preventDefault(); setPage('feed'); }}
        >
          <div className="logo-icon">🔄</div>
          <span>HTU Swap</span>
        </a>

        <div className="navbar-actions">
          {user ? (
            <>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'none' }}
                className="nav-name">
                {user.name}
              </span>
              <button
                id="nav-logout"
                className="btn btn-ghost btn-sm"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              id="nav-signin"
              className="btn btn-primary btn-sm"
              onClick={() => setPage('auth')}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
