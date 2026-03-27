import { useAuth } from '../context/AuthContext';

export default function BottomNav({ page, setPage }) {
  const { user } = useAuth();

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <button
        id="bn-feed"
        className={`bottom-nav-btn ${page === 'feed' ? 'active' : ''}`}
        onClick={() => setPage('feed')}
        aria-current={page === 'feed' ? 'page' : undefined}
      >
        <span className="nav-icon">📋</span>
        <span>Feed</span>
      </button>

      <button
        id="bn-post"
        className={`bottom-nav-btn ${page === 'post' ? 'active' : ''}`}
        onClick={() => user ? setPage('post') : setPage('auth')}
        aria-current={page === 'post' ? 'page' : undefined}
      >
        <span className="nav-icon">➕</span>
        <span>Post Swap</span>
      </button>

      <button
        id="bn-dashboard"
        className={`bottom-nav-btn ${page === 'dashboard' ? 'active' : ''}`}
        onClick={() => user ? setPage('dashboard') : setPage('auth')}
        aria-current={page === 'dashboard' ? 'page' : undefined}
      >
        <span className="nav-icon">🎯</span>
        <span>My Matches</span>
      </button>
    </nav>
  );
}
