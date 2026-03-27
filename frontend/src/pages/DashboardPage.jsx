import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MatchCard from '../components/MatchCard';
import RequestCard from '../components/RequestCard';

export default function DashboardPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState('requests');
  const [myRequests, setMyRequests] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const fetchRequests = () => {
    setLoadingReqs(true);
    api.get('/requests/mine', token)
      .then(setMyRequests)
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoadingReqs(false));
  };

  const fetchMatches = () => {
    setLoadingMatches(true);
    api.get('/matches/me', token)
      .then(setMyMatches)
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoadingMatches(false));
  };

  useEffect(() => {
    fetchRequests();
    fetchMatches();
  }, []);

  const handleDelete = async (requestId) => {
    try {
      await api.del(`/requests/${requestId}`, token);
      toast('Request deleted.', 'success');
      fetchRequests();
      fetchMatches();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const matchCount = myMatches.length;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div className="page-title">My Dashboard</div>
          <div className="page-subtitle">Track your requests and matches</div>
        </div>

        <div className="tab-bar">
          <button
            id="tab-requests"
            className={`tab-btn ${tab === 'requests' ? 'active' : ''}`}
            onClick={() => setTab('requests')}
          >
            📋 My Requests
          </button>
          <button
            id="tab-matches"
            className={`tab-btn ${tab === 'matches' ? 'active' : ''}`}
            onClick={() => setTab('matches')}
          >
            🎯 Matches {matchCount > 0 ? `(${matchCount})` : ''}
          </button>
        </div>

        {tab === 'requests' && (
          <>
            {loadingReqs ? (
              <div className="loading-screen">
                <div className="spinner" />
                <span>Loading your requests…</span>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <div className="empty-state-title">No requests yet</div>
                <div className="empty-state-desc">Go to "Post Swap" to submit your first section swap request.</div>
              </div>
            ) : (
              <div className="card">
                {myRequests.map((r) => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    showDelete
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'matches' && (
          <>
            {loadingMatches ? (
              <div className="loading-screen">
                <div className="spinner" />
                <span>Looking for matches…</span>
              </div>
            ) : myMatches.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No matches yet</div>
                <div className="empty-state-desc">
                  Hang tight! You'll be notified here when a compatible swap partner is found.
                </div>
              </div>
            ) : (
              myMatches.map((m) => (
                <MatchCard
                  key={m.match_id}
                  match={m}
                  onDelete={handleDelete}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
